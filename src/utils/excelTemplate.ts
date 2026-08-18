import * as XLSX from 'xlsx';
import { Campaign, KOL, Platform, ContentCategory, InitiationCandidate } from '../types';

export interface ColumnDefinition {
  key: string;
  header: string;
  required: boolean;
  isAddon?: boolean; // 是否属于附加权益与细则选填项
  example: string;
  description: string;
}

export const INITIATION_TEMPLATE_COLUMNS: ColumnDefinition[] = [
  // --- 基础核心立项字段 ---
  {
    key: 'campaignName',
    header: '营销活动 (Campaign)',
    required: true,
    example: '2026 巴黎车展全球公关传播',
    description: '关联的营销活动名称，系统会自动匹配已有活动，如未匹配将提示新建。',
  },
  {
    key: 'kolName',
    header: 'Name (达人名称/账号)',
    required: true,
    example: 'AutoReview_EU',
    description: '达人频道名或账号名，系统自动匹配达人库，新达人将自动建档。',
  },
  {
    key: 'category',
    header: 'category (合作类型)',
    required: true,
    example: '原创',
    description: '建议填【原创】、【二创】或【直发】之一。（直发类型免分镜脚本，直通视频审核）',
  },
  {
    key: 'platform',
    header: 'Platfrom (合作平台)',
    required: true,
    example: 'Youtube',
    description: '如：Youtube、Tiktok、Instagram、Facebook、其他。',
  },
  {
    key: 'title',
    header: '内容标题 (Title)',
    required: true,
    example: '欧洲5星安全深度实测与巴黎车展首秀',
    description: '合作视频的暂定标题或核心主题。',
  },
  {
    key: 'country',
    header: 'country (国家/地区)',
    required: false,
    example: '欧洲',
    description: '目标投放国家或地区，如：欧洲、俄罗斯、中东、东南亚、美洲、全球。',
  },
  {
    key: 'cost',
    header: '费用（净价）',
    required: false,
    example: '15000',
    description: '合作净费用/预算金额（如 15000 或 $2,500）。',
  },
  {
    key: 'views',
    header: '预估播放量',
    required: false,
    example: '500,000',
    description: '预估海外曝光播放量。',
  },
  {
    key: 'followers',
    header: 'Followers (粉丝量)',
    required: false,
    example: '65.8万',
    description: '达人粉丝数，如：65.8万 或 658,000。',
  },
  {
    key: 'deadline',
    header: '计划发布/截止日期',
    required: false,
    example: '2026-09-20',
    description: '格式为 YYYY-MM-DD，如 2026-09-20。',
  },
  {
    key: 'creativeDirection',
    header: '核心创作方向/Brief诉求',
    required: false,
    example: '开篇结合巴黎车展实拍引出，重点突出 3000 万台下线品质与 Euro-NCAP 五星安全口播。',
    description: '达人创作建议、核心看点及素材诉求。',
  },
  {
    key: 'topic',
    header: '切入点/主题 (Topic)',
    required: false,
    example: 'Euro-NCAP 安全实测 + 3000万下线品质',
    description: '内容核心切入点。',
  },

  // --- 附加合作权益与交付细则 (选择填写项) ---
  {
    key: 'tier',
    header: '量级',
    required: false,
    isAddon: true,
    example: '中腰部',
    description: '【附加项】达人量级（如：头部、中腰部、尾部、KOC、S/A/B级）。',
  },
  {
    key: 'socialMediaUrl',
    header: 'Social Media',
    required: false,
    isAddon: true,
    example: 'https://youtube.com/@autoreview_eu',
    description: '【附加项】达人主页或频道直达链接。',
  },
  {
    key: 'resourceType',
    header: '资源',
    required: false,
    isAddon: true,
    example: '1条Dedicated定制长视频',
    description: '【附加项】合作资源形态（如：1条Dedicated长视频、1条Reels短视频、1条图文帖子）。',
  },
  {
    key: 'videoOrLive',
    header: '视频/直播',
    required: false,
    isAddon: true,
    example: '视频',
    description: '【附加项】内容形态：视频 或 直播。',
  },
  {
    key: 'audiencePersona',
    header: '粉丝画像',
    required: false,
    isAddon: true,
    example: '25-45岁男性/汽车发烧友/科技数码',
    description: '【附加项】达人受众年龄、性别及兴趣偏好画像。',
  },
  {
    key: 'feedback',
    header: '反馈',
    required: false,
    isAddon: true,
    example: '排期已锁定，对纯电车型感兴趣',
    description: '【附加项】达人沟通反馈、合作意向及对接进展。',
  },
  {
    key: 'notes',
    header: '备注',
    required: false,
    isAddon: true,
    example: '需提供英文版官方车型宣传片',
    description: '【附加项】商务或制作执行备注。',
  },
  {
    key: 'canTeaserVideo',
    header: '是否可以发预热视频',
    required: false,
    isAddon: true,
    example: '是',
    description: '【附加项】达人是否配合在主视频前发布预热花絮/Story（是/否）。',
  },
  {
    key: 'canTestimonial',
    header: '是否可以配合证言（如有）',
    required: false,
    isAddon: true,
    example: '是',
    description: '【附加项】达人是否愿意配合录制官方背书证言（是/否）。',
  },
  {
    key: 'portraitAuthDuration',
    header: '肖像授权官方（授权时间）',
    required: false,
    isAddon: true,
    example: '1年',
    description: '【附加项】达人肖像授权广汽官方使用期限（如：3个月 / 6个月 / 1年 / 永久 / 否）。',
  },
  {
    key: 'canSecondaryCreation',
    header: '视频是否可以授权官方二剪二创',
    required: false,
    isAddon: true,
    example: '是',
    description: '【附加项】是否允许广汽官方矩阵账号进行二次剪辑与传播（是/否）。',
  },
  {
    key: 'canProvideRawFootage',
    header: '视频是否可以得到原视频提供网盘',
    required: false,
    isAddon: true,
    example: '是',
    description: '【附加项】达人是否提供 4K 无水印原素材网盘链接（是/否）。',
  },
  {
    key: 'canPinLinkOrMention',
    header: '是否可以评论区圈官方账号/挂官网车型link/挂bio link',
    required: false,
    isAddon: true,
    example: '是',
    description: '【附加项】是否配合置顶评论 @官方账号、挂官网引流链接或主页 Bio Link（是/否）。',
  },
  {
    key: 'canProvideAdCode',
    header: '如官方能投流是否可以提供投流code',
    required: false,
    isAddon: true,
    example: '提供TikTok Spark Code',
    description: '【附加项】是否可提供官方投流授权码（如：提供 Spark Code / Youtube 投流授权 / 是 / 否）。',
  },
];

