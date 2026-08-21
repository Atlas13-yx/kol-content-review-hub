export type Platform = 'Tiktok' | 'Instagram' | 'Facebook' | 'Youtube' | '其他';

export type UserRole = 'Me' | 'Agency';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  agencyName?: string;
  avatar?: string;
}
export type CampaignStatus = 'Active' | 'Completed' | 'Archived';

export type ContentCategory = '原创' | '二创' | '直发';

export type Stage = 'KOL Selection' | 'Brief' | 'Script' | 'Video' | 'Completed';

export type Status = 
  // KOL Selection
  | 'Pending KOL Confirmation'
  | 'KOL Confirmed'
  // Brief
  | 'Brief Draft'
  | 'Brief Sent'
  | 'Waiting for Brief Approval'
  | 'Brief Approved'
  | 'Waiting for KOL Script'
  // Script
  | 'Waiting for Agency Review'
  | 'Waiting for My Review'
  | 'Waiting for KOL Revision'
  | 'Script Approved'
  // Video
  | 'Waiting for KOL Video'
  | 'Video Approved'
  | 'Pending Publish Link'
  | 'Pending Data Entry'
  // Completed
  | 'Completed';

export type CurrentOwner = 'Me' | 'Agency' | 'KOL' | 'None';

export type VersionStatus = 'Submitted' | 'In Review' | 'Revision Requested' | 'Approved';

export type ReviewerType = 'Agency' | 'Me' | 'Final Feedback';

export type AssetType = 'Script' | 'Video';

export interface PerformanceData {
  publishedAt?: string;
  publishUrl?: string;
  views?: number;        // 播放量
  likes?: number;        // 点赞量
  comments?: number;     // 评论量
  favorites?: number;    // 收藏量
  shares?: number;       // 转发量
  engagements?: number;  // 互动量 (点赞量 + 评论量 + 收藏量 + 转发量)
  engagementRate?: number; // 互动率 ((互动量 / 播放量) * 100)%
  threeSecondPlayRate?: number; // 3秒完播率 (%)
  updatedAt?: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  brief: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  targetOriginal: number;  // 原创目标数, eg. 3
  targetSecondary: number; // 二创目标数, eg. 5
  targetDirectPost?: number; // 直发目标数, eg. 2
  availableMaterials?: string[]; // 该 Campaign 专属可提供的素材清单
  createdAt: string;
  updatedAt: string;
}

export type KolTier = '头部' | '腰部' | '尾部';
export type KolRosterStatus = '白名单' | '黑名单' | '普通';

export interface KolHistoricalMetrics {
  avgViews?: number;               // 历史平均播放量
  avgLikes?: number;               // 历史平均点赞数
  avgComments?: number;            // 历史平均评论数
  avgEngagementRate?: number;      // 历史平均互动率 (%)
  highestViews?: number;           // 历史最高/爆款播放量
  avgCpm?: number;                 // 历史合作 CPM 参考价 (元)
  cooperationRating?: number;      // 历史合作评级 (1-5 星)
  cooperatedBrandCount?: number;   // 过往合作汽车/出海品牌数
  historicalCooperationNotes?: string; // 过往合作评价与配合度记录
}

export interface KolPastWork {
  id: string;
  title: string;                   // 作品标题 / 主题
  url: string;                     // 发布的作品链接 (如 YouTube/TikTok/Instagram 链接)
  platform?: Platform;             // 发布平台
  publishDate?: string;            // 发布日期 (如 2026-04-10)
  views?: number | string;         // 实际播放量 / 曝光量 (如: 450,000)
  likes?: number | string;         // 实际点赞量 (如: 32,000)
  comments?: number | string;      // 实际评论/互动数 (如: 1,800)
  engagementRate?: number | string;// 单条互动率 (%)
  category?: string;               // 产出类型 ('原创' | '二创' | '直发')
  highlights?: string;             // 作品亮点 / 爆款要点 / 客户车型
  cooperatedBrand?: string;        // 合作车企/品牌
}

export interface KOL {
  id: string;
  name: string;
  platform: Platform;
  profileUrl: string;
  followers?: string;
  avatar: string;

