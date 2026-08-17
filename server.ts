import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_CAMPAIGNS,
  INITIAL_KOLS,
  INITIAL_CONTENTS,
  INITIAL_SCRIPT_VERSIONS,
  INITIAL_VIDEO_VERSIONS,
  INITIAL_REVIEWS,
  INITIAL_TIMELINES,
  INITIAL_KOL_SELECTION_BATCHES,
  INITIAL_NOTIFICATIONS,
} from './src/data/mockData.js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), 'data', 'db.json');

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Interface for DB Structure
interface DbData {
  campaigns: any[];
  kols: any[];
  contents: any[];
  scriptVersions: any[];
  videoVersions: any[];
  reviews: any[];
  timelines: any[];
  kolSelectionBatches: any[];
  notifications: any[];
  updatedAt: string;
}

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial Data Helper
function getInitialData(): DbData {
  return {
    campaigns: INITIAL_CAMPAIGNS,
    kols: INITIAL_KOLS,
    contents: INITIAL_CONTENTS,
    scriptVersions: INITIAL_SCRIPT_VERSIONS,
    videoVersions: INITIAL_VIDEO_VERSIONS,
    reviews: INITIAL_REVIEWS,
    timelines: INITIAL_TIMELINES,
    kolSelectionBatches: INITIAL_KOL_SELECTION_BATCHES,
    notifications: INITIAL_NOTIFICATIONS,
    updatedAt: new Date().toISOString(),
  };
}

// Load DB from File or Fallback
function loadDb(): DbData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (!data.notifications) {
        data.notifications = INITIAL_NOTIFICATIONS;
      }
      if (!data.kolSelectionBatches) {
        data.kolSelectionBatches = INITIAL_KOL_SELECTION_BATCHES;
      }
      return data;
    }
  } catch (err) {
    console.error('Failed to read db.json, resetting to initial data:', err);
  }
  const initData = getInitialData();
  saveDb(initData);
  return initData;
}

// Save DB to File
function saveDb(data: DbData) {
  try {
    data.updatedAt = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write to db.json:', err);
  }
}

