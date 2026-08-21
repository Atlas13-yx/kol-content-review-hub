/**
 * 广汽国际出海 KOL 营销管理系统 - 安全与合规工具集
 * 严格遵从企业应用安全与合规基线规范：
 * 1. 导出 Excel / CSV 防公式与 DDE 注入 (2.4.2)
 * 2. 敏感数据脱敏处理 (8.1 / 9.2)
 * 3. 密码复杂度与防暴力破解策略 (1.1.1 / 1.3.1)
 * 4. AI 提示词注入清洗 (11.2.1)
 */

/**
 * 2.4.2 导出 Excel 防公式注入清洗
 * 对导出单元格内容进行安全转义，如果开头包含 =, +, -, @, \t, \r 等字符，
 * 自动前置单引号 (')，确保 Excel / WPS / Numbers 打开时不会被解释为公式或宏命令。
 */
export function sanitizeForSpreadsheet(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value).trim();
  if (!str) return '';

  // 检查是否以危险公式字符开头
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r', '%'];
  const firstChar = str.charAt(0);

  if (dangerousPrefixes.includes(firstChar)) {
    // 纯负数数字如果是合法数字则允许，否则加单引号
    if (firstChar === '-' && !isNaN(Number(str))) {
      return str;
    }
    return `'${str}`;
  }

  // 过滤内部可能隐藏的 DDE 或 CMD 执行字符
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
}

/**
 * 8.1 / 9.2 敏感数据脱敏函数 (Masking)
 * 支持邮箱、电话/WhatsApp、报价金额、个人姓名与银行账号脱敏
 */
export function maskSensitiveData(
  val: string | number | undefined | null,
  type: 'email' | 'phone' | 'contact' | 'cost' | 'name' | 'general' = 'general'
): string {
  if (val === undefined || val === null) return '-';
  const str = String(val).trim();
  if (!str) return '-';

  switch (type) {
    case 'email': {
      // 邮箱脱敏：j***@domain.com
      const atIdx = str.indexOf('@');
      if (atIdx > 1) {
        const username = str.substring(0, atIdx);
        const domain = str.substring(atIdx);
        const maskedUser = username.length <= 2
          ? username.charAt(0) + '***'
          : username.charAt(0) + '***' + username.charAt(username.length - 1);
        return maskedUser + domain;
      }
      return str.charAt(0) + '***';
    }

    case 'phone':
    case 'contact': {
      // 电话/联系方式脱敏：保留前3位与后2位，中间打码
      if (str.length >= 7) {
        return str.substring(0, 3) + '****' + str.substring(str.length - 2);
      }
      return str.substring(0, 2) + '***';
    }

    case 'cost': {
      // 报价脱敏：¥15,000 -> ¥1*,000 或 ●●●●●
      if (/[\d,.]+/.test(str)) {
        return str.replace(/\d/g, (match, offset) => (offset > 1 && offset < str.length - 2 ? '*' : match));
      }
      return '●●●●●';
    }

    case 'name': {
      // 姓名脱敏
      if (str.length <= 2) {
        return str.charAt(0) + '*';
      }
      return str.charAt(0) + '**' + str.charAt(str.length - 1);
    }

    case 'general':
    default: {
      if (str.length <= 3) return '***';
      return str.substring(0, 2) + '***' + str.substring(str.length - 1);
    }
  }
}

/**
 * 1.3.1 密码强度校验算法
 * 规则：长度至少8位，包含大写字母、小写字母、数字及特殊符号中的至少3种
 */
export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-4
  label: '极弱' | '弱' | '中等' | '强' | '极强';
  feedback: string[];
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const feedback: string[] = [];
  if (!password) {
    return { isValid: false, score: 0, label: '极弱', feedback: ['请输入密码'] };
  }

  let score = 0;
  if (password.length >= 8) score++;
  else feedback.push('密码长度至少需要 8 个字符');

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  else feedback.push('需同时包含大写和小写英文字母');

  if (/\d/.test(password)) score++;
  else feedback.push('需包含至少一个数字');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  else feedback.push('建议包含特殊符号（如 !@#$%^&* 等）');

  const labelMap: Record<number, '极弱' | '弱' | '中等' | '强' | '极强'> = {
    0: '极弱',
    1: '弱',
    2: '中等',
    3: '强',
    4: '极强',
  };

  return {
    isValid: score >= 3 && password.length >= 8,
    score,
    label: labelMap[score] || '弱',
    feedback,
  };
}

/**
 * 11.2.1 AI Prompt 提示词注入清洗过滤器
 * 防范提示词逃逸、越权指令注入与恶意思维链劫持
 */
export function sanitizeAiPrompt(input: string, maxLen: number = 8000): string {
  if (!input || typeof input !== 'string') return '';

  let sanitized = input.trim();

  // 截断超长输入，防拒绝服务攻击
  if (sanitized.length > maxLen) {
    sanitized = sanitized.substring(0, maxLen);
  }

  // 过滤系统提示词注入攻击向量
  const dangerousPatterns = [
    /ignore\s+(all\s+)?(previous|prior)\s+instructions/gi,
    /disregard\s+all\s+(prior|previous)\s+prompts/gi,
    /system\s+prompt\s+override/gi,
    /you\s+are\s+now\s+in\s+dan\s+mode/gi,
    /jailbreak/gi,
    /system:\s*role\s*=\s*['"]system['"]/gi,
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /data:text\/html/gi,
  ];

  dangerousPatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '[REDACTED_SECURITY_PATTERN]');
  });

  return sanitized;
}