  // 统一达人库标签体系
  rosterStatus?: KolRosterStatus;  // 黑白名单 ('白名单' | '黑名单' | '普通')
  tier?: KolTier;                  // 定位 ('头部' | '腰部' | '尾部')
  outputTypes?: string[];          // 产出类型 (如: 试驾测评, 深度解析, 出海溯源, 家庭自驾, 趣味剧情, 开箱体验, 街头访谈, 技术拆解, 生活Vlog)
  customTags?: string[];           // 自定义标签
  tags?: string[];                 // 达人所有聚合标签

  // 过往数据与作品
  historicalMetrics?: KolHistoricalMetrics; // 过往表现统计数据
  pastWorks?: KolPastWork[];               // 过往发布的作品链接列表

  category?: string;               // 达人所属分类/领域
  region?: string;                 // 国家/地区
  contact?: string;                // 联系方式 (邮箱/电话/WhatsApp等)
  notes?: string;                  // 达人属性与配合度备注
  createdAt: string;
  updatedAt: string;
}

export type KolSelectionBatchStatus = 'Pending GAC Review' | 'Approved' | 'Revision Required';

export interface KolSelectionBatch {
  id: string;
  campaignId: string;
  batchNumber: number;
  title: string;
  candidateCount?: number;
  
  // 省广提报上传信息
  agencyFileName: string;
  agencyFileSize?: string;
  agencyFileUrl?: string;
  agencySheetUrl?: string; // 在线表格/文档链接
  agencyNotes?: string;   // 提报说明/初选考量
  agencySubmittedAt: string;
  agencySubmittedBy: string; // 提报人/团队 (如: "省广集团 GIMC 海外媒介组")

  // 广汽国际审核与反馈表格提交通道
  status: KolSelectionBatchStatus;
  gacFileName?: string;     // 广汽国际反馈表格文件名
  gacFileSize?: string;
  gacFileUrl?: string;
  gacSheetUrl?: string;    // 广汽国际在线批注表格链接
  gacNotes?: string;       // 广汽国际定选与批复意见
  gacReviewedAt?: string;
  gacReviewedBy?: string;  // 审核人 (如: "广汽国际 GAC 海外营销部")
  approvedKolCount?: number; // 最终通过定选达人数

  createdAt: string;
  updatedAt: string;
}

export interface BriefData {
  // KOL & Account Metrics (对应表格列)
  followersCount?: string;       // 粉丝量 (如: 63,000 / 6.3万)
  tier?: string;                 // 量级 (如: 头部, 中腰部, 尾部, KOC, S/A/B级)
  region?: string;               // 地区/国家 (如: 俄罗斯, 欧洲, 中东, 东南亚, 英国)
  accountCategory?: string;      // 账号分类/领域 (如: 汽车测评, 科技, 生活自驾, 探店)
  category?: ContentCategory;    // 内容/合作类型 (原创 / 二创 / 直发)
  avgViews?: number | string;    // 平均播放量 (如: 550,000)
  avgEngagements?: number | string; // 平均互动量 (如: 16,000)
  collaborationCost?: number | string; // 费用（净价） / 合作预算 (如: 15000)
  adBoostCooperation?: string;   // 投流合作 (如: 愿意辅助投流, 包含投流授权, 不支持)
  
  // 附加合作权益与交付细则 (用户标准表拓展附加项)
  socialMediaUrl?: string;       // 社交媒体主页/链接 (Social Media)
  resourceType?: string;         // 资源形式 (如: 1条Dedicated长视频 / 1条Reels / 1条Shorts / 图文帖)
  videoOrLive?: string;          // 形式 (视频 / 直播)
  feedback?: string;             // 达人沟通反馈 / 意向进展 (反馈)
  audiencePersona?: string;      // 粉丝画像 (如: 25-45岁男性/汽车发烧友/科技数码)
  canTeaserVideo?: string;       // 是否可以发预热视频 (是 / 否)
  canTestimonial?: string;       // 是否可以配合证言（如有） (是 / 否)
  portraitAuthDuration?: string; // 肖像授权官方（授权时间） (如: 3个月 / 6个月 / 1年 / 永久 / 否)
  canSecondaryCreation?: string; // 视频是否可以授权官方二剪二创 (是 / 否)
  canProvideRawFootage?: string; // 视频是否可以得到原视频提供网盘 (是 / 否)
  canPinLinkOrMention?: string;  // 是否可以评论区圈官方账号/挂官网车型link/挂bio link (是 / 否)
  canProvideAdCode?: string;     // 如官方能投流是否可以提供投流code (是 / 否 / 提供Spark Code)