export const SAMPLE_INITIATION_DATA = [
  {
    'NO.': 1,
    '量级': '头部',
    'Name': 'AutoReview_EU',
    'country': '欧洲',
    'category': '原创',
    'Platfrom': 'Youtube',
    'Social Media': 'https://youtube.com/@autoreview_eu',
    'Followers': '78.5万',
    '资源': '1条Dedicated定制长视频',
    '费用（净价）': '18000',
    '视频/直播': '视频',
    '备注': '需提供 2026 巴黎车展官方 4K 新车实拍母带',
    '预估播放量': '550,000',
    '反馈': '达人非常看好广汽智驾安全，已排期 9 月中旬实测',
    '粉丝画像': '25-45岁欧洲男性/汽车科技发烧友/新能源车关注者',
    '是否可以发预热视频': '是',
    '是否可以配合证言（如有）': '是',
    '肖像授权官方（授权时间）': '1年',
    '视频是否可以授权官方二剪二创': '是',
    '视频是否可以得到原视频提供网盘': '是',
    '是否可以评论区圈官方账号/挂官网车型link/挂bio link': '是',
    '如官方能投流是否可以提供投流code': '是 (提供Youtube授权)',
    '营销活动 (Campaign)': '2026 巴黎车展全球公关传播',
    '内容标题 (Title)': '欧洲5星安全深度实测与巴黎车展首秀',
    '切入点/主题 (Topic)': 'Euro-NCAP 安全实测 + 3000万下线品质',
    '计划发布/截止日期': '2026-09-18',
    '核心创作方向/Brief诉求': '开篇 15 秒展示巴黎车展展台外景，结合日常底盘与智驾测试，强调 3000 万台品质背书。',
  },
  {
    'NO.': 2,
    '量级': '中腰部',
    'Name': 'ParisDrive_Max',
    'country': '法国/欧洲',
    'category': '二创',
    'Platfrom': 'Tiktok',
    'Social Media': 'https://tiktok.com/@parisdrive_max',
    'Followers': '42.0万',
    '资源': '1条高燃混剪短视频',
    '费用（净价）': '8500',
    '视频/直播': '视频',
    '备注': '支持法语本地化解说配音',
    '预估播放量': '800,000',
    '反馈': '已确认合作意向，等候素材与脚本大纲',
    '粉丝画像': '18-35岁年轻都市白领/自驾游与生活方式达人',
    '是否可以发预热视频': '是',
    '是否可以配合证言（如有）': '否',
    '肖像授权官方（授权时间）': '6个月',
    '视频是否可以授权官方二剪二创': '是',
    '视频是否可以得到原视频提供网盘': '是',
    '是否可以评论区圈官方账号/挂官网车型link/挂bio link': '是',
    '如官方能投流是否可以提供投流code': '提供 TikTok Spark Code',
    '营销活动 (Campaign)': 'AION Y Plus 欧洲夏日自驾季',
    '内容标题 (Title)': '纯电自驾穿越阿尔卑斯山：广汽出海体验',
    '切入点/主题 (Topic)': '超长续航 + 智能座舱大空间实测',
    '计划发布/截止日期': '2026-09-22',
    '核心创作方向/Brief诉求': '结合官方 4K 宣传高燃切片，配合达人本地自驾解说，重点强调后排空间与超快充便利性。',
  },
  {
    'NO.': 3,
    '量级': '中腰部',
    'Name': 'ElectroCar_Daily',
    'country': '德国/欧洲',
    'category': '直发',
    'Platfrom': 'Instagram',
    'Social Media': 'https://instagram.com/electrocar_daily',
    'Followers': '28.3万',
    '资源': '1条 9:16 精选 Reels 视频',
    '费用（净价）': '5000',
    '视频/直播': '视频',
    '备注': '【直发】免去分镜脚本，官方成片审核后直接排期',
    '预估播放量': '350,000',
    '反馈': '已预留展会发布日排期席位',
    '粉丝画像': '泛科技/新能源车爱好者/海外年轻用户',
    '是否可以发预热视频': '否',
    '是否可以配合证言（如有）': '否',
    '肖像授权官方（授权时间）': '3个月',
    '视频是否可以授权官方二剪二创': '是',
    '视频是否可以得到原视频提供网盘': '是',
    '是否可以评论区圈官方账号/挂官网车型link/挂bio link': '是',
    '如官方能投流是否可以提供投流code': '是',
    '营销活动 (Campaign)': '2026 巴黎车展全球公关传播',
    '内容标题 (Title)': '广汽巴黎车展高光时刻海外多平台分发',
    '切入点/主题 (Topic)': '新车发布高光速递',
    '计划发布/截止日期': '2026-09-15',
    '核心创作方向/Brief诉求': '【直发类型】官方提供巴黎车展精修 9:16 短视频，达人直接排期发布并带 #GACParis2026 话题。',
  },
];

