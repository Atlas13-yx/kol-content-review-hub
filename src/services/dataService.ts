import {
  Campaign,
  KOL,
  ContentItem,
  ScriptVersion,
  VideoVersion,
  Review,
  TimelineEvent,
  AssetType,
  UserRole,
  PerformanceData,
  UserAccount,
  Platform,
  Stage,
  Status,
  CurrentOwner,
  STAGE_LABELS,
  STATUS_LABELS,
  KolSelectionBatch,
  KolSelectionBatchStatus,
  SystemNotification,
  NotificationType,
  InitiationCandidate,
} from '../types';
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
} from '../data/mockData';

const STORAGE_KEYS = {
  CAMPAIGNS: 'kol_hub_campaigns_v1',
  KOLS: 'kol_hub_kols_v1',
  CONTENTS: 'kol_hub_contents_v1',
  SCRIPT_VERSIONS: 'kol_hub_scripts_v1',
  VIDEO_VERSIONS: 'kol_hub_videos_v1',
  REVIEWS: 'kol_hub_reviews_v1',
  TIMELINES: 'kol_hub_timelines_v1',
  KOL_SELECTION_BATCHES: 'kol_hub_kol_selection_batches_v1',
  NOTIFICATIONS: 'kol_hub_notifications_v1',
  USER_ROLE: 'kol_hub_user_role_v1',
  USER_ACCOUNT: 'kol_hub_user_account_v1',
  IS_LOGGED_IN: 'kol_hub_is_logged_in_v1',
};

const DEFAULT_ACCOUNTS: Record<UserRole, UserAccount> = {
  Me: {
    id: 'acc-gac',
    username: 'gac_admin',
    name: '广汽国际审核团队',
    role: 'Me',
    agencyName: '广汽国际 GAC International',
  },
  Agency: {
    id: 'acc-agency',
    username: 'agency_user',
    name: '省广代理商项目组',
    role: 'Agency',
    agencyName: '省广营销集团 GIMC',
  },
};

class DataService {
  private campaigns: Campaign[];
  private kols: KOL[];
  private contents: ContentItem[];
  private scriptVersions: ScriptVersion[];
  private videoVersions: VideoVersion[];
  private reviews: Review[];
  private timelines: TimelineEvent[];
  private kolSelectionBatches: KolSelectionBatch[];
  private notifications: SystemNotification[];
  private currentRole: UserRole;
  private currentUser: UserAccount | null;
  private isLoggedInState: boolean;
  private lastServerTimestamp: string = '';
  private listeners: Set<() => void> = new Set();
  private pollTimer: any = null;