  // Creative & Core Angle (创作建议与核心诉求)
  creativeDirection?: string;    // 创作建议与核心诉求 (Creative Direction)
  providedAssets?: string[];     // 素材提供清单 (根据 Campaign 动态匹配及勾选)
  
  // Estimation & Remarks (预估指标与备注)
  remarks?: string;              // 备注
  estimatedViews?: string | number;       // 预估播放量 (如: 25000+)
  estimatedEngagements?: string | number; // 预估互动量 (如: 500+)
  estimatedCpc?: string | number;         // 预估CPC (如: 0.60)
  
  // Submission & Audit Metadata
  briefDocUrl?: string;          // Brief 附件或在线文档链接
  submittedBy?: string;          // 提交方 (如: 省广集团 GIMC)
  submittedAt?: string;          // 提交时间
  approvedAt?: string;           // 广汽国际审核核准时间
  reviewFeedback?: string;       // 广汽国际审核批注 / 修改意见
}

export interface ContentItem {
  id: string;
  campaignId: string;
  kolId: string;
  title: string;
  topic: string;
  platform: Platform;
  category: ContentCategory; // '原创' | '二创'
  stage: Stage;
  status: Status;
  currentOwner: CurrentOwner;
  owner: string;
  deadline: string;
  briefText: string;
  briefUrl: string;
  briefData?: BriefData; // 完整的结构化 Brief 数据 (对应省广标准提报表格)
  notes: string;
  initiatedBy?: UserRole; // 立项方 ('Me' 广汽国际 | 'Agency' 省广代理商)
  initiatedAt?: string;   // 立项时间
  videoApprovedAt?: string; // 广汽国际同意视频发布时间
  linkUploadDeadline?: string; // 1天内提醒省广上传发布链接截止时间
  linkUploadedAt?: string; // 省广实际上传发布链接时间
  dataReminderDate?: string; // 3天后提醒省广补充数据时间
  performanceData?: PerformanceData; // 手动录入的发布后数据
  coverUrl?: string; // 视频封面图 (可选项)
  createdAt: string;
  updatedAt: string;
}

export interface AiScriptAuditResult {
  score: number;
  overallPass: boolean;
  summary: string;
  unmatchedPoints: string[]; // 1, 2, 3 点与 Brief 未匹配/缺失项
  matchedPoints: string[];   // 已匹配项目
  revisionPoints: string[];  // 提出来的修改建议
  agencyReviewDraft?: string; // 省广初审意见草稿
}

export interface ScriptVersion {
  id: string;
  contentId: string;
  versionNumber: number;
  title: string;
  scriptText: string;
  fileUrl?: string;
  submittedAt: string;
  status: VersionStatus;
  aiAuditResult?: AiScriptAuditResult; // 提交后自动 AI Agent 与 Brief 匹配的诊断结果
  createdAt: string;
}

export interface VideoVersion {
  id: string;
  contentId: string;
  versionNumber: number;
  videoUrl: string;
  fileUrl?: string;
  coverUrl?: string; // 视频封面图 (可选项: URL 或 Base64 图片)
  coverFileName?: string; // 视频封面文件名
  coverSubmittedAt?: string; // 封面图提交时间
  coverRemarks?: string; // 封面设计要点/文案说明 (可选)
  submittedAt: string;
  status: VersionStatus;
  createdAt: string;
}

export interface Review {
  id: string;
  contentId: string;
  assetType: AssetType;
  versionId: string;
  reviewerType: ReviewerType;
  reviewContent: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  contentId: string;
  title: string;
  description: string;
  actor: 'System' | 'Me' | 'Agency' | 'KOL';
  timestamp: string;
  type: 'brief' | 'script_sub' | 'agency_rev' | 'my_rev' | 'approved' | 'revision_req' | 'video_sub' | 'completed';
}

export type NotificationType =
  | 'stage_handover'     // 流程流转移交下一个负责人
  | 'campaign_deadline'  // Campaign 结束前3天提醒
  | 'kol_selection'      // 达人筛选提报/反馈提醒
  | 'reminder_publish'   // 视频通过后1天提醒上传链接
  | 'reminder_data'      // 发布后3天提醒补充数据
  | 'system';            // 系统通知