/**
 * 导出标准立项 Excel 模板 (.xlsx)
 * 包含用户原表完整 22+ 项字段（基础立项信息 + 附加合作权益与交付细则）
 */
export function downloadExcelTemplate() {
  const wb = XLSX.utils.book_new();

  // 1. Data Sheet with Samples
  const wsData = XLSX.utils.json_to_sheet(SAMPLE_INITIATION_DATA);

  // Set column widths
  wsData['!cols'] = [
    { wch: 6 },  // NO.
    { wch: 10 }, // 量级
    { wch: 20 }, // Name
    { wch: 14 }, // country
    { wch: 12 }, // category
    { wch: 14 }, // Platfrom
    { wch: 32 }, // Social Media
    { wch: 14 }, // Followers
    { wch: 22 }, // 资源
    { wch: 14 }, // 费用（净价）
    { wch: 12 }, // 视频/直播
    { wch: 30 }, // 备注
    { wch: 14 }, // 预估播放量
    { wch: 30 }, // 反馈
    { wch: 36 }, // 粉丝画像
    { wch: 20 }, // 是否可以发预热视频
    { wch: 24 }, // 是否可以配合证言（如有）
    { wch: 26 }, // 肖像授权官方（授权时间）
    { wch: 28 }, // 视频是否可以授权官方二剪二创
    { wch: 30 }, // 视频是否可以得到原视频提供网盘
    { wch: 38 }, // 是否可以评论区圈官方账号/挂官网车型link/挂bio link
    { wch: 32 }, // 如官方能投流是否可以提供投流code
    { wch: 26 }, // 营销活动 (Campaign)
    { wch: 32 }, // 内容标题 (Title)
    { wch: 28 }, // 切入点/主题 (Topic)
    { wch: 16 }, // 计划发布/截止日期
    { wch: 45 }, // 核心创作方向/Brief诉求
  ];

  XLSX.utils.book_append_sheet(wb, wsData, '达人批量立项与合作权益表');

  // 2. Guide Sheet with Column Definitions
  const guideRows = INITIATION_TEMPLATE_COLUMNS.map((col, idx) => ({
    序号: idx + 1,
    字段名称: col.header,
    分类属性: col.isAddon ? '附加合作权益与细则（可选）' : '基础核心立项字段',
    填写规则: col.required ? '必填' : '选填',
    示例值: col.example,
    填写规范与说明: col.description,
  }));

  const wsGuide = XLSX.utils.json_to_sheet(guideRows);
  wsGuide['!cols'] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 26 },
    { wch: 12 },
    { wch: 30 },
    { wch: 65 },
  ];

  XLSX.utils.book_append_sheet(wb, wsGuide, '字段填写规范说明');

  // Download file
  XLSX.writeFile(wb, '广汽国际海外KOL合作立项与权益标准模板.xlsx');
}

