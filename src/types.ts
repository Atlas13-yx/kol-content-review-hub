export type Platform = '小红书' | '抖音' | 'B站' | '微博' | '视频号' | '其他';

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

export type ContentCategory = '原创' | '二创';

export type Stage = 'Brief' | 'Script' | 'Video' | 'Completed';

export type Status = 
  // Brief
  | 'Brief Draft'
  | 'Brief Sent'
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
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
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
  createdAt: string;
  updatedAt: string;
}

export interface KOL {
  id: string;
  name: string;
  platform: Platform;
  profileUrl: string;
  followers: string;
  avatar: string;
  contact: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
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
  notes: string;
  videoApprovedAt?: string; // 广汽国际同意视频发布时间
  linkUploadDeadline?: string; // 1天内提醒省广上传发布链接截止时间
  linkUploadedAt?: string; // 省广实际上传发布链接时间
  dataReminderDate?: string; // 3天后提醒广汽国际手动补充数据时间
  performanceData?: PerformanceData; // 手动录入的发布后数据
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
}

export interface VideoVersion {
  id: string;
  contentId: string;
  versionNumber: number;
  videoUrl: string;
  fileUrl?: string;
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

// Helper labels mapping enums to Chinese
export const STATUS_LABELS: Record<Status, string> = {
  'Brief Draft': 'Brief 草稿',
  'Brief Sent': 'Brief 已发送',
  'Waiting for KOL Script': '等待达人脚本',
  'Waiting for Agency Review': '等待省广审核',
  'Waiting for My Review': '等待广汽国际审核',
  'Waiting for KOL Revision': '等待达人修改',
  'Script Approved': '脚本已通过',
  'Waiting for KOL Video': '等待达人视频',
  'Video Approved': '视频已通过',
  'Pending Publish Link': '待省广上传链接(1天内)',
  'Pending Data Entry': '待广汽补充数据(3天后)',
  'Completed': '已完成',
};

export const STAGE_LABELS: Record<Stage, string> = {
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