export interface SystemNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  recipientRole: UserRole | 'All'; // 'Me' | 'Agency' | 'All' (提醒双方)
  relatedId?: string; // contentId, campaignId, batchId
  relatedType?: 'content' | 'campaign' | 'kol_selection' | 'brief' | 'script' | 'video' | 'kol';
  targetPage?: string;
  targetParams?: Record<string, any>;
  createdAt: string;
  read: boolean;
  dismissed: boolean; // 是否已点击 × 消除右上角弹窗
  highlight?: boolean;
}

// Helper labels mapping enums to Chinese
export const STATUS_LABELS: Record<Status, string> = {
  'Pending KOL Confirmation': '待确认合作达人',
  'KOL Confirmed': '达人已确认入选',
  'Brief Draft': 'Brief 草稿制定中',
  'Brief Sent': 'Brief 已发送',
  'Waiting for Brief Approval': '等待 Brief 审核',
  'Brief Approved': 'Brief 已通过',
  'Waiting for KOL Script': '等待达人脚本',
  'Waiting for Agency Review': '等待省广审核',
  'Waiting for My Review': '等待广汽国际审核',
  'Waiting for KOL Revision': '等待达人修改',
  'Script Approved': '脚本已通过',
  'Waiting for KOL Video': '等待达人视频',
  'Video Approved': '视频已通过',
  'Pending Publish Link': '待省广上传链接(1天内)',
  'Pending Data Entry': '待省广补充数据(3天后)',
  'Completed': '已完成',
};

export const STAGE_LABELS: Record<Stage, string> = {
  'KOL Selection': '达人筛选',
  'Brief': 'Brief 阶段',
  'Script': '脚本阶段',
  'Video': '视频阶段',
  'Completed': '已完成',
};

export const OWNER_LABELS: Record<CurrentOwner, string> = {
  'Me': '广汽国际',
  'Agency': '省广代理商',
  'KOL': '达人',
  'None': '无责任方',
};

export interface InitiationCandidate {
  tempId: string;
  selected: boolean;
  campaignId: string;
  campaignName: string;
  kolId: string;
  kolName: string;
  isNewKol?: boolean;
  title: string;
  topic: string;
  category: ContentCategory;
  platform: Platform;
  collaborationCost: string | number;
  avgViews: string | number;
  deadline: string;
  creativeDirection: string;
  region: string;
  followers: string;

  // 附加合作权益与细则 (选择填写项)
  tier?: string;                 // 量级
  socialMediaUrl?: string;       // 社交媒体链接
  resourceType?: string;         // 资源形式
  videoOrLive?: string;          // 视频/直播
  notes?: string;                // 备注
  feedback?: string;             // 反馈
  audiencePersona?: string;      // 粉丝画像
  canTeaserVideo?: string;       // 是否可以发预热视频
  canTestimonial?: string;       // 是否可以配合证言
  portraitAuthDuration?: string; // 肖像授权官方（授权时间）
  canSecondaryCreation?: string; // 视频是否可以授权官方二剪二创
  canProvideRawFootage?: string; // 视频是否可以得到原视频提供网盘
  canPinLinkOrMention?: string;  // 是否可以评论区圈官方账号/挂官网车型link/挂bio link
  canProvideAdCode?: string;     // 如官方能投流是否可以提供投流code

  warnings?: string[];
  status?: 'valid' | 'warning' | 'new_kol';
}

// --- 系统安全与合规基线相关类型定义 ---

export type AuditSecurityLevel = 'INFO' | 'WARNING' | 'CRITICAL';

export type AuditActionType =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'ROLE_SWITCH'
  | 'EXPORT_DATA'
  | 'KOL_CREATE'
  | 'KOL_UPDATE'
  | 'KOL_DELETE'
  | 'BRIEF_UPLOAD'
  | 'REVIEW_PASS'
  | 'REVIEW_REJECT'
  | 'AI_AUDIT'
  | 'INITIATION_IMPORT'
  | 'DATA_UNMASK_VIEW'
  | 'DATA_EXPORT_COMPLIANCE'
  | 'PASSWORD_CHANGE';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actionType: AuditActionType;
  operatorName: string;
  operatorRole: UserRole | 'System';
  operatorIp?: string;
  targetResource: string;
  details: string;
  securityLevel: AuditSecurityLevel;
}

export interface SecurityBaselineItem {
  categoryNo: number;
  categoryName: string;
  subNo: string;
  subName: string;
  threeNo: string;
  requirement: string;
  satisfaction: '满足' | '不适用';
  implementationNotes: string;
}
