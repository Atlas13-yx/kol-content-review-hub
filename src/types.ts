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
  briefRequirement?: string;
  budget?: number;
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

export interface KOL {
  id: string;
  name: string;
  platform: Platform;
  profileUrl: string;
  followers?: string;
  avatar: string;
  tags?: string[]; // 达人标签 (如: '白名单', '黑名单', '核心S级', '二创达人', 自建分类等)
  category?: string; // 达人所属分类
  contact?: string; // 可选
  notes?: string;   // 可选
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
  briefMatchScore?: number;
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
  | 'review_deadline'    // 审核截止时间提醒
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