  constructor() {
    this.campaigns = this.loadFromStorage(STORAGE_KEYS.CAMPAIGNS, INITIAL_CAMPAIGNS);
    this.kols = this.loadFromStorage(STORAGE_KEYS.KOLS, INITIAL_KOLS);
    this.contents = this.loadFromStorage(STORAGE_KEYS.CONTENTS, INITIAL_CONTENTS);
    this.scriptVersions = this.loadFromStorage(STORAGE_KEYS.SCRIPT_VERSIONS, INITIAL_SCRIPT_VERSIONS);
    this.videoVersions = this.loadFromStorage(STORAGE_KEYS.VIDEO_VERSIONS, INITIAL_VIDEO_VERSIONS);
    this.reviews = this.loadFromStorage(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
    this.timelines = this.loadFromStorage(STORAGE_KEYS.TIMELINES, INITIAL_TIMELINES);
    this.kolSelectionBatches = this.loadFromStorage(STORAGE_KEYS.KOL_SELECTION_BATCHES, INITIAL_KOL_SELECTION_BATCHES);
    this.notifications = this.loadFromStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    this.currentRole = this.loadFromStorage(STORAGE_KEYS.USER_ROLE, 'Me');
    this.isLoggedInState = this.loadFromStorage(STORAGE_KEYS.IS_LOGGED_IN, false);
    this.currentUser = this.loadFromStorage(
      STORAGE_KEYS.USER_ACCOUNT,
      this.isLoggedInState ? DEFAULT_ACCOUNTS[this.currentRole] : null
    );

    // Run campaign deadline and publish/data reminder checks on startup
    this.checkCampaignDeadlines();
    this.checkPublishAndDataReminders();

    // Initial sync from Express backend & start polling
    this.fetchServerData();
    this.startPolling();
  }

  private loadFromStorage<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(this.campaigns));
      localStorage.setItem(STORAGE_KEYS.KOLS, JSON.stringify(this.kols));
      localStorage.setItem(STORAGE_KEYS.CONTENTS, JSON.stringify(this.contents));
      localStorage.setItem(STORAGE_KEYS.SCRIPT_VERSIONS, JSON.stringify(this.scriptVersions));
      localStorage.setItem(STORAGE_KEYS.VIDEO_VERSIONS, JSON.stringify(this.videoVersions));
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(this.reviews));
      localStorage.setItem(STORAGE_KEYS.TIMELINES, JSON.stringify(this.timelines));
      localStorage.setItem(STORAGE_KEYS.KOL_SELECTION_BATCHES, JSON.stringify(this.kolSelectionBatches));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notifications));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }

  // --- Backend Sync Methods ---

  private async fetchServerData() {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        if (data.updatedAt && data.updatedAt !== this.lastServerTimestamp) {
          this.lastServerTimestamp = data.updatedAt;
          this.campaigns = data.campaigns || [];
          this.kols = data.kols || [];
          this.contents = data.contents || [];
          this.scriptVersions = data.scriptVersions || [];
          this.videoVersions = data.videoVersions || [];
          this.reviews = data.reviews || [];
          this.timelines = data.timelines || [];
          this.kolSelectionBatches = data.kolSelectionBatches || [];
          if (data.notifications && data.notifications.length > 0) {
            this.notifications = data.notifications;
          }
          this.checkCampaignDeadlines();
          this.checkPublishAndDataReminders();
          this.saveToStorage();
        }
      }
    } catch (e) {
      // Offline / fallback to local state
    }
  }

  private startPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => {
      this.fetchServerData();
    }, 2500);
  }

  public resetToDemoData() {
    fetch('/api/reset', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          this.campaigns = data.data.campaigns;
          this.kols = data.data.kols;
          this.contents = data.data.contents;
          this.scriptVersions = data.data.scriptVersions;
          this.videoVersions = data.data.videoVersions;
          this.reviews = data.data.reviews;
          this.timelines = data.data.timelines;
          this.kolSelectionBatches = data.data.kolSelectionBatches || [...INITIAL_KOL_SELECTION_BATCHES];
          this.notifications = data.data.notifications || [...INITIAL_NOTIFICATIONS];
          this.checkCampaignDeadlines();
          this.saveToStorage();
        }
      })
      .catch(() => {
        this.campaigns = [...INITIAL_CAMPAIGNS];
        this.kols = [...INITIAL_KOLS];
        this.contents = [...INITIAL_CONTENTS];
        this.scriptVersions = [...INITIAL_SCRIPT_VERSIONS];
        this.videoVersions = [...INITIAL_VIDEO_VERSIONS];
        this.reviews = [...INITIAL_REVIEWS];
        this.timelines = [...INITIAL_TIMELINES];
        this.kolSelectionBatches = [...INITIAL_KOL_SELECTION_BATCHES];
        this.notifications = [...INITIAL_NOTIFICATIONS];
        this.checkCampaignDeadlines();
        this.saveToStorage();
      });
  }

  // --- Campaign Methods ---
  public getCampaigns(): Campaign[] {
    return [...this.campaigns];
  }

  public getCampaignById(id: string): Campaign | undefined {
    return this.campaigns.find((c) => c.id === id);
  }

  public getCampaignMaterials(campaignId?: string): string[] {
    if (campaignId) {
      const camp = this.getCampaignById(campaignId);
      if (camp && Array.isArray(camp.availableMaterials) && camp.availableMaterials.length > 0) {
        return camp.availableMaterials;
      }
    }
    // Fallback standard material list for generic campaign
    return [
      '官方 4K B-Roll 实拍素材包',
      '官方 KV 海报与多语种设计源文件',
      '车型卖点与技术参数手册',
      '智能座舱与智驾演示片段',
      '品牌高光宣传切片',
    ];
  }

  public canEditCampaign(): boolean {
    return this.currentRole === 'Me';
  }

  public canCreateCampaign(): boolean {
    return true; // Both Me and Agency can create campaigns
  }

  public addCampaign(camp: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Campaign {
    const newCamp: Campaign = {
      ...camp,
      id: `camp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.campaigns.unshift(newCamp);
    this.saveToStorage();

    fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...camp, createdBy: this.currentRole }),
    })
      .then(() => this.fetchServerData())
      .catch(() => {});

    return newCamp;
  }

  public updateCampaign(camp: Campaign) {
    if (!this.canEditCampaign()) {
      alert('【权限拦截】Campaign 后期调整与排期修改权限仅开放给广汽国际 (Me)，省广仅支持新建与查看！');
      return;
    }

    const index = this.campaigns.findIndex((c) => c.id === camp.id);
    if (index !== -1) {
      this.campaigns[index] = { ...camp, updatedAt: new Date().toISOString() };
      this.saveToStorage();

      fetch(`/api/campaigns/${camp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...camp, actor: this.currentRole }),
      })
        .then(() => this.fetchServerData())
        .catch(() => {});
    }
  }

  // --- Notification Methods ---
  public getNotifications(role?: UserRole, includeDismissed: boolean = true): SystemNotification[] {
    const activeRole = role || this.currentRole;
    return this.notifications.filter((n) => {
      const matchRole = n.recipientRole === activeRole || n.recipientRole === 'All';
      if (!matchRole) return false;
      if (!includeDismissed && n.dismissed) return false;
      return true;
    });
  }

  public getNotificationsForRole(role?: UserRole): SystemNotification[] {
    const activeRole = role || this.currentRole;
    return this.notifications.filter(
      (n) => n.recipientRole === activeRole || n.recipientRole === 'All'
    );
  }

  public getActiveToastNotifications(role?: UserRole): SystemNotification[] {
    const activeRole = role || this.currentRole;
    return this.notifications.filter(
      (n) => !n.dismissed && (n.recipientRole === activeRole || n.recipientRole === 'All')
    );
  }

  public getUnreadNotificationsCount(role?: UserRole): number {
    const activeRole = role || this.currentRole;
    return this.notifications.filter(
      (n) => !n.read && (n.recipientRole === activeRole || n.recipientRole === 'All')
    ).length;
  }

  public addNotification(notifData: {
    type: NotificationType;
    title: string;
    message: string;
    recipientRole: 'Me' | 'Agency' | 'All';
    relatedId?: string;
    relatedType?: 'campaign' | 'content' | 'kol' | 'brief' | 'script' | 'video' | 'kol_selection';
    targetPage?: 'campaigns' | 'kols' | 'kol-selection' | 'brief-review' | 'script-review' | 'video-review' | 'contents';
    targetParams?: Record<string, any>;
    highlight?: boolean;
  }): SystemNotification {
    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      read: false,
      dismissed: false,
      ...notifData,
    };

    this.notifications.unshift(newNotif);
    this.saveToStorage();

    fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNotif),
    }).catch(() => {});

    return newNotif;
  }

  public dismissNotification(id: string) {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) {
      notif.dismissed = true;
      this.saveToStorage();

      fetch(`/api/notifications/${id}/dismiss`, { method: 'PUT' }).catch(() => {});
    }
  }

  public dismissAllNotifications(role?: UserRole) {
    const activeRole = role || this.currentRole;
    this.notifications.forEach((n) => {
      if (n.recipientRole === activeRole || n.recipientRole === 'All') {
        n.dismissed = true;
      }
    });
    this.saveToStorage();

    fetch('/api/notifications/dismiss-all', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: activeRole }),
    }).catch(() => {});
  }

  public markNotificationRead(id: string) {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.saveToStorage();

      fetch(`/api/notifications/${id}/read`, { method: 'PUT' }).catch(() => {});
    }
  }

  public markNotificationAsRead(id: string) {
    this.markNotificationRead(id);
  }

  public markAllNotificationsRead(role?: UserRole) {
    const activeRole = role || this.currentRole;
    this.notifications.forEach((n) => {
      if (n.recipientRole === activeRole || n.recipientRole === 'All') {
        n.read = true;
      }
    });
    this.saveToStorage();

    fetch('/api/notifications/read-all', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: activeRole }),
    }).catch(() => {});
  }

  public deleteNotification(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.saveToStorage();

    fetch(`/api/notifications/${id}`, { method: 'DELETE' }).catch(() => {});
  }

  /**
   * 检查所有 Active Campaign 的结束倒计时（结束前 3 天触发预警提醒双方）
   */
  public checkCampaignDeadlines() {
    const now = new Date();
    this.campaigns.forEach((camp) => {
      if (camp.status !== 'Active') return;
      const endDate = new Date(camp.endDate);
      if (isNaN(endDate.getTime())) return;

      const diffTime = endDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // 结束前 3 天（<= 3 天）设置提醒双方还剩多少未完成
      if (daysLeft <= 3) {
        const campContents = this.contents.filter((c) => c.campaignId === camp.id);
        const uncompletedContents = campContents.filter((c) => c.stage !== 'Completed');
        const uncompletedCount = uncompletedContents.length;

        const pendingReviews = uncompletedContents.filter(
          (c) =>
            c.status.includes('Waiting') ||
            c.status.includes('Pending') ||
            c.status.includes('Review') ||
            c.status.includes('Draft')
        ).length;
        const inProgressCount = uncompletedCount - pendingReviews;

        const notifId = `deadline-${camp.id}`;
        const existing = this.notifications.find(
          (n) => n.id === notifId || (n.type === 'campaign_deadline' && n.relatedId === camp.id)
        );

        const title =
          daysLeft > 0
            ? `【活动倒计时预警】《${camp.name}》距截止仅剩 ${daysLeft} 天`
            : `【活动即将截止】《${camp.name}》今日到期`;

        const message = `《${camp.name}》Campaign 截止日期为 ${camp.endDate}。当前仍有 ${uncompletedCount} 个达人任务未完成（其中 ${pendingReviews} 个待审核处理，${inProgressCount} 个处于达人制作中），请双方（广汽国际 & 省广代理商）加紧推进！`;

        if (existing) {
          existing.title = title;
          existing.message = message;
        } else {
          this.notifications.unshift({
            id: notifId,
            type: 'campaign_deadline',
            title,
            message,
            recipientRole: 'All', // 提醒双方
            relatedId: camp.id,
            relatedType: 'campaign',
            targetPage: 'campaigns',
            targetParams: { id: camp.id },
            createdAt: new Date().toISOString(),
            read: false,
            dismissed: false,
            highlight: true,
          });
        }
      }
    });
  }

  /**
   * 检查视频发布链接上传（1天内催办省广）以及发布满3天投放效果数据补充（催办省广）
   * 规则：所有发布链接与投后效果数据均为省广团队负责补充，系统定点提醒省广
   */
  public checkPublishAndDataReminders() {
    this.contents.forEach((c) => {
      // 1. 待省广上传发布链接 (视频终审通过后1天内)
      if (
        c.status === 'Pending Publish Link' ||
        (c.videoApprovedAt && !c.performanceData?.publishUrl && !c.linkUploadedAt)
      ) {
        const notifId = `reminder-publink-${c.id}`;
        const existing = this.notifications.find((n) => n.id === notifId);
        const deadlineStr = c.linkUploadDeadline
          ? new Date(c.linkUploadDeadline).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
          : '1天内';

        const title = `【待上传发布链接】《${c.title}》视频终审已通过`;
        const message = `广汽国际已终审通过视频，请省广团队于 1 天内（${deadlineStr} 前）督促达人上线发布并录入正式海外视频发布链接。`;

        if (existing) {
          existing.title = title;
          existing.message = message;
        } else {
          this.notifications.unshift({
            id: notifId,
            type: 'reminder_publish',
            title,
            message,
            recipientRole: 'Agency', // 提醒省广
            relatedId: c.id,
            relatedType: 'video',
            targetPage: 'video-review',
            targetParams: { id: c.id },
            createdAt: new Date().toISOString(),
            read: false,
            dismissed: false,
            highlight: true,
          });
        }
      }

      // 2. 待省广补充详细数据 (发布上线满3天后)
      if (
        c.status === 'Pending Data Entry' ||
        (c.linkUploadedAt && (!c.performanceData?.views || c.performanceData.views === 0))
      ) {
        const notifId = `reminder-dataentry-${c.id}`;
        const existing = this.notifications.find((n) => n.id === notifId);
        const title = `【待补充投放数据】《${c.title}》上线已满 3 天`;
        const message = `视频已在海外平台公开发布满 3 天，请省广团队及时补充录入详细海外效果数据（播放量、3秒完播率、点赞/评论/收藏/转发量及综合互动率）。`;

        if (existing) {
          existing.title = title;
          existing.message = message;
        } else {
          this.notifications.unshift({
            id: notifId,
            type: 'reminder_data',
            title,
            message,
            recipientRole: 'Agency', // 提醒省广
            relatedId: c.id,
            relatedType: 'content',
            targetPage: 'contents',
            targetParams: { id: c.id },
            createdAt: new Date().toISOString(),
            read: false,
            dismissed: false,
            highlight: true,
          });
        }
      }
    });
  }

  // --- KOL Selection Batch Methods (省广提报 & 广汽国际审核/反馈通道) ---
  public getKolSelectionBatches(): KolSelectionBatch[] {
    return [...this.kolSelectionBatches];
  }

  public getKolSelectionBatchById(id: string): KolSelectionBatch | undefined {
    return this.kolSelectionBatches.find((b) => b.id === id);
  }

  public getKolSelectionBatchesByCampaign(campaignId: string): KolSelectionBatch[] {
    return this.kolSelectionBatches.filter((b) => b.campaignId === campaignId);
  }

  public submitKolSelectionBatch(data: {
    campaignId: string;
    title: string;
    candidateCount?: number;
    agencyFileName: string;
    agencyFileSize?: string;
    agencyFileUrl?: string;
    agencySheetUrl?: string;
    agencyNotes?: string;
    agencySubmittedBy?: string;
  }): KolSelectionBatch {
    const campaignBatches = this.kolSelectionBatches.filter((b) => b.campaignId === data.campaignId);
    const nextBatchNum = campaignBatches.length + 1;

    const newBatch: KolSelectionBatch = {
      id: `ksb-${Date.now()}`,
      campaignId: data.campaignId,
      batchNumber: nextBatchNum,
      title: data.title || `达人初选提名表 (第${nextBatchNum}批)`,
      candidateCount: data.candidateCount || 0,
      agencyFileName: data.agencyFileName || '达人初选清单.xlsx',
      agencyFileSize: data.agencyFileSize || '2.0 MB',
      agencyFileUrl: data.agencyFileUrl || 'https://example.com/files/kol_selection.xlsx',
      agencySheetUrl: data.agencySheetUrl || '',
      agencyNotes: data.agencyNotes || '',
      agencySubmittedAt: new Date().toISOString(),
      agencySubmittedBy: data.agencySubmittedBy || '省广集团 GIMC 海外媒介组',
      status: 'Pending GAC Review',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.kolSelectionBatches.unshift(newBatch);
    this.saveToStorage();

    const campName = this.getCampaignById(data.campaignId)?.name || 'Campaign';
    this.addNotification({
      type: 'kol_selection',
      title: '【达人初选提报待办】省广已上传初选名单',
      message: `省广已上传《${campName}》候选达人初选表格（第${nextBatchNum}批，共 ${data.candidateCount || 0} 位），请广汽国际进行定选审核并下发反馈表格。`,
      recipientRole: 'Me',
      relatedId: newBatch.id,
      relatedType: 'kol_selection',
      targetPage: 'kol-selection',
      targetParams: { campaignId: data.campaignId, batchId: newBatch.id },
      highlight: true,
    });

    fetch('/api/kol-selection/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(() => this.fetchServerData())
      .catch(() => {});

    return newBatch;
  }

  public reviewKolSelectionBatch(
    id: string,
    reviewData: {
      status: KolSelectionBatchStatus;
      gacFileName?: string;
      gacFileSize?: string;
      gacFileUrl?: string;
      gacSheetUrl?: string;
      gacNotes?: string;
      gacReviewedBy?: string;
      approvedKolCount?: number;
    }
  ): KolSelectionBatch | undefined {
    const idx = this.kolSelectionBatches.findIndex((b) => b.id === id);
    if (idx === -1) return undefined;

    const current = this.kolSelectionBatches[idx];
    const updated: KolSelectionBatch = {
      ...current,
      status: reviewData.status,
      gacFileName: reviewData.gacFileName || (reviewData.status === 'Approved' ? '广汽达人定选确认与批注表_Final.xlsx' : '广汽达人筛选调整与修改意见.xlsx'),
      gacFileSize: reviewData.gacFileSize || '2.2 MB',
      gacFileUrl: reviewData.gacFileUrl || 'https://example.com/files/gac_kol_feedback.xlsx',
      gacSheetUrl: reviewData.gacSheetUrl || '',
      gacNotes: reviewData.gacNotes || (reviewData.status === 'Approved' ? '广汽国际审核意见：同意通过定选名单。' : '广汽国际审核意见：需调整达人画像。'),
      gacReviewedAt: new Date().toISOString(),
      gacReviewedBy: reviewData.gacReviewedBy || '广汽国际 GAC 海外营销部',
      approvedKolCount: reviewData.approvedKolCount !== undefined ? reviewData.approvedKolCount : current.approvedKolCount,
      updatedAt: new Date().toISOString(),
    };

    this.kolSelectionBatches[idx] = updated;
    this.saveToStorage();

    const campName = this.getCampaignById(current.campaignId)?.name || 'Campaign';
    if (reviewData.status === 'Approved') {
      this.addNotification({
        type: 'kol_selection',
        title: '【达人定选结果已下发】广汽国际审核通过',
        message: `广汽国际已完成《${campName}》第${current.batchNumber}批达人定选审核（核准定选 ${updated.approvedKolCount || 0} 位），并已上传反馈表格，请省广推进 Brief 制定。`,
        recipientRole: 'Agency',
        relatedId: updated.id,
        relatedType: 'kol_selection',
        targetPage: 'kol-selection',
        targetParams: { campaignId: current.campaignId, batchId: updated.id },
        highlight: true,
      });
    } else {
      this.addNotification({
        type: 'kol_selection',
        title: '【达人初选需调整】广汽已下发修改意见',
        message: `广汽国际对《${campName}》第${current.batchNumber}批达人提报提出了调整要求并下发批注表格，请省广补充候选达人后重新提报。`,
        recipientRole: 'Agency',
        relatedId: updated.id,
        relatedType: 'kol_selection',
        targetPage: 'kol-selection',
        targetParams: { campaignId: current.campaignId, batchId: updated.id },
        highlight: true,
      });
    }

    fetch('/api/kol-selection/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...reviewData }),
    })
      .then(() => this.fetchServerData())
      .catch(() => {});

    return updated;
  }

  public deleteKolSelectionBatch(id: string): void {
    this.kolSelectionBatches = this.kolSelectionBatches.filter((b) => b.id !== id);
    this.saveToStorage();

    fetch(`/api/kol-selection/${id}`, {
      method: 'DELETE',
    })
      .then(() => this.fetchServerData())
      .catch(() => {});
  }

  // --- KOL Methods ---
  public getKols(): KOL[] {
    return [...this.kols];
  }

  public getKolById(id: string): KOL | undefined {
    return this.kols.find((k) => k.id === id);
  }

  public addKol(kol: Omit<KOL, 'id' | 'createdAt' | 'updatedAt'>): KOL {
    const newKol: KOL = {
      ...kol,
      tags: kol.tags || ['白名单'],
      followers: kol.followers || '10.0万',
      avatar: kol.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      id: `kol-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.kols.unshift(newKol);
    this.saveToStorage();

    fetch('/api/kols', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(kol),
    })
      .then(() => this.fetchServerData())
      .catch(() => {});

    return newKol;
  }

  public updateKol(kol: KOL) {
    const index = this.kols.findIndex((k) => k.id === kol.id);
    if (index !== -1) {
      this.kols[index] = { ...kol, updatedAt: new Date().toISOString() };
      this.saveToStorage();

      fetch(`/api/kols/${kol.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kol),
      })
        .then(() => this.fetchServerData())
        .catch(() => {});
    }
  }

  /**
   * 智能根据达人名字检索或创建达人归档
   * 若存在则关联并同步主页链接；若不存在则自动新建 KOL 档案
   */
  public findOrCreateKolByName(params: {
    name: string;
    profileUrl?: string;
    platform?: Platform;
    tags?: string[];
    category?: string;
    followers?: string;
    followersCount?: string;
  }): KOL {
    const trimmedName = params.name.trim();
    const existing = this.kols.find(
      (k) => k.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (existing) {
      let needsUpdate = false;
      const updated = { ...existing };
      if (params.profileUrl && params.profileUrl.trim() && existing.profileUrl !== params.profileUrl.trim()) {
        updated.profileUrl = params.profileUrl.trim();
        needsUpdate = true;
      }
      if (params.platform && existing.platform !== params.platform) {
        updated.platform = params.platform;
        needsUpdate = true;
      }
      if (params.followers && existing.followers !== params.followers) {
        updated.followers = params.followers;
        needsUpdate = true;
      }
      if (params.tags && params.tags.length > 0) {
        const currentTags = updated.tags || [];
        const mergedTags = Array.from(new Set([...currentTags, ...params.tags]));
        if (mergedTags.length !== currentTags.length) {
          updated.tags = mergedTags;
          needsUpdate = true;
        }
      }
      if (needsUpdate) {
        this.updateKol(updated);
      }
      return updated;
    }

    // Create new KOL
    const platform = params.platform || 'Tiktok';
    const newKol = this.addKol({
      name: trimmedName,
      platform,
      profileUrl: params.profileUrl?.trim() || `https://${platform.toLowerCase()}.com/user/${Date.now()}`,
      followers: params.followers || params.followersCount || '10.0万',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      tags: params.tags || ['中腰部', '汽车测评'],
      category: params.category || '出海达人',
    });

    return newKol;
  }

  public addKolTag(kolId: string, tag: string) {
    const kol = this.getKolById(kolId);
    if (!kol) return;
    const cleanTag = tag.trim();
    if (!cleanTag) return;
    const tags = kol.tags || [];
    if (!tags.includes(cleanTag)) {
      this.updateKol({
        ...kol,
        tags: [...tags, cleanTag],
      });
    }
  }

  public removeKolTag(kolId: string, tag: string) {
    const kol = this.getKolById(kolId);
    if (!kol) return;
    const tags = kol.tags || [];
    this.updateKol({
      ...kol,
      tags: tags.filter((t) => t !== tag),
    });
  }

  public updateKolProfileUrl(kolId: string, profileUrl: string) {
    const kol = this.getKolById(kolId);
    if (!kol) return;
    this.updateKol({
      ...kol,
      profileUrl: profileUrl.trim(),
    });
  }

  public getAllAvailableTags(): string[] {
    const defaultTags = ['白名单', '黑名单'];
    const customTags = this.kols.flatMap((k) => k.tags || []);
    return Array.from(new Set([...defaultTags, ...customTags])).filter(Boolean);
  }

  // --- Content Methods ---
  public getContents(): ContentItem[] {
    return [...this.contents];
  }

  public getContentById(id: string): ContentItem | undefined {
    return this.contents.find((c) => c.id === id);
  }

  public addContent(data: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>): ContentItem {
    const newContent: ContentItem = {
      ...data,
      id: `cnt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.contents.unshift(newContent);

    this.addTimelineEvent({
      contentId: newContent.id,
      title: '创建 Content 任务',
      description: `新建了内容任务《${newContent.title}》，并初始化为 ${newContent.stage} 阶段`,
      actor: this.currentRole === 'Me' ? 'Me' : 'Agency',
      type: 'brief',
    });

    this.saveToStorage();

    fetch('/api/contents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(() => this.fetchServerData())
      .catch(() => {});

    return newContent;
  }

  /**
   * 批量立项：接收 AI 解析或人工确认的候选任务列表并批量生成 ContentItem
   * 双方（广汽国际 Me & 省广代理商 Agency）均可发起立项
   */
  public batchAddContents(
    candidates: InitiationCandidate[],
    initiatedBy: UserRole = this.currentRole
  ): ContentItem[] {
    const createdContents: ContentItem[] = [];

    candidates.forEach((cand, idx) => {
      // 1. Ensure KOL exists
      let kol = this.getKolById(cand.kolId);
      if (!kol) {
        kol = this.findOrCreateKolByName({
          name: cand.kolName,
          platform: cand.platform,
          followers: cand.followers,
          profileUrl: cand.socialMediaUrl || '',
          tags: cand.category === '直发' ? ['直发达人', '批量立项'] : ['批量立项', '初筛入库'],
          category: cand.category === '二创' ? '二创达人' : '出海创作者',
        });
      }

      // 2. Stage & Status determination
      const isDirect = cand.category === '直发';
      const stage: Stage = isDirect ? 'Video' : 'Brief';
      const status: Status = isDirect ? 'Waiting for KOL Video' : 'Brief Draft';
      const currentOwner: CurrentOwner = isDirect ? 'KOL' : 'Agency';

      const newContent: ContentItem = {
        id: `cnt-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        campaignId: cand.campaignId,
        kolId: kol.id,
        title: cand.title,
        topic: cand.topic || '海外品牌实测与传播',
        platform: cand.platform,
        category: cand.category,
        stage,
        status,
        currentOwner,
        owner: initiatedBy === 'Me' ? '广汽国际 (Me)' : '省广代理商 (Agency)',
        deadline: cand.deadline,
        briefText: cand.creativeDirection,
        briefUrl: cand.socialMediaUrl || '',
        briefData: {
          category: cand.category,
          creativeDirection: cand.creativeDirection,
          followersCount: cand.followers,
          region: cand.region,
          tier: cand.tier,
          socialMediaUrl: cand.socialMediaUrl,
          resourceType: cand.resourceType,
          videoOrLive: cand.videoOrLive,
          feedback: cand.feedback,
          audiencePersona: cand.audiencePersona,
          canTeaserVideo: cand.canTeaserVideo,
          canTestimonial: cand.canTestimonial,
          portraitAuthDuration: cand.portraitAuthDuration,
          canSecondaryCreation: cand.canSecondaryCreation,
          canProvideRawFootage: cand.canProvideRawFootage,
          canPinLinkOrMention: cand.canPinLinkOrMention,
          canProvideAdCode: cand.canProvideAdCode,
          remarks: cand.notes,
          avgViews: cand.avgViews,
          collaborationCost: cand.collaborationCost,
          submittedBy: initiatedBy === 'Me' ? '广汽国际 GAC' : '省广集团 GIMC',
          submittedAt: new Date().toISOString(),
        },
        notes: `由【${initiatedBy === 'Me' ? '广汽国际' : '省广代理商'}】通过 AI 表格识别智能立项生成`,
        initiatedBy,
        initiatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.contents.unshift(newContent);
      createdContents.push(newContent);

      this.addTimelineEvent({
        contentId: newContent.id,
        title: `达人立项成功 (${cand.category})`,
        description: `【${initiatedBy === 'Me' ? '广汽国际' : '省广代理商'}】完成该任务立项，合作类型为【${cand.category}】${
          isDirect ? '，已自动跳过分镜脚本环节，直通视频成片审核' : '，进入 Brief 阶段待完善与签署'
        }`,
        actor: initiatedBy === 'Me' ? 'Me' : 'Agency',
        type: 'brief',
      });
    });

    this.saveToStorage();

    // Notify the other party
    const recipientRole: UserRole = initiatedBy === 'Me' ? 'Agency' : 'Me';
    const initiatorName = initiatedBy === 'Me' ? '广汽国际 (Me)' : '省广代理商 (Agency)';
    this.addNotification({
      type: 'kol_selection',
      title: `【达人批量立项通知】已成功立项 ${createdContents.length} 条任务`,
      message: `${initiatorName} 已完成 ${createdContents.length} 条海外达人内容立项（包含原创、二创与直发），请在“达人立项”或“Brief 审核”中心查看跟进。`,
      recipientRole,
      targetPage: 'brief-review',
      highlight: true,
    });

    // Sync to server
    createdContents.forEach((c) => {
      fetch('/api/contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c),
      }).catch(() => {});
    });

    return createdContents;
  }


  public updateContent(content: ContentItem) {
    const index = this.contents.findIndex((c) => c.id === content.id);
    if (index !== -1) {
      this.contents[index] = { ...content, updatedAt: new Date().toISOString() };
      this.saveToStorage();

      fetch(`/api/contents/${content.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      })
        .then(() => this.fetchServerData())
        .catch(() => {});
    }
  }

  /**
   * 阶段审核流转专用方法：完成当前阶段审核后推进到下一阶段
   */
  public advanceContentStage(
    contentId: string,
    targetStage: Stage,
    newStatus: Status,
    notes?: string,
    actor: 'Me' | 'Agency' = 'Me'
  ) {
    const content = this.getContentById(contentId);
    if (!content) return;

    let currentOwner: CurrentOwner = 'Me';
    if (targetStage === 'Brief') {
      currentOwner = 'Agency';
    } else if (targetStage === 'Script') {
      currentOwner = 'KOL';
    } else if (targetStage === 'Video') {
      currentOwner = 'KOL';
    } else if (targetStage === 'Completed') {
      currentOwner = 'None';
    }

    const updated: ContentItem = {
      ...content,
      stage: targetStage,
      status: newStatus,
      currentOwner: currentOwner,
      notes: notes !== undefined ? notes : content.notes,
      updatedAt: new Date().toISOString(),
    };

    this.updateContent(updated);

    this.addTimelineEvent({
      contentId,
      title: `审核流转至【${STAGE_LABELS[targetStage]}】`,
      description: `阶段从 ${STAGE_LABELS[content.stage]} 审核通过并流转至 ${STAGE_LABELS[targetStage]}（状态：${STATUS_LABELS[newStatus]}）${notes ? `。审核批注：${notes}` : ''}`,
      actor: actor,
      type: 'approved',
    });

    const recipient: 'Me' | 'Agency' | 'All' = currentOwner === 'Agency' ? 'Agency' : currentOwner === 'Me' ? 'Me' : 'All';
    this.addNotification({
      type: 'stage_handover',
      title: `【阶段流转】《${content.title}》进入${STAGE_LABELS[targetStage]}阶段`,
      message: `内容任务已由${actor === 'Me' ? '广汽国际' : '省广'}流转至【${STAGE_LABELS[targetStage]}】（${STATUS_LABELS[newStatus]}），请负责人跟进处理。`,
      recipientRole: recipient,
      relatedId: contentId,
      relatedType: targetStage === 'Brief' ? 'brief' : targetStage === 'Script' ? 'script' : targetStage === 'Video' ? 'video' : 'content',
      targetPage: targetStage === 'Brief' ? 'brief-review' : targetStage === 'Script' ? 'script-review' : targetStage === 'Video' ? 'video-review' : 'contents',
      targetParams: { id: contentId },
    });
  }

  // --- Version & Review Queries ---
  public getScriptVersions(contentId: string): ScriptVersion[] {
    return this.scriptVersions
      .filter((sv) => sv.contentId === contentId)
      .sort((a, b) => a.versionNumber - b.versionNumber);
  }

  public getVideoVersions(contentId: string): VideoVersion[] {
    return this.videoVersions
      .filter((vv) => vv.contentId === contentId)
      .sort((a, b) => a.versionNumber - b.versionNumber);
  }

  public getReviews(contentId: string, assetType?: AssetType, versionId?: string): Review[] {
    return this.reviews.filter((r) => {
      if (r.contentId !== contentId) return false;
      if (assetType && r.assetType !== assetType) return false;
      if (versionId && r.versionId !== versionId) return false;
      return true;
    });
  }

  public getTimelineEvents(contentId: string): TimelineEvent[] {
    return this.timelines
      .filter((t) => t.contentId === contentId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // --- Helper Timeline Event Generator ---
  private addTimelineEvent(evt: {
    contentId: string;
    title: string;
    description: string;
    actor: 'System' | 'Me' | 'Agency' | 'KOL';
    type: TimelineEvent['type'];
  }) {
    const nowStr = new Date().toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    this.timelines.push({
      id: `tl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      contentId: evt.contentId,
      title: evt.title,
      description: evt.description,
      actor: evt.actor,
      timestamp: nowStr,
      type: evt.type,
    });
  }

  // --- BUSINESS WORKFLOW ACTIONS ---

  // 0. Submit / Upload Brief (省广提交/上传 Brief 给广汽国际审核)
  public submitBrief(
    contentId: string,
    briefData: any,
    actor: 'Agency' | 'Me' = 'Agency',
    notes?: string
  ) {
    const content = this.getContentById(contentId);
    if (!content) return;

    const updatedBriefData = {
      ...(content.briefData || {}),
      ...briefData,
      submittedBy: actor === 'Agency' ? '省广营销集团 GIMC' : '广汽国际 GAC International',
      submittedAt: new Date().toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    content.briefData = updatedBriefData;
    if (briefData.creativeDirection) {
      content.briefText = briefData.creativeDirection;
    }
    if (briefData.briefDocUrl) {
      content.briefUrl = briefData.briefDocUrl;
    }
    content.stage = 'Brief';
    content.status = 'Waiting for Brief Approval';
    content.currentOwner = 'Me'; // 移交给广汽国际审核
    content.updatedAt = new Date().toISOString();
    if (notes) {
      content.notes = notes;
    }

    this.addTimelineEvent({
      contentId,
      title: '省广上传并提报 Brief (Brief Submitted)',
      description: `省广项目组提交了达人《${content.title}》的完整 Brief 方案（含创作建议、素材包清单及投产比预估），流转至【广汽国际审核】`,
      actor,
      type: 'brief',
    });

    this.addNotification({
      type: 'stage_handover',
      title: '【Brief 待审核】省广已提报 Brief 需求单',
      message: `《${content.title}》Brief 方案已由省广提报，请广汽国际进行审核批复。`,
      recipientRole: 'Me',
      relatedId: contentId,
      relatedType: 'brief',
      targetPage: 'brief-review',
      targetParams: { id: contentId },
      highlight: true,
    });

    this.saveToStorage();

    fetch('/api/contents/' + contentId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    }).catch(() => {});
  }

  // 0.1 Approve Brief (广汽国际审核通过 Brief)
  public approveBrief(contentId: string, feedbackNotes?: string, actor: 'Me' | 'Agency' = 'Me') {
    const content = this.getContentById(contentId);
    if (!content) return;

    if (content.briefData) {
      content.briefData.approvedAt = new Date().toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      if (feedbackNotes) {
        content.briefData.reviewFeedback = feedbackNotes;
      }
    }

    const isDirectPost = content.category === '直发';
    if (isDirectPost) {
      content.stage = 'Video';
      content.status = 'Waiting for KOL Video';
      content.currentOwner = 'KOL';
    } else {
      content.stage = 'Script';
      content.status = 'Waiting for KOL Script';
      content.currentOwner = 'KOL';
    }
    content.updatedAt = new Date().toISOString();
    if (feedbackNotes) {
      content.notes = `广汽国际 Brief 审核通过批注：${feedbackNotes}`;
    }

    this.addTimelineEvent({
      contentId,
      title: '广汽国际核准 Brief (Brief Approved)',
      description: isDirectPost
        ? `广汽国际审核通过该直发 Brief 方案！免分镜脚本，阶段直接推进至【Video 视频阶段】。${feedbackNotes ? `批注：${feedbackNotes}` : ''}`
        : `广汽国际审核通过该 Brief 方案！阶段正式推进至【Script 脚本创作】（状态：Waiting for KOL Script）。${feedbackNotes ? `批注：${feedbackNotes}` : ''}`,
      actor,
      type: 'approved',
    });

    this.addNotification({
      type: 'stage_handover',
      title: isDirectPost ? '【直发 Brief 审核通过】直通视频阶段' : '【Brief 审核通过】已推进至脚本创作阶段',
      message: isDirectPost
        ? `广汽国际已审核通过《${content.title}》直发 Brief，免脚本直通视频阶段，请跟进达人排期交付。`
        : `广汽国际已审核通过《${content.title}》Brief，请省广跟进达人撰写初稿脚本。`,
      recipientRole: 'Agency',
      relatedId: contentId,
      relatedType: isDirectPost ? 'video' : 'script',
      targetPage: isDirectPost ? 'video-review' : 'script-review',
      targetParams: { id: contentId },
      highlight: true,
    });

    this.saveToStorage();

    fetch('/api/contents/' + contentId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    }).catch(() => {});
  }

  // 0.2 Request Brief Revision (广汽国际要求修改 Brief)
  public requestBriefRevision(contentId: string, feedback: string, actor: 'Me' | 'Agency' = 'Me') {
    const content = this.getContentById(contentId);
    if (!content) return;

    if (content.briefData) {
      content.briefData.reviewFeedback = feedback;
    }

    content.stage = 'Brief';
    content.status = 'Brief Draft';
    content.currentOwner = 'Agency'; // 退回给省广修改
    content.updatedAt = new Date().toISOString();
    content.notes = `广汽国际修改意见：${feedback}`;

    this.addTimelineEvent({
      contentId,
      title: 'Brief 要求修改 (Brief Revision Requested)',
      description: `广汽国际提出 Brief 修改意见，退回省广重新调整完善。意见：${feedback}`,
      actor,
      type: 'revision_req',
    });

    this.addNotification({
      type: 'stage_handover',
      title: '【Brief 需修改】广汽提出调整意见',
      message: `广汽国际对《${content.title}》Brief 提出了修改要求：${feedback || '请调整后重新提报'}。`,
      recipientRole: 'Agency',
      relatedId: contentId,
      relatedType: 'brief',
      targetPage: 'brief-review',
      targetParams: { id: contentId },
      highlight: true,
    });

    this.saveToStorage();

    fetch('/api/contents/' + contentId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    }).catch(() => {});
  }

  // 0.3 Update Brief Data
  public updateBriefData(contentId: string, briefData: any) {
    const content = this.getContentById(contentId);
    if (!content) return;

    content.briefData = {
      ...(content.briefData || {}),
      ...briefData,
    };
    if (briefData.creativeDirection) {
      content.briefText = briefData.creativeDirection;
    }
    if (briefData.briefDocUrl) {
      content.briefUrl = briefData.briefDocUrl;
    }
    content.updatedAt = new Date().toISOString();
    this.saveToStorage();

    fetch('/api/contents/' + contentId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    }).catch(() => {});
  }

  // 1. Agency Adds Review
  public addAgencyReview(contentId: string, assetType: AssetType, versionId: string, reviewContent: string) {
    const content = this.getContentById(contentId);
    if (!content) return;

    const newRev: Review = {
      id: `rev-${Date.now()}`,
      contentId,
      assetType,
      versionId,
      reviewerType: 'Agency',
      reviewContent: `省广意见：${reviewContent}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.reviews.push(newRev);

    content.status = 'Waiting for My Review';
    content.currentOwner = 'Me';
    content.updatedAt = new Date().toISOString();

    this.addTimelineEvent({
      contentId,
      title: `省广完成 ${assetType === 'Script' ? '脚本' : '视频'} 审核`,
      description: `省广录入了审核意见，移交“我的审核” (Waiting for My Review)`,
      actor: 'Agency',
      type: 'agency_rev',
    });

    this.addNotification({
      type: 'stage_handover',
      title: assetType === 'Script' ? '【脚本待广汽终审】省广已完成初审' : '【视频待广汽终审】省广已完成初审',
      message: `省广已完成《${content.title}》${assetType === 'Script' ? '脚本' : '视频'}初审并录入意见，已移交给广汽国际进行终审。`,
      recipientRole: 'Me',
      relatedId: contentId,
      relatedType: assetType === 'Script' ? 'script' : 'video',
      targetPage: assetType === 'Script' ? 'script-review' : 'video-review',
      targetParams: { id: contentId },
      highlight: true,
    });

    this.saveToStorage();

    fetch('/api/agency-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, assetType, versionId, reviewContent }),
    })
      .then(() => this.fetchServerData())
      .catch(() => {});
  }

  // 2. Submit My Script Review
  public submitMyScriptReview(
    contentId: string,
    versionId: string,
    outcome: 'Approve' | 'Request Revision',
    myReview: string,
    finalFeedback?: string
  ) {
    const content = this.getContentById(contentId);
    if (!content) return;

    const scriptVer = this.scriptVersions.find((v) => v.id === versionId);

    if (myReview) {
      this.reviews.push({
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

      this.addTimelineEvent({
        contentId,
        title: '脚本审核通过 (Script Approved)',
        description: `最终确认通过脚本 V${scriptVer?.versionNumber || ''}！阶段流转至视频制作，等待达人交付视频`,
        actor: 'Me',
        type: 'approved',
      });

      this.addNotification({
        type: 'stage_handover',
        title: '【脚本终审已通过】已推进至视频制作',
        message: `广汽国际已核准定稿《${content.title}》脚本，任务进入视频拍摄与剪辑阶段，请省广跟进达人交付视频。`,
        recipientRole: 'Agency',
        relatedId: contentId,
        relatedType: 'video',
        targetPage: 'video-review',
        targetParams: { id: contentId },
        highlight: true,
      });
    } else {
      if (scriptVer) scriptVer.status = 'Revision Requested';
      content.status = 'Waiting for KOL Revision';
      content.currentOwner = 'KOL';

      if (finalFeedback) {
        this.reviews.push({
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

      this.addTimelineEvent({
        contentId,
        title: '脚本要求修改 (Request Revision)',
        description: `要求达人对 Script V${scriptVer?.versionNumber || ''} 进行修改，反馈已推送到达人端`,
        actor: 'Me',
        type: 'revision_req',
      });

      this.addNotification({
        type: 'stage_handover',
        title: '【脚本终审需修改】广汽提出终审意见',
        message: `广汽国际对《${content.title}》脚本提出了修改要求：${finalFeedback || '请调整后重新提报'}，请省广协助达人调整。`,
        recipientRole: 'Agency',
        relatedId: contentId,
        relatedType: 'script',
        targetPage: 'script-review',
        targetParams: { id: contentId },
        highlight: true,
      });
    }

    content.updatedAt = new Date().toISOString();
    this.saveToStorage();

    fetch('/api/my-script-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, versionId, outcome, myReview, finalFeedback }),
    })
      .then(() => this.fetchServerData())
      .catch(() => {});
  }

  // 3. Submit My Video Review
  public submitMyVideoReview(
    contentId: string,
    versionId: string,
    outcome: 'Approve' | 'Request Revision',
    myReview: string,
    finalFeedback?: string
  ) {
    const content = this.getContentById(contentId);
    if (!content) return;

    const videoVer = this.videoVersions.find((v) => v.id === versionId);

    if (myReview) {
      this.reviews.push({
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
      const now = new Date();
      const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      content.status = 'Pending Publish Link';
      content.currentOwner = 'Agency'; // 移交给省广：1天内必须上传链接
      content.videoApprovedAt = now.toISOString();
      content.linkUploadDeadline = oneDayLater.toISOString();
      content.dataReminderDate = threeDaysLater.toISOString();

      const deadlineTimeStr = `${oneDayLater.getMonth() + 1}月${oneDayLater.getDate()}日 ${oneDayLater.getHours().toString().padStart(2, '0')}:${oneDayLater.getMinutes().toString().padStart(2, '0')}`;
      const reminderTimeStr = `${threeDaysLater.getMonth() + 1}月${threeDaysLater.getDate()}日`;

      this.addTimelineEvent({
        contentId,
        title: '广汽国际同意视频发布 (Video Approved)',
        description: `广汽国际终审通过 Video V${videoVer?.versionNumber || ''}！系统履约流程：1. 提醒省广于 1 天内（截至 ${deadlineTimeStr}）上传发布链接；2. 系统将在 3 天后（${reminderTimeStr}）提醒省广团队补充录入播放量与互动表现数据。`,
        actor: 'Me',
        type: 'approved',
      });

      this.addNotification({
        type: 'stage_handover',
        title: '【视频终审通过】请于 1 天内上传发布链接',
        message: `广汽国际已审核通过《${content.title}》成片！请省广督促达人在 1 天内（截至 ${deadlineTimeStr}）正式发布并上传海外发布链接。`,
        recipientRole: 'Agency',
        relatedId: contentId,
        relatedType: 'video',
        targetPage: 'video-review',
        targetParams: { id: contentId },
        highlight: true,
      });
    } else {
      if (videoVer) videoVer.status = 'Revision Requested';
      content.status = 'Waiting for KOL Revision';
      content.currentOwner = 'KOL';

      if (finalFeedback) {
        this.reviews.push({
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

      this.addTimelineEvent({
        contentId,
        title: '视频要求修改 (Request Revision)',
        description: `要求达人对 Video V${videoVer?.versionNumber || ''} 进行重新剪辑/修改`,
        actor: 'Me',
        type: 'revision_req',
      });

      this.addNotification({
        type: 'stage_handover',
        title: '【视频样片需调整】广汽提出终审修改意见',
        message: `广汽国际对《${content.title}》视频提出了终审修改要求：${finalFeedback || '请重新微调剪辑'}，请省广协助达人调整。`,
        recipientRole: 'Agency',
        relatedId: contentId,
        relatedType: 'video',
        targetPage: 'video-review',
        targetParams: { id: contentId },
        highlight: true,
      });
    }

    content.updatedAt = new Date().toISOString();
    this.saveToStorage();

    fetch('/api/my-video-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, versionId, outcome, myReview, finalFeedback }),
    })
      .then(() => this.fetchServerData())
      .catch(() => {});
  }

  // 4. Add New Script Version
  public addNewScriptVersion(contentId: string, title: string, scriptText: string, fileUrl?: string): ScriptVersion {
    const content = this.getContentById(contentId);
    const existingVersions = this.getScriptVersions(contentId);
    const nextVerNum = existingVersions.length > 0 ? Math.max(...existingVersions.map((v) => v.versionNumber)) + 1 : 1;

    const newVer: ScriptVersion = {
      id: `sv-${Date.now()}`,
      contentId,
      versionNumber: nextVerNum,
      title: title || `Script V${nextVerNum}`,
      scriptText,
      fileUrl,
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    };

    this.scriptVersions.push(newVer);

    if (content) {
      content.stage = 'Script';
      content.status = 'Waiting for Agency Review';
      content.currentOwner = 'Agency';
      content.updatedAt = new Date().toISOString();

      this.addTimelineEvent({
        contentId,
        title: `提交 Script V${nextVerNum}`,
        description: `达人提交了新版本脚本 Script V${nextVerNum}，进入省广初审流程`,
        actor: 'KOL',
        type: 'script_sub',
      });

      this.addNotification({
        type: 'stage_handover',
        title: '【脚本初稿已提交】等待省广初审',
        message: `《${content.title}》已提交 Script V${nextVerNum}，请省广进行初审与 AI Brief 校验。`,
        recipientRole: 'Agency',
        relatedId: contentId,
        relatedType: 'script',
        targetPage: 'script-review',
        targetParams: { id: contentId },
        highlight: true,
      });
    }

    this.saveToStorage();

    fetch('/api/script-versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, title, scriptText, fileUrl }),
    })
      .then(() => this.fetchServerData())
      .catch(() => {});

    return newVer;
  }

  // 5. Add New Video Version
  public addNewVideoVersion(
    contentId: string,
    videoUrl: string,
    fileUrl?: string,
    coverUrl?: string,
    coverFileName?: string
  ): VideoVersion {
    const content = this.getContentById(contentId);
    const existingVersions = this.getVideoVersions(contentId);
    const nextVerNum = existingVersions.length > 0 ? Math.max(...existingVersions.map((v) => v.versionNumber)) + 1 : 1;

    const newVer: VideoVersion = {
      id: `vv-${Date.now()}`,
      contentId,
      versionNumber: nextVerNum,
      videoUrl,
      fileUrl,
      coverUrl,
      coverFileName,
      coverSubmittedAt: coverUrl ? new Date().toISOString() : undefined,
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    };

    this.videoVersions.push(newVer);

    if (content) {
      content.stage = 'Video';
      content.status = 'Waiting for Agency Review';
      content.currentOwner = 'Agency';
      if (coverUrl) {
        content.coverUrl = coverUrl;
      }
      content.updatedAt = new Date().toISOString();

      this.addTimelineEvent({
        contentId,
        title: `提交 Video V${nextVerNum}${coverUrl ? ' (含封面)' : ''}`,
        description: `达人提交了新版视频 Video V${nextVerNum}${coverUrl ? '及独立定制封面图' : ''}，进入省广初审流程`,
        actor: 'KOL',
        type: 'video_sub',
      });

      this.addNotification({
        type: 'stage_handover',
        title: '【视频样片已提交】等待省广初审',
        message: `《${content.title}》已提交 Video V${nextVerNum}${coverUrl ? '（附专属封面）' : ''}，请省广进行初审与多语种字幕校验。`,
        recipientRole: 'Agency',
        relatedId: contentId,
        relatedType: 'video',
        targetPage: 'video-review',
        targetParams: { id: contentId },
        highlight: true,
      });
    }

    this.saveToStorage();

    fetch('/api/video-versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, videoUrl, fileUrl, coverUrl, coverFileName }),
    })
      .then(() => this.fetchServerData())
      .catch(() => {});

    return newVer;
  }

  // Update or submit video cover for a video version
  public updateVideoCover(
    contentId: string,
    versionId: string,
    coverUrl: string,
    coverFileName?: string,
    coverRemarks?: string
  ): boolean {
    const version = this.videoVersions.find((v) => v.id === versionId || (v.contentId === contentId && !versionId));
    const content = this.getContentById(contentId);

    if (version) {
      version.coverUrl = coverUrl;
      version.coverFileName = coverFileName || version.coverFileName || 'video_cover.jpg';
      version.coverSubmittedAt = new Date().toISOString();
      if (coverRemarks !== undefined) {
        version.coverRemarks = coverRemarks;
      }
    }

    if (content) {
      content.coverUrl = coverUrl;
      content.updatedAt = new Date().toISOString();

      this.addTimelineEvent({
        contentId,
        title: coverUrl ? '提交/更新视频封面图' : '移除视频封面图',
        description: coverUrl
          ? `已成功上传并更新视频定制封面图（可选项）${coverFileName ? `：${coverFileName}` : ''}`
          : '已移除定制封面图，恢复默认截取视频首帧',
        actor: this.currentRole === 'Me' ? 'Me' : 'Agency',
        type: 'video_sub',
      });
    }

    this.saveToStorage();
    return true;
  }

  public addScriptVersion(contentId: string, title: string, scriptText: string, fileUrl?: string): ScriptVersion {
    return this.addNewScriptVersion(contentId, title, scriptText, fileUrl);
  }

  public addVideoVersion(contentId: string, videoUrl: string, fileUrl?: string, coverUrl?: string, coverFileName?: string): VideoVersion {
    return this.addNewVideoVersion(contentId, videoUrl, fileUrl, coverUrl, coverFileName);
  }

  // 6. Mark Content Completed
  public markContentCompleted(contentId: string) {
    const content = this.getContentById(contentId);
    if (!content) return;

    content.stage = 'Completed';
    content.status = 'Completed';
    content.currentOwner = 'None';
    content.updatedAt = new Date().toISOString();

    this.addTimelineEvent({
      contentId,
      title: '任务标记为已完成',
      description: '内容已成功审核通过并归档',
      actor: 'Me',
      type: 'completed',
    });

    this.addNotification({
      type: 'stage_handover',
      title: '【任务归档完成】《' + content.title + '》',
      message: `内容《${content.title}》已顺利完成全部制作、发布及数据沉淀，任务已正式归档。`,
      recipientRole: 'All',
      relatedId: contentId,
      relatedType: 'content',
      targetPage: 'contents',
    });

    this.saveToStorage();

    fetch('/api/complete-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId }),
    })
      .then(() => this.fetchServerData())
      .catch(() => {});
  }

  // 7. Update Brief / Info
  public updateContentBrief(contentId: string, briefText: string, briefUrl: string, notes: string) {
    const content = this.getContentById(contentId);
    if (!content) return;

    content.briefText = briefText;
    content.briefUrl = briefUrl;
    content.notes = notes;
    content.updatedAt = new Date().toISOString();

    this.saveToStorage();

    fetch('/api/update-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, briefText, briefUrl, notes }),
    })
      .then(() => this.fetchServerData())
      .catch(() => {});
  }

  // 8. Update Publish URL (省广1天内上传链接)
  public updatePublishUrl(contentId: string, publishUrl: string, publishedAt?: string) {
    const content = this.getContentById(contentId);
    if (!content) return;

    const now = new Date();
    content.linkUploadedAt = now.toISOString();
    content.status = 'Pending Data Entry';
    content.currentOwner = 'Agency'; // 移交给省广：3天后提醒省广补充数据

    if (!content.performanceData) {
      content.performanceData = {};
    }
    content.performanceData.publishUrl = publishUrl;
    content.performanceData.publishedAt = publishedAt || now.toISOString().split('T')[0];

    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    content.dataReminderDate = threeDaysLater.toISOString();
    content.updatedAt = now.toISOString();

    const remStr = `${threeDaysLater.getMonth() + 1}月${threeDaysLater.getDate()}日`;

    this.addTimelineEvent({
      contentId,
      title: '省广已上传视频上线链接',
      description: `省广按时提交了视频线上发布链接：${publishUrl}。系统已设定履约机制：将于上线发布 3 天后（${remStr}）在首页弹窗提醒省广团队补充录入播放量、互动量（点赞/评论/收藏/转发）及互动率数据。`,
      actor: 'Agency',
      type: 'agency_rev',
    });

    this.addNotification({
      type: 'stage_handover',
      title: '【发布链接已上传】《' + content.title + '》',
      message: `省广已录入线上发布链接，系统将于 3 天后（${remStr}）提醒补充投放效果数据（播放、点赞、评论、互动率等）。`,
      recipientRole: 'All',
      relatedId: contentId,
      relatedType: 'content',
      targetPage: 'contents',
    });

    this.saveToStorage();

    fetch(`/api/contents/${contentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    })
      .then(() => this.fetchServerData())
      .catch(() => {});
  }

  // 9. Update Performance Data (播放量、点赞量、评论量、收藏量、转发量、互动量及互动率)
  public updatePerformanceData(contentId: string, perfData: PerformanceData) {
    const content = this.getContentById(contentId);
    if (!content) return;

    const views = perfData.views || 0;
    const likes = perfData.likes || 0;
    const comments = perfData.comments || 0;
    const favorites = perfData.favorites || 0;
    const shares = perfData.shares || 0;
    const engagements = perfData.engagements !== undefined ? perfData.engagements : likes + comments + favorites + shares;
    const engagementRate = perfData.engagementRate !== undefined 
      ? perfData.engagementRate 
      : views > 0 ? parseFloat(((engagements / views) * 100).toFixed(2)) : 0;

    const threeSecondPlayRate = perfData.threeSecondPlayRate;
    const fullPerfData: PerformanceData = {
      ...perfData,
      views,
      threeSecondPlayRate,
      likes,
      comments,
      favorites,
      shares,
      engagements,
      engagementRate,
      updatedAt: new Date().toISOString(),
    };

    content.performanceData = fullPerfData;
    content.stage = 'Completed';
    content.status = 'Completed';
    content.currentOwner = 'None';
    content.updatedAt = new Date().toISOString();

    const threeSecondDesc = threeSecondPlayRate !== undefined ? `，3秒完播率 ${threeSecondPlayRate}%` : '';

    this.addTimelineEvent({
      contentId,
      title: `${this.currentRole === 'Agency' ? '省广' : '广汽国际'}完成发布后数据录入与结算`,
      description: `已完成发布后效果数据沉淀：播放量 ${views.toLocaleString()}${threeSecondDesc}，互动量 ${engagements.toLocaleString()} (点赞${likes.toLocaleString()} + 评论${comments.toLocaleString()} + 收藏${favorites.toLocaleString()} + 转发${shares.toLocaleString()})，综合互动率 ${engagementRate}%。任务全流程履约归档完成。`,
      actor: this.currentRole,
      type: 'completed',
    });

    this.addNotification({
      type: 'stage_handover',
      title: '【效果数据已录入】任务全流程履约归档',
      message: `《${content.title}》已录入海外传播表现数据（播放量 ${views.toLocaleString()}，互动率 ${engagementRate}%），任务已顺利归档！`,
      recipientRole: 'All',
      relatedId: contentId,
      relatedType: 'content',
      targetPage: 'contents',
    });

    this.saveToStorage();

    fetch('/api/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, performanceData: fullPerfData, actor: this.currentRole }),
    })
      .then(() => this.fetchServerData())
      .catch(() => {});
  }

  // 9. Auth & User Role Methods
  public isLoggedIn(): boolean {
    return this.isLoggedInState && this.currentUser !== null;
  }

  public getCurrentRole(): UserRole {
    return this.currentRole;
  }

  public getCurrentUser(): UserAccount | null {
    return this.currentUser;
  }

  public async loginWithCredentials(username: string, password: string): Promise<UserAccount> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || '登录失败，请检查账号和密码！');
      }

      const user: UserAccount = data.user;
      this.currentUser = user;
      this.currentRole = user.role;
      this.isLoggedInState = true;

      try {
        localStorage.setItem(STORAGE_KEYS.USER_ROLE, JSON.stringify(user.role));
        localStorage.setItem(STORAGE_KEYS.USER_ACCOUNT, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, JSON.stringify(true));
      } catch (e) {
        console.error(e);
      }

      this.notifyListeners();
      return user;
    } catch (err: any) {
      // Fallback for offline/local simulation if fetch fails
      if (username === 'gac_admin' && password === 'gac2026') {
        const user = DEFAULT_ACCOUNTS['Me'];
        this.currentUser = user;
        this.currentRole = 'Me';
        this.isLoggedInState = true;
        localStorage.setItem(STORAGE_KEYS.USER_ROLE, JSON.stringify('Me'));
        localStorage.setItem(STORAGE_KEYS.USER_ACCOUNT, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, JSON.stringify(true));
        this.notifyListeners();
        return user;
      } else if (username === 'agency_user' && password === 'agency2026') {
        const user = DEFAULT_ACCOUNTS['Agency'];
        this.currentUser = user;
        this.currentRole = 'Agency';
        this.isLoggedInState = true;
        localStorage.setItem(STORAGE_KEYS.USER_ROLE, JSON.stringify('Agency'));
        localStorage.setItem(STORAGE_KEYS.USER_ACCOUNT, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, JSON.stringify(true));
        this.notifyListeners();
        return user;
      }
      throw err;
    }
  }

  public setCurrentRole(role: UserRole) {
    this.currentRole = role;
    this.currentUser = DEFAULT_ACCOUNTS[role];
    this.isLoggedInState = true;
    try {
      localStorage.setItem(STORAGE_KEYS.USER_ROLE, JSON.stringify(role));
      localStorage.setItem(STORAGE_KEYS.USER_ACCOUNT, JSON.stringify(this.currentUser));
      localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, JSON.stringify(true));
    } catch (e) {
      console.error(e);
    }
    this.notifyListeners();
  }

  public logout() {
    this.currentUser = null;
    this.isLoggedInState = false;
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_ACCOUNT);
      localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, JSON.stringify(false));
    } catch (e) {
      console.error(e);
    }
    this.notifyListeners();
  }

  // 10. AI Multilingual Subtitle & Brief Audit API Call
  public async auditBriefWithAi(params: {
    contentTitle: string;
    campaignName?: string;
    campaignBrief?: string;
    contentBrief?: string;
    subtitlesText: string;
    language?: string;
    assetType?: AssetType;
  }) {
    const res = await fetch('/api/ai/audit-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error(`AI Audit API failed with status ${res.status}`);
    }
    return res.json();
  }

  // 11. AI Script Document Formatting API Call
  public async parseScriptDocWithAi(params: {
    docRawText?: string;
    fileName?: string;
    docUrl?: string;
  }) {
    const res = await fetch('/api/ai/parse-script-doc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error(`AI Parse Script API failed with status ${res.status}`);
    }
    return res.json();
  }

  // 11. Reset Data to initial mock
  public resetData() {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    this.resetToDemoData();
  }
}

export const dataService = new DataService();
