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
} from '../types';
import {
  INITIAL_CAMPAIGNS,
  INITIAL_KOLS,
  INITIAL_CONTENTS,
  INITIAL_SCRIPT_VERSIONS,
  INITIAL_VIDEO_VERSIONS,
  INITIAL_REVIEWS,
  INITIAL_TIMELINES,
} from '../data/mockData';

const STORAGE_KEYS = {
  CAMPAIGNS: 'kol_hub_campaigns_v1',
  KOLS: 'kol_hub_kols_v1',
  CONTENTS: 'kol_hub_contents_v1',
  SCRIPT_VERSIONS: 'kol_hub_scripts_v1',
  VIDEO_VERSIONS: 'kol_hub_videos_v1',
  REVIEWS: 'kol_hub_reviews_v1',
  TIMELINES: 'kol_hub_timelines_v1',
  USER_ROLE: 'kol_hub_user_role_v1',
  USER_ACCOUNT: 'kol_hub_user_account_v1',
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
  private currentRole: UserRole;
  private currentUser: UserAccount | null;
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
    this.currentRole = this.loadFromStorage(STORAGE_KEYS.USER_ROLE, 'Me');
    this.currentUser = this.loadFromStorage(
      STORAGE_KEYS.USER_ACCOUNT,
      DEFAULT_ACCOUNTS[this.currentRole]
    );

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
      body: JSON.stringify(camp),
    })
      .then(() => this.fetchServerData())
      .catch(() => {});

    return newCamp;
  }

  public updateCampaign(camp: Campaign) {
    const index = this.campaigns.findIndex((c) => c.id === camp.id);
    if (index !== -1) {
      this.campaigns[index] = { ...camp, updatedAt: new Date().toISOString() };
      this.saveToStorage();

      fetch(`/api/campaigns/${camp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(camp),
      })
        .then(() => this.fetchServerData())
        .catch(() => {});
    }
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
      id: `cnt-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.contents.unshift(newContent);

    this.addTimelineEvent({
      contentId: newContent.id,
      title: '创建 Content 任务',
      description: `新建了内容任务《${newContent.title}》，并初始化为 ${newContent.stage} 阶段`,
      actor: 'Me',
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
        description: `广汽国际终审通过 Video V${videoVer?.versionNumber || ''}！系统触发规则：1. 提醒省广于 1 天内（截至 ${deadlineTimeStr}）上传发布链接；2. 系统将在 3 天后（${reminderTimeStr}）提醒广汽国际手动补充表现数据。`,
        actor: 'Me',
        type: 'approved',
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
  public addNewVideoVersion(contentId: string, videoUrl: string, fileUrl?: string): VideoVersion {
    const content = this.getContentById(contentId);
    const existingVersions = this.getVideoVersions(contentId);
    const nextVerNum = existingVersions.length > 0 ? Math.max(...existingVersions.map((v) => v.versionNumber)) + 1 : 1;

    const newVer: VideoVersion = {
      id: `vv-${Date.now()}`,
      contentId,
      versionNumber: nextVerNum,
      videoUrl,
      fileUrl,
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    };

    this.videoVersions.push(newVer);

    if (content) {
      content.stage = 'Video';
      content.status = 'Waiting for Agency Review';
      content.currentOwner = 'Agency';
      content.updatedAt = new Date().toISOString();

      this.addTimelineEvent({
        contentId,
        title: `提交 Video V${nextVerNum}`,
        description: `达人提交了新版视频 Video V${nextVerNum}，进入省广初审流程`,
        actor: 'KOL',
        type: 'video_sub',
      });
    }

    this.saveToStorage();

    fetch('/api/video-versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, videoUrl, fileUrl }),
    })
      .then(() => this.fetchServerData())
      .catch(() => {});

    return newVer;
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

    content.linkUploadedAt = new Date().toISOString();
    content.status = 'Pending Data Entry';
    content.currentOwner = 'Me'; // 移交给广汽国际，等待3天后补充数据

    if (!content.performanceData) {
      content.performanceData = {};
    }
    content.performanceData.publishUrl = publishUrl;
    content.performanceData.publishedAt = publishedAt || new Date().toISOString().split('T')[0];

    content.updatedAt = new Date().toISOString();

    const dataRemDate = content.dataReminderDate
      ? new Date(content.dataReminderDate)
      : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const remStr = `${dataRemDate.getMonth() + 1}月${dataRemDate.getDate()}日`;

    this.addTimelineEvent({
      contentId,
      title: '省广已上传视频上线链接',
      description: `省广按时提交了视频线上发布链接：${publishUrl}。已移交广汽国际，系统将于 3 天后（${remStr}）提醒广汽国际团队手动补充数据。`,
      actor: 'Agency',
      type: 'agency_rev',
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

  // 9. Update Performance Data
  public updatePerformanceData(contentId: string, perfData: PerformanceData) {
    const content = this.getContentById(contentId);
    if (!content) return;

    content.performanceData = perfData;
    content.stage = 'Completed';
    content.status = 'Completed';
    content.currentOwner = 'None';
    content.updatedAt = new Date().toISOString();

    this.addTimelineEvent({
      contentId,
      title: '广汽国际完成发布后数据补充',
      description: '手动填写/更新了发布后的播放量、点赞、评论与分享数据，任务全流程归档完成。',
      actor: this.currentRole,
      type: 'completed',
    });

    this.saveToStorage();

    fetch('/api/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, performanceData: perfData, actor: this.currentRole }),
    })
      .then(() => this.fetchServerData())
      .catch(() => {});
  }

  // 9. Auth & User Role Methods
  public getCurrentRole(): UserRole {
    return this.currentRole;
  }

  public getCurrentUser(): UserAccount | null {
    if (!this.currentUser) {
      this.currentUser = DEFAULT_ACCOUNTS[this.currentRole];
    }
    return this.currentUser;
  }

  public async loginWithCredentials(username: string, password: string): Promise<UserAccount> {
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

    try {
      localStorage.setItem(STORAGE_KEYS.USER_ROLE, JSON.stringify(user.role));
      localStorage.setItem(STORAGE_KEYS.USER_ACCOUNT, JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }

    this.notifyListeners();
    return user;
  }

  public setCurrentRole(role: UserRole) {
    this.currentRole = role;
    this.currentUser = DEFAULT_ACCOUNTS[role];
    try {
      localStorage.setItem(STORAGE_KEYS.USER_ROLE, JSON.stringify(role));
      localStorage.setItem(STORAGE_KEYS.USER_ACCOUNT, JSON.stringify(this.currentUser));
    } catch (e) {
      console.error(e);
    }
    this.notifyListeners();
  }

  public logout() {
    this.currentUser = null;
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_ACCOUNT);
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

  // 11. Reset Data to initial mock
  public resetData() {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    this.resetToDemoData();
  }
}

export const dataService = new DataService();