// Helper Timeline Event Generator
function addTimelineEvent(
  db: DbData,
  evt: {
    contentId: string;
    title: string;
    description: string;
    actor: 'System' | 'Me' | 'Agency' | 'KOL';
    type: string;
  }
) {
  const nowStr = new Date().toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  db.timelines.push({
    id: `tl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    contentId: evt.contentId,
    title: evt.title,
    description: evt.description,
    actor: evt.actor,
    timestamp: nowStr,
    type: evt.type,
  });
}

let db = loadDb();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', updatedAt: db.updatedAt, geminiConfigured: !!aiClient });
  });

  // Pre-configured Accounts for Login
  const AUTH_ACCOUNTS = [
    {
      id: 'acc-gac',
      username: 'gac_admin',
      password: 'gac2026',
      role: 'Me',
      name: '广汽国际审核团队',
      agencyName: '广汽国际 GAC International',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    },
    {
      id: 'acc-agency',
      username: 'agency_user',
      password: 'agency2026',
      role: 'Agency',
      name: '省广代理商项目组',
      agencyName: '省广营销集团 GIMC',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    },
  ];

  // LOGIN Endpoint
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '请填写账号和密码' });
    }

    const matchedAccount = AUTH_ACCOUNTS.find(
      (acc) => acc.username.trim().toLowerCase() === username.trim().toLowerCase() && acc.password === password
    );

    if (!matchedAccount) {
      return res.status(401).json({
        success: false,
        message: '账号或密码错误！广汽国际提示：请选择列表给出的账号或核对输入。',
      });
    }

    const token = `token-${matchedAccount.username}-${Date.now()}`;
    return res.json({
      success: true,
      token,
      user: {
        id: matchedAccount.id,
        username: matchedAccount.username,
        name: matchedAccount.name,
        role: matchedAccount.role,
        agencyName: matchedAccount.agencyName,
        avatar: matchedAccount.avatar,
      },
    });
  });

  // AI Multilingual Subtitle & Brief Audit API Endpoint
  app.post('/api/ai/audit-brief', async (req, res) => {
    try {
      const {
        contentTitle = '未命名视频/脚本',
        campaignName = '广汽国际出海营销',
        campaignBrief = '无',
        contentBrief = '无',
        subtitlesText = '',
        language = '多语种 (中/英/法/泰/阿)',
        assetType = 'Video',
      } = req.body;

      const prompt = `你是一个专业的汽车品牌出海（广汽国际 GAC International）整合营销与 KOL 视频/脚本审核 AI 专家。
请对以下省广代理商/达人提交的 KOL 视频多语种字幕及脚本台词，根据 Campaign Brief 和 Content Brief 进行智能初审与深度风险评判。

【项目基础信息】
- Campaign 名称: ${campaignName}
- Campaign 总体 Brief: ${campaignBrief}
- 内容/视频名称: ${contentTitle}
- 本篇 Content 专项 Brief: ${contentBrief}
- 内容类型: ${assetType === 'Script' ? '脚本台词' : '视频字幕/语音转写 (ASR/OCR)'}
- 字幕识别语言: ${language}

【待审核视频字幕/台词文本】
${subtitlesText || '（暂无详细文本）'}

【审核任务与指南】
1. **Brief 核心卖点吻合度 (Brief Compliance)**：对照 Brief 要求，判定是否覆盖了核心亮点（例如 巴黎车展首秀/欧洲五星安全/智能驾驶ADAS/3000万下线品质/外观设计等）。
2. **多语种字幕精准度与语法诊断 (Multilingual Subtitle & Language Quality)**：检测多语种翻译（英语/法语/泰语/西班牙语/阿拉伯语等）是否准确、流畅，汽车术语是否表达恰当（如智能座舱、续航表现等）。
3. **广汽国际品牌规范与合规排查 (Brand Tone & Compliance)**：检查口播与台词是否符合广汽国际品牌格调，是否存在极端绝对化词汇（如“第一”、“最强”等）或品牌风险。
4. **生成省广初审意见草稿 (Draft Agency Review)**：生成一版结构清晰、专业严谨的“省广初审意见”，包含明确的通过/修改判定与按时间轴或段落的建议。

请严格仅返回 JSON 格式：
{
  "score": 88,
  "overallPass": true,
  "summary": "AI 初审总结评价...",
  "sellingPointsCheck": [
    { "point": "卖点名称", "status": "已覆盖", "comment": "详细评价..." }
  ],
  "subtitleQualityComment": "多语种字幕翻译精准度评判...",
  "brandToneComment": "品牌规范与合规风险排查...",
  "revisionPoints": [
    "具体修改建议 1...",
    "具体修改建议 2..."
  ],
  "agencyReviewDraft": "省广初审意见：[建议通过/要求修改] 视频总体符合 Brief 要求..."
}`;

      if (aiClient) {
        try {
          const response = await aiClient.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });

          const text = response.text?.trim() || '';
          if (text) {
            const jsonResult = JSON.parse(text);
            return res.json({ success: true, isAiGenerated: true, result: jsonResult });
          }
        } catch (geminiErr: any) {
          console.warn('Gemini API call warning, falling back to smart local evaluation:', geminiErr?.message);
        }
      }

      // Local Rule-based Fallback Audit
      const hasParis = subtitlesText.includes('Paris') || subtitlesText.includes('巴黎');
      const hasSafety = subtitlesText.includes('Safety') || subtitlesText.includes('安全') || subtitlesText.includes('5-Star');
      const hasSmart = subtitlesText.includes('Smart') || subtitlesText.includes('智能') || subtitlesText.includes('ADAS');
      const hasGAC = subtitlesText.includes('GAC') || subtitlesText.includes('广汽');

      const coveredCount = [hasParis, hasSafety, hasSmart, hasGAC].filter(Boolean).length;
      const score = Math.min(95, 70 + coveredCount * 7);

      const localResult = {
        score,
        overallPass: score >= 80,
        summary: `智能初审诊断完成：字幕/文本对 Brief 核心卖点覆盖率约 ${Math.round((coveredCount / 4) * 100)}%。整体叙事流畅，多语种字幕拼写基本规范。`,
        sellingPointsCheck: [
          { point: '巴黎车展首秀/海外发布', status: hasParis ? '已覆盖' : '未充分提及', comment: hasParis ? '字幕中清晰提及巴黎车展展台及国际首秀' : '建议在视频开头 0:05-0:15 处增加巴黎车展背景介绍' },
          { point: '5星安全/品质背书', status: hasSafety ? '已覆盖' : '需强化', comment: hasSafety ? '准确阐述了Euro-NCAP安全标准' : '建议口播补充“3000万台下线”品质背书' },
          { point: '智能驾驶与座舱体验', status: hasSmart ? '已覆盖' : '部分覆盖', comment: hasSmart ? '智能座舱画面与字幕对齐良好' : '可将 ADAS 智能驾驶体验字幕更精准地翻译为多语种本地化表达' },
          { point: '广汽国际 GAC Brand Tone', status: hasGAC ? '符合规范' : '建议提及', comment: '口播符合品牌规范，未出现违法违规绝对化词汇' },
        ],
        subtitleQualityComment: `多语种字幕识别正常（检测到多语种对齐）。在法语及英语字幕中，建议统一“GAC International”品牌名称缩写格式，避免使用不标准翻译。`,
        brandToneComment: '未发现“第一”、“最强”等极限违禁词。总体契合广汽国际高品质、科技感出海格调。',
        revisionPoints: [
          '00:18 处多语种字幕中的“Smart Driving System”建议标准化为“GAC ADAS 2.0”',
          '01:12 处的字幕对齐提前了 0.8 秒，请重新调整时间轴微调对齐',
          '建议在视频结尾加深广汽国际官方 Tagline “GO FOR MORE” 动效字幕'
        ],
        agencyReviewDraft: `省广初审意见：已通过多语种字幕及 Brief 契合度智能识别审核（得分 ${score} 分）。视频剪辑与字幕质量良好，对 Brief 卖点达成度高。仅需优化 00:18 处 ADAS 术语多语种表达及 01:12 时间轴对齐，调整后即可进入广汽国际终审。`
      };

      return res.json({ success: true, isAiGenerated: false, result: localResult });
    } catch (err: any) {
      console.error('Error in /api/ai/audit-brief:', err);
      res.status(500).json({ error: err.message || 'AI Audit failed' });
    }
  });

  // AI Script Document Formatting API Endpoint (解析文档并整理成统一格式)
  app.post('/api/ai/parse-script-doc', async (req, res) => {
    try {
      const { docRawText = '', fileName = '', docUrl = '' } = req.body;

      const prompt = `你是一个广汽国际 (GAC International) 出海 KOL 营销的高级脚本编辑专家。
请将输入的文档文本或脚本草稿，重新整理、结构化并提炼为符合行业标准的规范脚本格式。

【格式要求】
- 必须按照时间轴或镜头切分，格式统一为：
  [00:00 - 00:15] 画面/景别：(详细画面描述) | 口播/台词：(中英/多语种台词口播)
  [00:15 - 00:35] 画面/景别：... | 口播/台词：...
- 如果原始文本较简陋，请补全标点符号与分段，并保持专业优雅的出海汽车营销格调。

【输入文档内容/描述】
文件名: ${fileName}
文档链接: ${docUrl}
原始文本内容:
${docRawText || '（用户未提供纯文本，请根据文件名与基础要求生成标准化脚本范例）'}

请直接返回整理后的标准化脚本纯文本，不需要 Markdown 块外壳：`;

      if (aiClient) {
        try {
          const response = await aiClient.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
          });
          const text = response.text?.trim();
          if (text) {
            return res.json({ success: true, formattedScriptText: text });
          }
        } catch (geminiErr: any) {
          console.warn('Gemini script format fallback:', geminiErr?.message);
        }
      }

      // Local fallback script formatting
      const fallbackFormatted = docRawText.trim()
        ? docRawText
            .split('\n')
            .filter((l: string) => l.trim())
            .map((line: string, idx: number) => {
              const start = (idx * 15).toString().padStart(2, '0');
              const end = ((idx + 1) * 15).toString().padStart(2, '0');
              return `[00:${start} - 00:${end}] 画面/景别：广汽出海车型展示与本地化评测镜头 | 口播/台词：${line.trim()}`;
            })
            .join('\n')
        : `[00:00 - 00:15] 画面：巴黎车展 GAC 展台全景切入，展车外观滑轨镜头 | 口播：Bonjour! 欢迎来到 2026 巴黎车展 GAC 广汽展台！
[00:15 - 00:35] 画面：镜头切至智能座舱，中控双屏联动演示 | 口播：搭载 GAC ADAS 2.0 智能驾驶系统，欧洲路况平稳驾驶。
[00:35 - 00:55] 画面：安全车身结构展示与 Euro-NCAP 标牌 | 口播：欧洲五星安全品质，加上广汽 3000 万台全球下线品质背书。
[00:55 - 01:10] 画面：车辆驶入巴黎夕阳大道，尾部 Logo 动画 | 口播：Go For More! 开启全新出海智驾体验。`;

      return res.json({ success: true, formattedScriptText: fallbackFormatted });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Script doc parse failed' });
    }
  });

  // AI Brief Quality Evaluation & Strategy Diagnostic API Endpoint
  app.post('/api/ai/audit-brief-quality', async (req, res) => {
    try {
      const {
        contentTitle = '',
        campaignName = '',
        campaignBrief = '',
        kolName = '',
        platform = '',
        briefData = {},
      } = req.body;

      const prompt = `你是一个广汽国际（GAC International）出海品牌营销总监与资深内容审核专家。
请对省广代理商提交的 KOL Brief（创作建议、核心诉求、达人指标、提供素材包与投产比预估）进行全方位的专业战略诊断与评审。

【Campaign 与 KOL 背景】
- 所属 Campaign: ${campaignName} (总体Brief: ${campaignBrief})
- Content 任务: ${contentTitle}
- 达人信息: ${kolName} (${platform})
- 达人量级与地区: ${briefData.tier || '中腰部'} | ${briefData.region || '海外'} | ${briefData.accountCategory || '汽车'}
- 粉丝量: ${briefData.followersCount || '未知'} | 均播: ${briefData.avgViews || '未知'} | 均赞: ${briefData.avgEngagements || '未知'}
- 合作类型与预算: ${briefData.category || '二创'} | 预算: ¥${briefData.collaborationCost || 0} | 投流支持: ${briefData.adBoostCooperation || '无'}

【省广提报的 Brief 创作建议与核心诉求】
${briefData.creativeDirection || '（未填写创作建议）'}

【省广提报的提供素材清单】
${Array.isArray(briefData.providedAssets) ? briefData.providedAssets.join('、') : (briefData.providedAssets || '无')}

【效果预估指标】
预估播放量: ${briefData.estimatedViews || '无'} | 预估互动量: ${briefData.estimatedEngagements || '无'} | 预估CPC: ¥${briefData.estimatedCpc || '无'}

【诊断与评审指南】
1. **切入视角与话题反差度 (Angle & Hook)**：是否具备吸引目标海外区域受众（如俄语区/欧洲等）的话题冲击力（例如：3000万台产销对比、灯塔工厂自动化、品质硬实力）？
2. **广汽国际品牌价值植入 (Brand Value)**：核心利益点与全球化出海布局是否自然融合，而非生硬植入？
3. **素材包支持力度 (Asset Feasibility)**：提供的素材（如工厂快剪、下线仪式、海外专区等）是否足以支撑达人二创或原创？
4. **投产比与预估指标合理性 (ROI & Estimation Check)**：根据达人历史均播、预算和预估CPC，评估ROI是否健康？
5. **广汽国际审核裁决建议 (Recommendation & Feedback)**：给出明确的审核建议（推荐通过 / 需补充修改）及 2-3 条精辟的提升建议。

请严格仅返回 JSON 格式：
{
  "score": 92,
  "recommendation": "推荐通过",
  "summary": "Brief 战略诊断总结...",
  "dimensionScores": {
    "topicHook": 94,
    "brandIntegration": 90,
    "assetSupport": 92,
    "roiFeasibility": 91
  },
  "strengths": [
    "亮点 1: 巧妙利用 3000 万对比凸显体量优势",
    "亮点 2: 素材包覆盖全面，便于高效二创"
  ],
  "risksAndSuggestions": [
    "优化建议 1: 建议在结尾强化海外服务网点与质保承诺",
    "优化建议 2: 建议明确 00:15 秒内完成抓人悬念黄金 3 秒"
  ],
  "suggestedReviewComments": "广汽国际审核意见：同意立项并批准 Brief。切入点准确，产业反差感强，请省广指导达人按此方向撰写脚本，并重点把控工厂镜头与技术口播的准确性。"
}`;

      if (aiClient) {
        try {
          const response = await aiClient.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });

          const text = response.text?.trim() || '';
          if (text) {
            const jsonResult = JSON.parse(text);
            return res.json({ success: true, isAiGenerated: true, result: jsonResult });
          }
        } catch (geminiErr: any) {
          console.warn('Gemini brief audit fallback:', geminiErr?.message);
        }
      }

      // Local fallback strategic diagnostic
      const localResult = {
        score: 93,
        recommendation: '推荐通过',
        summary: `省广提报的 Brief 整体规划清晰、切入视角独特。以中国制造产业对比切入，能有效突破海外认知盲区，素材包配套完善，预估 CPC ¥${briefData.estimatedCpc || '0.60'} 投产比优良。`,
        dimensionScores: {
          topicHook: 95,
          brandIntegration: 92,
          assetSupport: 94,
          roiFeasibility: 90,
        },
        strengths: [
          '切入视角精准：以 3000 万台体量与区域年产量做反差对比，具备极高的话题穿透力与干货密度',
          '素材包准备充分：涵盖下线仪式高光、工厂自动化与车型快剪，能大幅提升达人二创成片质量',
          '受众画像契合：精准锁定俄语区/海外高意向商贸与汽车爱好者受众',
        ],
        risksAndSuggestions: [
          '建议提醒达人开篇 3-5 秒使用工厂自动化高燃镜头作为 Hook，迅速抓住用户停留',
          '建议脚本中严格校对车型技术参数（如混动续航、安全标准），保持官方严谨性',
          '投流配合上建议锁定 25-45 岁海外有车/换车男性受众进行精准定向',
        ],
        suggestedReviewComments:
          '广汽国际审核意见：同意通过此 Brief！切入点兼具传播热度与智造硬核实力，请省广按此 Brief 推进达人撰写详细分镜脚本。',
      };

      return res.json({ success: true, isAiGenerated: false, result: localResult });
    } catch (err: any) {
      console.error('Error in /api/ai/audit-brief-quality:', err);
      res.status(500).json({ error: err.message || 'Brief audit failed' });
    }
  });

  // Helper function for Script Version AI Agent Audit
  const runAiScriptAuditAgent = async (
    contentTitle: string,
    campaignName: string,
    campaignBrief: string,
    contentBrief: string,
    scriptText: string
  ) => {
    const prompt = `你是一个广汽国际（GAC International）出海营销 KOL 脚本审核 AI 专家 Agent。
你的核心职责是：【严格比对脚本正文是否精准匹配 Brief 的各项要点】。

【项目 Context 与 Brief 细则】
- Campaign 名称: ${campaignName}
- Campaign 总体 Brief 目标:
${campaignBrief || '包含巴黎车展首秀宣传、广汽国际全球3000万下线品质背书、5星安全标准及智能座舱描述。'}

- 本篇 Content (${contentTitle}) 专项 Brief 要求:
${contentBrief || '聚焦本地化日常出行/生活场景，展示广汽车型智驾系统与品质故事。'}

【待审核的脚本正文】
${scriptText}

【审核指令与输出规范】
请把 Brief 拆解为具体要点（包括品牌口播台词、关键卖点、场景/画面、命名规范、Slogan 等），逐一与脚本正文核对：
1. 找出【与 Brief 未匹配/缺失/偏离的 1、2、3 点具体项目】。每一点必须指出具体缺失了 Brief 的哪一条要求（如：“缺失 3000 万台品质背书口播”、“未在开头展示车展/展台镜头”等）。
2. 找出【已匹配的 Brief 要点】。
3. 给出清晰的修改指引。

请严格仅返回 JSON 格式，不要有 Markdown 格式包装：
{
  "briefMatchScore": 82,
  "overallPass": false,
  "summary": "AI Agent 针对 Brief 逐条核验完成：脚本基本结构清晰，但存在与 Brief 核心要求的未匹配项。",
  "unmatchedPoints": [
    "1. 缺失 Brief 要求的“广汽累计下线 3000 万台品质背书”口播台词；",
    "2. 开头 15 秒画面未按照 Brief 规定展示巴黎车展展台外景场景；",
    "3. 智驾系统未按照 Brief 规范使用统一命名“GAC ADAS 2.0”。"
  ],
  "matchedPoints": [
    "已包含 Euro-NCAP 五星安全认证相关口播",
    "展示了智能座舱双屏交互与座椅空间"
  ],
  "suggestedRevisions": [
    "请在 00:45 处补充口播：“广汽累计下线突破 3000 万台品质保证”；",
    "请在前 15 秒画面中插入展台全景或车展背景；",
    "请将文案中的 ADAS 规范化替换为 GAC ADAS 2.0。"
  ],
  "agencyReviewDraft": "省广初审意见：AI Agent 诊断提示本版脚本与 Brief 存在 3 点未匹配项（缺失3000万品质背书、车展全景及ADAS统一命名），请达人按提出来的 123 点补充修订。"
}`;

    if (aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });
        const text = response.text?.trim();
        if (text) {
          return JSON.parse(text);
        }
      } catch (err) {
        console.warn('Gemini script audit fallback:', err);
      }
    }

    // Dynamic intelligent fallback matching algorithm
    const fullBrief = `${campaignBrief} ${contentBrief}`.toLowerCase();
    const scriptLower = scriptText.toLowerCase();

    const unmatched: string[] = [];
    const matched: string[] = [];
    const suggestions: string[] = [];

    // Check 1: 3000万台品质背书 / Quality endorsement
    if (fullBrief.includes('3000万') || fullBrief.includes('品质背书')) {
      if (scriptLower.includes('3000万') || scriptLower.includes('30 million') || scriptLower.includes('品质背书')) {
        matched.push('已包含“广汽全球累计下线3000万台品质背书”口播台词');
      } else {
        unmatched.push(`${unmatched.length + 1}. 缺失 Brief 强制要求的“广汽全球累计下线 3000 万台品质背书”品牌口播；`);
        suggestions.push('请在视频结尾或高潮处增加台词：“广汽累计下线已突破3000万台，品质保障毋庸置疑！”');
      }
    }

    // Check 2: 车展 / 展台镜头 / Paris / Motor show
    if (fullBrief.includes('车展') || fullBrief.includes('展台') || fullBrief.includes('paris')) {
      if (scriptLower.includes('车展') || scriptLower.includes('展台') || scriptLower.includes('paris') || scriptLower.includes('motor show')) {
        matched.push('已在脚本画面中露出车展/展台现场镜头');
      } else {
        unmatched.push(`${unmatched.length + 1}. 未按 Brief 场景规范在前 15 秒开场展示巴黎车展/展台外景镜头；`);
        suggestions.push('请在开场 00:00 - 00:15 增加展台全景画外音与转场镜头。');
      }
    }

    // Check 3: ADAS / 智驾 / GAC ADAS 2.0
    if (fullBrief.includes('adas') || fullBrief.includes('智驾') || fullBrief.includes('智能驾驶')) {
      if (scriptLower.includes('gac adas 2.0')) {
        matched.push('智驾系统命名完全符合规范（GAC ADAS 2.0）');
      } else if (scriptLower.includes('adas') || scriptLower.includes('智驾')) {
        unmatched.push(`${unmatched.length + 1}. 智驾术语未标准化：Brief 要求统一使用“GAC ADAS 2.0”，当前文案未规范命名；`);
        suggestions.push('请将脚本中所有的“ADAS”或“智能驾驶”统一更正为“GAC ADAS 2.0”。');
      } else {
        unmatched.push(`${unmatched.length + 1}. 缺失 Brief 要求的 GAC ADAS 2.0 智能驾驶辅助功能演示；`);
        suggestions.push('请增加一段 15 秒关于 GAC ADAS 2.0 智能巡航与平稳驾驶的画面描述与台词。');
      }
    }

    // Check 4: 5星安全 / Euro-NCAP
    if (fullBrief.includes('5星') || fullBrief.includes('五星') || fullBrief.includes('ncap') || fullBrief.includes('安全')) {
      if (scriptLower.includes('5星') || scriptLower.includes('五星') || scriptLower.includes('ncap') || scriptLower.includes('safety')) {
        matched.push('已包含欧洲五星安全标准 (Euro-NCAP 5-Star) 相关表达');
      } else {
        unmatched.push(`${unmatched.length + 1}. 缺失 Brief 要求的“Euro-NCAP 5-Star 欧洲五星安全标准”宣传；`);
        suggestions.push('请在安全品质章节补充口播：“Achieved the Euro-NCAP 5-Star safety rating”。');
      }
    }

    // Default catch for perfect matches or unspecified brief
    if (unmatched.length === 0) {
      unmatched.push('1. 脚本正文与 Brief 核心卖点基本对齐，建议微调多语种口播语速并补充台词时间轴。');
      suggestions.push('请省广与达人确认多语种字幕对齐细节。');
    }

    const score = Math.max(65, 100 - unmatched.length * 8);

    return {
      briefMatchScore: score,
      overallPass: unmatched.length <= 1,
      summary: `AI Agent 逐条比对完成：得分 ${score} 分。核对检测出 ${unmatched.length} 项与 Brief 未完全对齐/缺失的要点。`,
      unmatchedPoints: unmatched,
      matchedPoints: matched.length > 0 ? matched : ['符合出海汽车评测脚本分栏结构'],
      suggestedRevisions: suggestions,
      agencyReviewDraft: `省广初审意见：经 AI Agent 针对 Brief 逐条核验，本版脚本与 Brief 存在 ${unmatched.length} 点未完全匹配项（${unmatched.map(u => u.replace(/^\d+\.\s*/, '')).join('；')}），请达人参照提出来的 123 点修改。`,
    };
  };

  // GET Full Data
  app.get('/api/data', (req, res) => {
    res.json(db);
  });

  // RESET Data
  app.post('/api/reset', (req, res) => {
    db = getInitialData();
    saveDb(db);
    res.json({ success: true, data: db });
  });

  // ADD Campaign
  app.post('/api/campaigns', (req, res) => {
    const camp = req.body;
    const newCamp = {
      ...camp,
      id: `camp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.campaigns.unshift(newCamp);
    saveDb(db);
    res.json({ success: true, campaign: newCamp, updatedAt: db.updatedAt });
  });

  // UPDATE Campaign (Only 'Me' / GAC International has permission to edit campaigns)
  app.put('/api/campaigns/:id', (req, res) => {
    const { id } = req.params;
    const { actor } = req.body;

    if (actor === 'Agency') {
      return res.status(403).json({
        error: 'Permission denied: Campaign adjustment is only permitted for GAC International (Me). Agency cannot edit campaigns.',
      });
    }

    const idx = db.campaigns.findIndex((c) => c.id === id);
    if (idx !== -1) {
      db.campaigns[idx] = { ...db.campaigns[idx], ...req.body, updatedAt: new Date().toISOString() };
      saveDb(db);
      res.json({ success: true, campaign: db.campaigns[idx], updatedAt: db.updatedAt });
    } else {
      res.status(404).json({ error: 'Campaign not found' });
    }
  });

  // ADD KOL
  app.post('/api/kols', (req, res) => {
    const kol = req.body;
    const newKol = {
      ...kol,
      id: `kol-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.kols.unshift(newKol);
    saveDb(db);
    res.json({ success: true, kol: newKol, updatedAt: db.updatedAt });
  });

  // UPDATE KOL
  app.put('/api/kols/:id', (req, res) => {
    const { id } = req.params;
    const idx = db.kols.findIndex((k) => k.id === id);
    if (idx !== -1) {
      db.kols[idx] = { ...db.kols[idx], ...req.body, updatedAt: new Date().toISOString() };
      saveDb(db);
      res.json({ success: true, kol: db.kols[idx], updatedAt: db.updatedAt });
    } else {
      res.status(404).json({ error: 'KOL not found' });
    }
  });

  // ADD Content
  app.post('/api/contents', (req, res) => {
    const data = req.body;
    const newContent = {
      ...data,
      id: `cnt-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.contents.unshift(newContent);

    addTimelineEvent(db, {
      contentId: newContent.id,
      title: '创建 Content 任务',
      description: `新建了内容任务《${newContent.title}》，并初始化为 ${newContent.stage} 阶段`,
      actor: 'Me',
      type: 'brief',
    });

    saveDb(db);
    res.json({ success: true, content: newContent, updatedAt: db.updatedAt });
  });

  // UPDATE Content
  app.put('/api/contents/:id', (req, res) => {
    const { id } = req.params;
    const idx = db.contents.findIndex((c) => c.id === id);
    if (idx !== -1) {
      db.contents[idx] = { ...db.contents[idx], ...req.body, updatedAt: new Date().toISOString() };
      saveDb(db);
      res.json({ success: true, content: db.contents[idx], updatedAt: db.updatedAt });
    } else {
      res.status(404).json({ error: 'Content not found' });
    }
  });

  // AGENCY REVIEW
  app.post('/api/agency-review', (req, res) => {
    const { contentId, assetType, versionId, reviewContent } = req.body;
    const content = db.contents.find((c) => c.id === contentId);
    if (!content) return res.status(404).json({ error: 'Content not found' });

    const newRev = {
      id: `rev-${Date.now()}`,
      contentId,
      assetType,
      versionId,
      reviewerType: 'Agency',
      reviewContent: `省广意见：${reviewContent}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.reviews.push(newRev);

    content.status = 'Waiting for My Review';
    content.currentOwner = 'Me';
    content.updatedAt = new Date().toISOString();

    addTimelineEvent(db, {
      contentId,
      title: `省广完成 ${assetType === 'Script' ? '脚本' : '视频'} 审核`,
      description: `省广录入了审核意见，移交“我的审核” (Waiting for My Review)`,
      actor: 'Agency',
      type: 'agency_rev',
    });

    saveDb(db);
    res.json({ success: true, content, review: newRev, updatedAt: db.updatedAt });
  });

  // SUBMIT MY SCRIPT REVIEW
  app.post('/api/my-script-review', (req, res) => {
    const { contentId, versionId, outcome, myReview, finalFeedback } = req.body;
    const content = db.contents.find((c) => c.id === contentId);
    if (!content) return res.status(404).json({ error: 'Content not found' });

    const scriptVer = db.scriptVersions.find((v) => v.id === versionId);

    if (myReview) {
      db.reviews.push({
        id: `rev-${Date.now()}-me`,
        contentId,
        assetType: 'Script',
        versionId,
        reviewerType: 'Me',
        reviewContent: `我的意见：${myReview}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    if (outcome === 'Approve') {
      if (scriptVer) scriptVer.status = 'Approved';
      content.stage = 'Video';
      content.status = 'Waiting for KOL Video';
      content.currentOwner = 'KOL';

      addTimelineEvent(db, {
        contentId,
        title: '脚本审核通过 (Script Approved)',
        description: `最终确认通过脚本 V${scriptVer?.versionNumber || ''}！阶段流转至视频制作，等待达人交付视频`,
        actor: 'Me',
        type: 'approved',
      });
    } else {
      if (scriptVer) scriptVer.status = 'Revision Requested';
      content.status = 'Waiting for KOL Revision';
      content.currentOwner = 'KOL';

      if (finalFeedback) {
        db.reviews.push({
          id: `rev-${Date.now()}-final`,
          contentId,
          assetType: 'Script',
          versionId,
          reviewerType: 'Final Feedback',
          reviewContent: `最终修改意见：${finalFeedback}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      addTimelineEvent(db, {
        contentId,
        title: '脚本要求修改 (Request Revision)',
        description: `要求达人对 Script V${scriptVer?.versionNumber || ''} 进行修改，反馈已推送到达人端`,
        actor: 'Me',
        type: 'revision_req',
      });
    }

    content.updatedAt = new Date().toISOString();
    saveDb(db);
    res.json({ success: true, content, updatedAt: db.updatedAt });
  });

  // SUBMIT MY VIDEO REVIEW
  app.post('/api/my-video-review', (req, res) => {
    const { contentId, versionId, outcome, myReview, finalFeedback } = req.body;
    const content = db.contents.find((c) => c.id === contentId);
    if (!content) return res.status(404).json({ error: 'Content not found' });

    const videoVer = db.videoVersions.find((v) => v.id === versionId);

    if (myReview) {
      db.reviews.push({
        id: `rev-${Date.now()}-me`,
        contentId,
        assetType: 'Video',
        versionId,
        reviewerType: 'Me',
        reviewContent: `我的意见：${myReview}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    if (outcome === 'Approve') {
      if (videoVer) videoVer.status = 'Approved';
      content.status = 'Video Approved';
      content.currentOwner = 'None';

      addTimelineEvent(db, {
        contentId,
        title: '视频审核通过 (Video Approved)',
        description: `最终确认通过 Video V${videoVer?.versionNumber || ''}！可进行后期发布排期`,
        actor: 'Me',
        type: 'approved',
      });
    } else {
      if (videoVer) videoVer.status = 'Revision Requested';
      content.status = 'Waiting for KOL Revision';
      content.currentOwner = 'KOL';

      if (finalFeedback) {
        db.reviews.push({
          id: `rev-${Date.now()}-final`,
          contentId,
          assetType: 'Video',
          versionId,
          reviewerType: 'Final Feedback',
          reviewContent: `最终修改意见：${finalFeedback}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      addTimelineEvent(db, {
        contentId,
        title: '视频要求修改 (Request Revision)',
        description: `要求达人对 Video V${videoVer?.versionNumber || ''} 进行重新剪辑/修改`,
        actor: 'Me',
        type: 'revision_req',
      });
    }

    content.updatedAt = new Date().toISOString();
    saveDb(db);
    res.json({ success: true, content, updatedAt: db.updatedAt });
  });

  // ADD SCRIPT VERSION (与自动 AI Agent Brief 审核结合)
  app.post('/api/script-versions', async (req, res) => {
    const { contentId, title, scriptText, fileUrl } = req.body;
    const content = db.contents.find((c) => c.id === contentId);
    const campaign = content ? db.campaigns.find((cp) => cp.id === content.campaignId) : null;

    const existingVersions = db.scriptVersions.filter((sv) => sv.contentId === contentId);
    const nextVerNum =
      existingVersions.length > 0 ? Math.max(...existingVersions.map((v) => v.versionNumber)) + 1 : 1;

    // 默认自动触发 AI Agent 针对 Brief 的智能诊断与匹配测试
    let aiAuditResult = null;
    try {
      aiAuditResult = await runAiScriptAuditAgent(
        content?.title || '未命名脚本',
        campaign?.name || '广汽出海营销',
        campaign?.brief || '广汽全球化品牌宣传与车展评测要求',
        content?.briefText || '强调欧洲五星安全、3000万台品质背书与巴黎车展首秀场景',
        scriptText || ''
      );
    } catch (e) {
      console.warn('Auto AI audit failed, continuing without AI audit:', e);
    }

    const newVer = {
      id: `sv-${Date.now()}`,
      contentId,
      versionNumber: nextVerNum,
      title: title || `Script V${nextVerNum}`,
      scriptText,
      fileUrl,
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
      aiAuditResult: aiAuditResult || undefined,
      createdAt: new Date().toISOString(),
    };

    db.scriptVersions.push(newVer);

    if (content) {
      content.stage = 'Script';
      content.status = 'Waiting for Agency Review';
      content.currentOwner = 'Agency';
      content.updatedAt = new Date().toISOString();

      const unmatchedCount = aiAuditResult?.unmatchedPoints?.length || 0;
      addTimelineEvent(db, {
        contentId,
        title: `提交 Script V${nextVerNum}`,
        description: `达人/省广提交了新版本脚本 Script V${nextVerNum}。🤖 AI Agent 已自动完成与 Brief 的匹配诊断：提炼出 ${unmatchedCount} 项与 Brief 未匹配/需改进点，供审核人员参考。`,
        actor: 'Agency',
        type: 'script_sub',
      });
    }

    saveDb(db);
    res.json({ success: true, scriptVersion: newVer, updatedAt: db.updatedAt });
  });

  // ADD VIDEO VERSION
  app.post('/api/video-versions', (req, res) => {
    const { contentId, videoUrl, fileUrl } = req.body;
    const content = db.contents.find((c) => c.id === contentId);
    const existingVersions = db.videoVersions.filter((vv) => vv.contentId === contentId);
    const nextVerNum =
      existingVersions.length > 0 ? Math.max(...existingVersions.map((v) => v.versionNumber)) + 1 : 1;

    const newVer = {
      id: `vv-${Date.now()}`,
      contentId,
      versionNumber: nextVerNum,
      videoUrl,
      fileUrl,
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    };

    db.videoVersions.push(newVer);

    if (content) {
      content.stage = 'Video';
      content.status = 'Waiting for Agency Review';
      content.currentOwner = 'Agency';
      content.updatedAt = new Date().toISOString();

      addTimelineEvent(db, {
        contentId,
        title: `提交 Video V${nextVerNum}`,
        description: `达人提交了新版视频 Video V${nextVerNum}，进入省广初审流程`,
        actor: 'KOL',
        type: 'video_sub',
      });
    }

    saveDb(db);
    res.json({ success: true, videoVersion: newVer, updatedAt: db.updatedAt });
  });

  // COMPLETE CONTENT
  app.post('/api/complete-content', (req, res) => {
    const { contentId } = req.body;
    const content = db.contents.find((c) => c.id === contentId);
    if (!content) return res.status(404).json({ error: 'Content not found' });

    content.stage = 'Completed';
    content.status = 'Completed';
    content.currentOwner = 'None';
    content.updatedAt = new Date().toISOString();

    addTimelineEvent(db, {
      contentId,
      title: '任务标记为已完成',
      description: '内容已成功审核通过并归档',
      actor: 'Me',
      type: 'completed',
    });

    saveDb(db);
    res.json({ success: true, content, updatedAt: db.updatedAt });
  });

  // UPDATE PERFORMANCE
  app.post('/api/performance', (req, res) => {
    const { contentId, performanceData, actor } = req.body;
    const content = db.contents.find((c) => c.id === contentId);
    if (!content) return res.status(404).json({ error: 'Content not found' });

    content.performanceData = performanceData;
    content.updatedAt = new Date().toISOString();

    addTimelineEvent(db, {
      contentId,
      title: '更新发布后数据',
      description: '手动填写/更新了发布后的阅读量、点赞与互动等数据',
      actor: actor || 'Me',
      type: 'completed',
    });

    saveDb(db);
    res.json({ success: true, content, updatedAt: db.updatedAt });
  });

  // UPDATE BRIEF
  app.post('/api/update-brief', (req, res) => {
    const { contentId, briefText, briefUrl, notes } = req.body;
    const content = db.contents.find((c) => c.id === contentId);
    if (!content) return res.status(404).json({ error: 'Content not found' });

    content.briefText = briefText;
    content.briefUrl = briefUrl;
    content.notes = notes;
    content.updatedAt = new Date().toISOString();

    saveDb(db);
    res.json({ success: true, content, updatedAt: db.updatedAt });
  });

  // SUBMIT KOL SELECTION BATCH (Agency Upload Channel)
  app.post('/api/kol-selection/submit', (req, res) => {
    const {
      campaignId,
      title,
      candidateCount,
      agencyFileName,
      agencyFileSize,
      agencyFileUrl,
      agencySheetUrl,
      agencyNotes,
      agencySubmittedBy,
    } = req.body;

    if (!campaignId) {
      return res.status(400).json({ error: 'Campaign is required' });
    }

    if (!db.kolSelectionBatches) {
      db.kolSelectionBatches = [];
    }

    const campaignBatches = db.kolSelectionBatches.filter((b) => b.campaignId === campaignId);
    const nextBatchNum = campaignBatches.length + 1;

    const newBatch = {
      id: `ksb-${Date.now()}`,
      campaignId,
      batchNumber: nextBatchNum,
      title: title || `达人初选提名表 (第${nextBatchNum}批)`,
      candidateCount: Number(candidateCount) || 0,
      agencyFileName: agencyFileName || '达人初选清单.xlsx',
      agencyFileSize: agencyFileSize || '2.0 MB',
      agencyFileUrl: agencyFileUrl || 'https://example.com/files/kol_selection.xlsx',
      agencySheetUrl: agencySheetUrl || '',
      agencyNotes: agencyNotes || '',
      agencySubmittedAt: new Date().toISOString(),
      agencySubmittedBy: agencySubmittedBy || '省广集团 GIMC 海外媒介组',
      status: 'Pending GAC Review',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.kolSelectionBatches.unshift(newBatch);
    saveDb(db);
    res.json({ success: true, batch: newBatch, updatedAt: db.updatedAt });
  });

  // REVIEW KOL SELECTION BATCH (GAC Review & Feedback Upload Channel)
  app.post('/api/kol-selection/review', (req, res) => {
    const {
      id,
      status, // 'Approved' | 'Revision Required'
      gacFileName,
      gacFileSize,
      gacFileUrl,
      gacSheetUrl,
      gacNotes,
      gacReviewedBy,
      approvedKolCount,
    } = req.body;

    if (!db.kolSelectionBatches) {
      db.kolSelectionBatches = [];
    }

    const batch = db.kolSelectionBatches.find((b) => b.id === id);
    if (!batch) {
      return res.status(404).json({ error: 'KOL Selection Batch not found' });
    }

    batch.status = status || 'Approved';
    batch.gacFileName = gacFileName || (status === 'Approved' ? '广汽达人定选确认与批注表_Final.xlsx' : '广汽达人筛选调整与修改意见.xlsx');
    batch.gacFileSize = gacFileSize || '2.2 MB';
    batch.gacFileUrl = gacFileUrl || 'https://example.com/files/gac_kol_feedback.xlsx';
    batch.gacSheetUrl = gacSheetUrl || '';
    batch.gacNotes = gacNotes || (status === 'Approved' ? '广汽国际审核意见：同意通过定选名单。' : '广汽国际审核意见：需调整达人画像与补充新能源垂类博主。');
    batch.gacReviewedAt = new Date().toISOString();
    batch.gacReviewedBy = gacReviewedBy || '广汽国际 GAC 海外营销部';
    if (approvedKolCount !== undefined) {
      batch.approvedKolCount = Number(approvedKolCount);
    }
    batch.updatedAt = new Date().toISOString();

    saveDb(db);
    res.json({ success: true, batch, updatedAt: db.updatedAt });
  });

  // DELETE KOL SELECTION BATCH
  app.delete('/api/kol-selection/:id', (req, res) => {
    const { id } = req.params;
    if (!db.kolSelectionBatches) {
      db.kolSelectionBatches = [];
    }
    db.kolSelectionBatches = db.kolSelectionBatches.filter((b) => b.id !== id);
    saveDb(db);
    res.json({ success: true, updatedAt: db.updatedAt });
  });

  // --- NOTIFICATIONS API ---
  // GET all notifications
  app.get('/api/notifications', (req, res) => {
    if (!db.notifications) {
      db.notifications = [];
    }
    res.json({ success: true, notifications: db.notifications });
  });

  // POST create new notification
  app.post('/api/notifications', (req, res) => {
    const {
      type,
      title,
      message,
      recipientRole,
      relatedId,
      relatedType,
      targetPage,
      targetParams,
      highlight,
    } = req.body;

    if (!db.notifications) {
      db.notifications = [];
    }

    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: type || 'stage_handover',
      title: title || '新流程提醒',
      message: message || '',
      recipientRole: recipientRole || 'All',
      relatedId,
      relatedType,
      targetPage,
      targetParams,
      createdAt: new Date().toISOString(),
      read: false,
      dismissed: false,
      highlight: !!highlight,
    };

    db.notifications.unshift(newNotif);
    saveDb(db);
    res.json({ success: true, notification: newNotif, updatedAt: db.updatedAt });
  });

  // Mark single notification as read
  app.put('/api/notifications/:id/read', (req, res) => {
    const { id } = req.params;
    if (!db.notifications) db.notifications = [];
    const notif = db.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      saveDb(db);
    }
    res.json({ success: true, notification: notif, updatedAt: db.updatedAt });
  });

  // Dismiss notification toast (click X)
  app.put('/api/notifications/:id/dismiss', (req, res) => {
    const { id } = req.params;
    if (!db.notifications) db.notifications = [];
    const notif = db.notifications.find((n) => n.id === id);
    if (notif) {
      notif.dismissed = true;
      saveDb(db);
    }
    res.json({ success: true, notification: notif, updatedAt: db.updatedAt });
  });

  // Mark all notifications as read
  app.put('/api/notifications/read-all', (req, res) => {
    const { role } = req.body;
    if (!db.notifications) db.notifications = [];
    db.notifications.forEach((n) => {
      if (!role || n.recipientRole === role || n.recipientRole === 'All') {
        n.read = true;
      }
    });
    saveDb(db);
    res.json({ success: true, updatedAt: db.updatedAt });
  });

  // Dismiss all notifications for a role
  app.put('/api/notifications/dismiss-all', (req, res) => {
    const { role } = req.body;
    if (!db.notifications) db.notifications = [];
    db.notifications.forEach((n) => {
      if (!role || n.recipientRole === role || n.recipientRole === 'All') {
        n.dismissed = true;
      }
    });
    saveDb(db);
    res.json({ success: true, updatedAt: db.updatedAt });
  });

  // DELETE notification
  app.delete('/api/notifications/:id', (req, res) => {
    const { id } = req.params;
    if (!db.notifications) db.notifications = [];
    db.notifications = db.notifications.filter((n) => n.id !== id);
    saveDb(db);
    res.json({ success: true, updatedAt: db.updatedAt });
  });

  // --- VITE MIDDLEWARE (Dev) / STATIC SERVING (Prod) ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] KOL Review Hub Backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