export const downloadStandardBriefExcelTemplate = downloadExcelTemplate;

/**
 * 导出标准 CSV 模板 (.csv)
 */
export function downloadCsvTemplate() {
  const ws = XLSX.utils.json_to_sheet(SAMPLE_INITIATION_DATA);
  const csvOutput = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '广汽国际海外KOL合作立项与权益标准模板.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 解析上传的 Excel / CSV 文件为 Raw Rows 列表
 */
export async function parseExcelOrCsvFile(file: File): Promise<any[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  return rawRows;
}

/**
 * 解析粘贴的文本数据（支持 TSV / CSV / Markdown 表格）
 */
export function parsePastedTableText(text: string): any[] {
  if (!text || !text.trim()) return [];

  const cleanText = text.trim();

  // Check if it's markdown table
  if (cleanText.includes('|')) {
    const lines = cleanText.split('\n').filter((l) => l.trim() && !l.trim().startsWith('|---') && !l.trim().startsWith('| ---'));
    if (lines.length >= 2) {
      const headers = lines[0]
        .split('|')
        .map((h) => h.trim())
        .filter(Boolean);
      const rows: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.includes('---')) continue;
        const cells = line
          .split('|')
          .map((c) => c.trim())
          .filter((_, idx, arr) => (line.startsWith('|') ? idx > 0 && idx < arr.length : true));

        const rowObj: Record<string, string> = {};
        headers.forEach((h, hIdx) => {
          rowObj[h] = cells[hIdx] || '';
        });
        if (Object.values(rowObj).some(Boolean)) {
          rows.push(rowObj);
        }
      }
      if (rows.length > 0) return rows;
    }
  }

  // Use XLSX reader for TSV/CSV text
  try {
    const workbook = XLSX.read(cleanText, { type: 'string' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    if (rows && rows.length > 0) return rows;
  } catch (e) {
    console.warn('XLSX text parse fallback to TSV splitting:', e);
  }

  // Fallback simple TSV splitting
  const lines = cleanText.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = cells[idx] || '';
    });
    if (Object.values(obj).some(Boolean)) {
      rows.push(obj);
    }
  }

  return rows;
}

/**
 * 智能映射提取候选立项项目
 * 完整支持用户真实采购表中的基础字段与所有附加权益细则（去除了原有的账号属性）
 */
export function mapRawRowsToCandidates(
  rawRows: any[],
  campaigns: Campaign[],
  kols: KOL[]
): InitiationCandidate[] {
  return rawRows.map((row, index) => {
    // Helper to extract values with flexible header matching
    const getVal = (possibleHeaders: string[]): string => {
      for (const ph of possibleHeaders) {
        for (const [k, v] of Object.entries(row)) {
          const cleanK = k.toLowerCase().replace(/[\s_()（）\-#.:]/g, '');
          const cleanPh = ph.toLowerCase().replace(/[\s_()（）\-#.:]/g, '');
          if (cleanK === cleanPh || cleanK.includes(cleanPh) || cleanPh.includes(cleanK)) {
            return String(v !== undefined && v !== null ? v : '').trim();
          }
        }
      }
      return '';
    };

    // 1. 基础核心字段提取
    const campaignRaw = getVal(['营销活动', '活动名称', '活动', 'Campaign', 'campaign', '所属活动']);
    const kolRaw = getVal(['Name', 'name', '达人名称', '达人姓名', '达人账号', '达人', 'KOL', 'kol', '博主', '账号']);
    const titleRaw = getVal(['内容标题', '标题', 'Title', 'title', '任务名称', '合作标题', '内容名称']);
    const topicRaw = getVal(['切入点', '主题', 'Topic', 'topic', '卖点', '核心切入点']);
    const categoryRaw = getVal(['category', 'Category', '合作类型', '内容类型', '类型', '制作类型', '合作形式']);
    const platformRaw = getVal(['Platfrom', 'platfrom', 'Platform', 'platform', '合作平台', '平台', '发布平台', '渠道']);
    const costRaw = getVal(['费用（净价）', '费用(净价)', '净价', '费用', '合作费用', '预算费用', '预算', 'Cost', 'cost', 'budget', '金额', '报价']);
    const viewsRaw = getVal(['预估播放量', '预估播放', '播放量', 'Views', 'views', '曝光预估']);
    const deadlineRaw = getVal(['计划发布', '截止日期', '发布日期', '排期', 'Deadline', 'deadline', '交付时间', '上线时间']);
    const briefRaw = getVal(['核心创作方向', 'Brief诉求', 'Brief要点', '创作建议', '诉求', 'Brief', '创作方向', '核心卖点']);
    const countryRaw = getVal(['country', 'Country', '国家', '地区', '投放目标地区', '目标地区', 'Region', 'region', '区域']);
    const followersRaw = getVal(['Followers', 'followers', '达人粉丝量', '粉丝量', '粉丝数', '粉丝']);

    // 2. 附加权益与交付细则提取 (匹配用户真实表格各列)
    const tierRaw = getVal(['量级', 'tier', 'Tier', '级别', '层级']);
    const socialMediaRaw = getVal(['Social Media', 'SocialMedia', 'social media', '社交媒体', '主页链接', '达人主页', '链接', 'url']);
    const resourceRaw = getVal(['资源', '合作资源', '交付资源', '资源类型', 'resource', 'Resource']);
    const videoOrLiveRaw = getVal(['视频/直播', '视频直播', '视频或直播', '直播', 'video/live']);
    const notesRaw = getVal(['备注', 'notes', 'Notes', 'remarks', '说明']);
    const feedbackRaw = getVal(['反馈', '达人反馈', '意向', '沟通反馈', 'feedback', 'Feedback']);
    const personaRaw = getVal(['粉丝画像', '受众画像', '受众', '画像', 'demographics', 'persona']);
    const teaserRaw = getVal(['是否可以发预热视频', '发预热视频', '预热视频', 'teaser']);
    const testimonialRaw = getVal(['是否可以配合证言', '配合证言', '证言', 'testimonial']);
    const portraitAuthRaw = getVal(['肖像授权官方', '肖像授权', '授权时间', '肖像']);
    const remixRaw = getVal(['视频是否可以授权官方二剪二创', '官方二剪二创', '二剪二创', '二创授权', 'remix']);
    const rawFootageRaw = getVal(['视频是否可以得到原视频提供网盘', '原视频提供网盘', '提供网盘', '原片网盘', '原片', 'raw footage']);
    const pinLinkRaw = getVal(['是否可以评论区圈官方账号/挂官网车型link/挂bio link', '圈官方账号', '挂官网', '挂bio link', '评论区圈官方', '置顶链接']);
    const adCodeRaw = getVal(['如官方能投流是否可以提供投流code', '投流code', '投流码', 'spark code', '投流']);

    // 3. 智能 Campaign 匹配
    let matchedCampaign = campaigns.find(
      (c) => c.name.toLowerCase() === campaignRaw.toLowerCase() || c.id === campaignRaw
    );
    if (!matchedCampaign && campaignRaw) {
      matchedCampaign = campaigns.find(
        (c) => c.name.toLowerCase().includes(campaignRaw.toLowerCase()) || campaignRaw.toLowerCase().includes(c.name.toLowerCase())
      );
    }
    const finalCampaignId = matchedCampaign ? matchedCampaign.id : campaigns[0]?.id || 'camp-1';
    const finalCampaignName = matchedCampaign ? matchedCampaign.name : campaignRaw || (campaigns[0]?.name || '默认营销活动');

    // 4. 智能 KOL 匹配
    let matchedKol = kols.find(
      (k) => k.name.toLowerCase() === kolRaw.toLowerCase() || k.id === kolRaw
    );
    if (!matchedKol && kolRaw) {
      matchedKol = kols.find(
        (k) => k.name.toLowerCase().includes(kolRaw.toLowerCase()) || kolRaw.toLowerCase().includes(k.name.toLowerCase())
      );
    }
    const finalKolId = matchedKol ? matchedKol.id : '';
    const finalKolName = matchedKol ? matchedKol.name : kolRaw || `新达人候选_${index + 1}`;
    const isNewKol = !matchedKol;

    // 5. 规范化 Category (原创 / 二创 / 直发)
    let finalCategory: ContentCategory = '原创';
    const catLower = categoryRaw.toLowerCase();
    if (catLower.includes('直发') || catLower.includes('直接发布') || catLower.includes('direct')) {
      finalCategory = '直发';
    } else if (catLower.includes('二创') || catLower.includes('二次') || catLower.includes('剪辑') || catLower.includes('secondary')) {
      finalCategory = '二创';
    } else {
      finalCategory = '原创';
    }

    // 6. 规范化 Platform
    let finalPlatform: Platform = 'Youtube';
    const platLower = platformRaw.toLowerCase();
    if (platLower.includes('tiktok') || platLower.includes('tk')) {
      finalPlatform = 'Tiktok';
    } else if (platLower.includes('instagram') || platLower.includes('ins') || platLower.includes('ig')) {
      finalPlatform = 'Instagram';
    } else if (platLower.includes('facebook') || platLower.includes('fb')) {
      finalPlatform = 'Facebook';
    } else if (platLower.includes('youtube') || platLower.includes('yt') || platLower.includes('油管')) {
      finalPlatform = 'Youtube';
    } else if (platformRaw) {
      finalPlatform = '其他';
    }

    // 7. 规范化 Deadline (YYYY-MM-DD)
    let finalDeadline = deadlineRaw;
    if (deadlineRaw) {
      // Check if it's Excel serial number
      if (/^\d{5}$/.test(deadlineRaw)) {
        const excelDate = new Date((parseInt(deadlineRaw, 10) - (25567 + 2)) * 86400 * 1000);
        if (!isNaN(excelDate.getTime())) {
          finalDeadline = excelDate.toISOString().split('T')[0];
        }
      } else {
        const parsedDate = new Date(deadlineRaw.replace(/\//g, '-'));
        if (!isNaN(parsedDate.getTime())) {
          finalDeadline = parsedDate.toISOString().split('T')[0];
        }
      }
    }
    if (!finalDeadline) {
      // Default 14 days later
      const defaultDate = new Date(Date.now() + 14 * 86400 * 1000);
      finalDeadline = defaultDate.toISOString().split('T')[0];
    }

    // 8. Title & Topic fallback
    const finalTitle = titleRaw || `${finalKolName} - ${finalCategory}出海实测项目`;
    const finalTopic = topicRaw || (finalCategory === '直发' ? '官方高光素材海外分发' : '广汽智造与出海实测');

    // 9. Quality/Validation Status
    const warnings: string[] = [];
    if (!campaignRaw) warnings.push('未指定 Campaign，已默认关联');
    if (!kolRaw) warnings.push('缺少达人名称');
    if (isNewKol && kolRaw) warnings.push('新达人（将自动建档）');
    if (!titleRaw) warnings.push('标题为系统自动生成');

    return {
      tempId: `candidate-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
      selected: true,
      campaignId: finalCampaignId,
      campaignName: finalCampaignName,
      kolId: finalKolId,
      kolName: finalKolName,
      isNewKol,
      title: finalTitle,
      topic: finalTopic,
      category: finalCategory,
      platform: finalPlatform,
      collaborationCost: costRaw || '12000',
      avgViews: viewsRaw || '500,000',
      deadline: finalDeadline,
      creativeDirection: briefRaw || (finalCategory === '直发' ? '使用官方 4K 宣传成片，达人直接排期发布。' : '围绕广汽全球化品质与核心卖点进行本地化创作。'),
      region: countryRaw || '欧洲',
      followers: followersRaw || (matchedKol?.followers || '50.0万'),

      // 附加合作权益与细则
      tier: tierRaw || (matchedKol?.category ? '中腰部' : '腰部达人'),
      socialMediaUrl: socialMediaRaw || matchedKol?.profileUrl || '',
      resourceType: resourceRaw || (finalCategory === '直发' ? '1条 9:16 短视频' : '1条 Dedicated 长视频'),
      videoOrLive: videoOrLiveRaw || '视频',
      notes: notesRaw || '',
      feedback: feedbackRaw || '已进入初选沟通',
      audiencePersona: personaRaw || '25-45岁/汽车与科技爱好者',
      canTeaserVideo: teaserRaw || '是',
      canTestimonial: testimonialRaw || '是',
      portraitAuthDuration: portraitAuthRaw || '1年',
      canSecondaryCreation: remixRaw || '是',
      canProvideRawFootage: rawFootageRaw || '是',
      canPinLinkOrMention: pinLinkRaw || '是',
      canProvideAdCode: adCodeRaw || '提供 Spark Code',

      warnings,
      status: warnings.length === 0 ? 'valid' : isNewKol ? 'new_kol' : 'warning',
    };
  });
}
