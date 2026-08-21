import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { KOL, ContentItem, KolPastWork, KolRosterStatus, KolTier } from '../types';
import { computeMetricsFromPastWorks, formatMetricNumber } from '../utils/kolMetrics';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { OwnerBadge } from '../components/OwnerBadge';
import { ContentInlineProgressBar } from '../components/ContentProgressBar';
import { isOverdue } from '../utils/dateUtils';
import { NewKolModal } from '../components/NewKolModal';
import {
  ArrowLeft,
  ExternalLink,
  Tag,
  Plus,
  Edit2,
  Check,
  X,
  FileText,
  Link as LinkIcon,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Eye,
  ThumbsUp,
  Crown,
  Layers,
  TrendingUp,
  BarChart3,
  Video,
  Star,
  Sparkles,
  Award,
  Globe,
  Mail,
  Calendar,
  MessageSquare,
  Trash2,
  AlertCircle,
} from 'lucide-react';

interface KolDetailPageProps {
  kolId: string;
  onNavigate: (page: string, params?: { id?: string }) => void;
  onOpenNewContent: () => void;
}

export const KolDetailPage: React.FC<KolDetailPageProps> = ({
  kolId,
  onNavigate,
  onOpenNewContent,
}) => {
  const [kol, setKol] = useState<KOL | undefined>();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isTagEditing, setIsTagEditing] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [tempUrl, setTempUrl] = useState('');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Quick Add Past Work Inline Modal / Drawer
  const [isAddingWork, setIsAddingWork] = useState(false);
  const [newWorkTitle, setNewWorkTitle] = useState('');
  const [newWorkUrl, setNewWorkUrl] = useState('');
  const [newWorkPlatform, setNewWorkPlatform] = useState<any>('Youtube');
  const [newWorkDate, setNewWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [newWorkViews, setNewWorkViews] = useState('');
  const [newWorkLikes, setNewWorkLikes] = useState('');
  const [newWorkComments, setNewWorkComments] = useState('');
  const [newWorkCooperatedBrand, setNewWorkCooperatedBrand] = useState('广汽国际');
  const [newWorkCategory, setNewWorkCategory] = useState('原创');
  const [newWorkHighlights, setNewWorkHighlights] = useState('');
  const [workFormError, setWorkFormError] = useState<string | null>(null);
  const [deletingWorkId, setDeletingWorkId] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const k = dataService.getKolById(kolId);
      setKol(k);
      if (k) {
        setTempUrl(k.profileUrl || '');
        if (k.platform) setNewWorkPlatform(k.platform);
      }
      setContents(dataService.getContents().filter((c) => c.kolId === kolId));
    };
    update();
    return dataService.subscribe(update);
  }, [kolId]);

  const campaigns = dataService.getCampaigns();
  const getCampaignName = (id: string) => campaigns.find((c) => c.id === id)?.name || id;
  const allAvailableTags = dataService.getAllAvailableTags();
  const standardOutputTypes = ['原创', '二创', '直发'];

  if (!kol) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>未找到该达人档案</p>
        <button
          onClick={() => onNavigate('kols')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
        >
          返回达人列表
        </button>
      </div>
    );
  }

  const tags = kol.tags || [];
  const m = kol.historicalMetrics || {};
  const pastWorks = kol.pastWorks || [];

  const handleToggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      dataService.removeKolTag(kol.id, tag);
    } else {
      dataService.addKolTag(kol.id, tag);
    }
  };

  const handleAddCustomTag = () => {
    if (!customTagInput.trim()) return;
    dataService.addKolTag(kol.id, customTagInput.trim());
    setCustomTagInput('');
  };

  const handleSaveProfileUrl = () => {
    dataService.updateKolProfileUrl(kol.id, tempUrl.trim());
    setIsEditingUrl(false);
  };

  const handleQuickAddWork = (e: React.FormEvent) => {
    e.preventDefault();
    setWorkFormError(null);
    if (!newWorkTitle.trim() || !newWorkUrl.trim()) {
      setWorkFormError('请填写作品标题与发布链接');
      return;
    }

    dataService.addKolPastWork(kol.id, {
      title: newWorkTitle.trim(),
      url: newWorkUrl.trim(),
      platform: newWorkPlatform,
      publishDate: newWorkDate,
      views: newWorkViews.trim() || undefined,
      likes: newWorkLikes.trim() || undefined,
      comments: newWorkComments.trim() || undefined,
      cooperatedBrand: newWorkCooperatedBrand.trim() || undefined,
      category: newWorkCategory.trim() || '原创',
      highlights: newWorkHighlights.trim() || undefined,
    });

    // Reset & close inline add
    setNewWorkTitle('');
    setNewWorkUrl('');
    setNewWorkViews('');
    setNewWorkLikes('');
    setNewWorkComments('');
    setNewWorkHighlights('');
    setWorkFormError(null);
    setIsAddingWork(false);
  };

  const handleConfirmDeleteWork = (workId: string) => {
    dataService.deleteKolPastWork(kol.id, workId);
    setDeletingWorkId(null);
  };

  const getRosterBadge = (status?: KolRosterStatus, tagsList?: string[]) => {
    const finalStatus = status || (tagsList?.includes('黑名单') ? '黑名单' : '白名单');
    if (finalStatus === '白名单') {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          🟢 白名单 (优选合作)
        </span>
      );
    }
    if (finalStatus === '黑名单') {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          🔴 黑名单 (避坑预警)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200">
        <Shield className="w-3.5 h-3.5 text-slate-500" />
        ⚪ 常规考察储备
      </span>
    );
  };

  const getTierBadge = (tier?: KolTier, tagsList?: string[]) => {
    const finalTier = tier || (tagsList?.includes('头部') ? '头部' : tagsList?.includes('尾部') ? '尾部' : '腰部');
    if (finalTier === '头部') {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Crown className="w-3.5 h-3.5 text-amber-500" />
          👑 头部行业大V
        </span>
      );
    }
    if (finalTier === '腰部') {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Layers className="w-3.5 h-3.5 text-blue-500" />
          ⭐ 腰部中坚主力
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium bg-teal-50 text-teal-700 border border-teal-200">
        <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
        🌱 尾部/KOC新星
      </span>
    );
  };

  const totalViews = contents.reduce((sum, c) => sum + (c.performanceData?.views || 0), 0);
  const totalLikes = contents.reduce((sum, c) => sum + (c.performanceData?.likes || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Bar with Back Button and Quick Stats */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => onNavigate('kols')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回达人库</span>
        </button>
      </div>

      {/* Main Profile Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-slate-100 pb-5">
          <div className="flex items-start sm:items-center gap-4">
            <img
              src={kol.avatar}
              alt={kol.name}
              className="w-18 h-18 rounded-2xl object-cover border-2 border-indigo-100 shadow-xs shrink-0"
            />
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{kol.name}</h1>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-900 text-white">
                  {kol.platform}
                </span>
                {getRosterBadge(kol.rosterStatus, kol.tags)}
                {getTierBadge(kol.tier, kol.tags)}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 flex-wrap">
                <span className="font-mono font-bold text-slate-900">
                  粉丝量: {kol.followers || '10.0万'}
                </span>
                {kol.region && (
                  <>
                    <span className="text-slate-300">|</span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      {kol.region}
                    </span>
                  </>
                )}
                {kol.category && (
                  <>
                    <span className="text-slate-300">|</span>
                    <span>分类: {kol.category}</span>
                  </>
                )}
                {kol.contact && (
                  <>
                    <span className="text-slate-300">|</span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {kol.contact}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2.5 self-start lg:self-auto">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>编辑档案与往期数据</span>
            </button>

            <button
              onClick={onOpenNewContent}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>发起合作 Content 任务</span>
            </button>
          </div>
        </div>

        {/* Profile URL Bar */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <LinkIcon className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-semibold text-slate-700 shrink-0">主页跳转链接:</span>
            {isEditingUrl ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="url"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-mono"
                  autoFocus
                />
                <button
                  onClick={handleSaveProfileUrl}
                  className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shrink-0"
                >
                  保存
                </button>
                <button
                  onClick={() => setIsEditingUrl(false)}
                  className="px-2 py-1 text-slate-500 hover:bg-slate-200 rounded text-xs shrink-0"
                >
                  取消
                </button>
              </div>
            ) : kol.profileUrl ? (
              <a
                href={kol.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 underline truncate font-mono text-xs"
                title={kol.profileUrl}
              >
                {kol.profileUrl}
              </a>
            ) : (
              <span className="text-slate-400 italic">未配置主页链接</span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isEditingUrl && (
              <button
                onClick={() => {
                  setIsEditingUrl(true);
                  setTempUrl(kol.profileUrl || '');
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                {kol.profileUrl ? '修改' : '+ 添加'}
              </button>
            )}

            {kol.profileUrl && !isEditingUrl && (
              <a
                href={kol.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-indigo-600 shadow-2xs"
              >
                访问达人主页
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: HISTORICAL METRICS DASHBOARD */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>达人过往历史表现数据看板</span>
                {pastWorks.length > 0 && (
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    基于已录入的 {pastWorks.length} 篇作品数据实时聚合
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                通过下方逐条录入真实过往作品数据，系统自动计算历史均播、单篇爆款峰值与平均互动表现
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Edit2 className="w-3 h-3" />
            <span>进入档案完整编辑</span>
          </button>
        </div>

        {/* 6 Key Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-medium text-slate-500 block">历史平均播放量</span>
            <div className="text-base font-bold text-slate-900 font-mono mt-1">
              {m.avgViews ? formatMetricNumber(m.avgViews) : kol.followers}
            </div>
            <span className="text-[10px] text-slate-400">
              {pastWorks.length > 0 ? '由作品数据自动计算' : '日常作品估算'}
            </span>
          </div>

          <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
            <span className="text-[11px] font-medium text-indigo-900 block">爆款最高播放量</span>
            <div className="text-base font-bold text-indigo-600 font-mono mt-1">
              {m.highestViews ? formatMetricNumber(m.highestViews) : '—'}
            </div>
            <span className="text-[10px] text-indigo-500">历史单篇最高峰值</span>
          </div>

          <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-medium text-emerald-900 block">历史平均点赞/互动</span>
            <div className="text-base font-bold text-emerald-700 font-mono mt-1">
              {m.avgLikes ? formatMetricNumber(m.avgLikes) : m.avgEngagementRate ? `${m.avgEngagementRate}%` : '—'}
            </div>
            <span className="text-[10px] text-emerald-600">作品互动深度</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-medium text-slate-500 block">参考合作 CPM</span>
            <div className="text-base font-bold text-slate-900 font-mono mt-1">
              {m.avgCpm ? `¥${m.avgCpm}` : '¥45'}
            </div>
            <span className="text-[10px] text-slate-400">千次曝光成本</span>
          </div>

          <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-100">
            <span className="text-[11px] font-medium text-amber-900 block">合作评分星级</span>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-base font-bold text-amber-700 font-mono">
                {m.cooperationRating ? m.cooperationRating.toFixed(1) : '5.0'}
              </span>
            </div>
            <span className="text-[10px] text-amber-600">履约与配合度</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-medium text-slate-500 block">已录入过往作品</span>
            <div className="text-base font-bold text-slate-900 font-mono mt-1 flex items-center gap-1">
              <Video className="w-4 h-4 text-purple-600" />
              <span>{pastWorks.length} 篇</span>
            </div>
            <span className="text-[10px] text-slate-400">逐条数据明细</span>
          </div>
        </div>

        {/* Cooperation Notes */}
        {m.historicalCooperationNotes && (
          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 text-xs flex items-start gap-2.5">
            <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">过往合作评价与备忘说明：</span>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                {m.historicalCooperationNotes}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: PAST PUBLISHED WORKS & URLS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                达人过往作品与数据逐条明细 ({pastWorks.length} 篇)
              </h2>
              <p className="text-xs text-slate-500">
                每录入一条过往作品的真实播放量、点赞数和链接，系统将自动汇总更新上方的数据看板
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddingWork(!isAddingWork)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddingWork ? '收起录入' : '+ 录入一条过往作品与数据'}</span>
          </button>
        </div>

        {/* Inline Quick Add Past Work Form */}
        {isAddingWork && (
          <form
            onSubmit={handleQuickAddWork}
            className="p-4 bg-purple-50/40 rounded-xl border border-purple-200 space-y-3 animate-in fade-in duration-100"
          >
            <div className="flex items-center justify-between text-xs font-bold text-purple-900 border-b border-purple-100 pb-2">
              <span>录入该达人过往发布的新作品与真实数据：</span>
              <button
                type="button"
                onClick={() => {
                  setIsAddingWork(false);
                  setWorkFormError(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {workFormError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{workFormError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  作品标题 / 视频主题 *
                </label>
                <input
                  type="text"
                  placeholder="例如：巴黎街头优雅自驾 Vlog、3000公里续航实测"
                  value={newWorkTitle}
                  onChange={(e) => setNewWorkTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  作品发布链接 (URL) *
                </label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=... 或 TikTok 视频链接"
                  value={newWorkUrl}
                  onChange={(e) => setNewWorkUrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  发布平台
                </label>
                <select
                  value={newWorkPlatform}
                  onChange={(e) => setNewWorkPlatform(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                >
                  <option value="Youtube">Youtube</option>
                  <option value="Tiktok">Tiktok</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="其他">其他</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  产出类型
                </label>
                <select
                  value={newWorkCategory}
                  onChange={(e) => setNewWorkCategory(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                >
                  {standardOutputTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  发布日期
                </label>
                <input
                  type="date"
                  value={newWorkDate}
                  onChange={(e) => setNewWorkDate(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-indigo-700 mb-0.5">
                  播放量 (Views)
                </label>
                <input
                  type="text"
                  placeholder="如：1,280,000"
                  value={newWorkViews}
                  onChange={(e) => setNewWorkViews(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-mono font-bold text-indigo-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-emerald-700 mb-0.5">
                  点赞数 (Likes)
                </label>
                <input
                  type="text"
                  placeholder="如：52,000"
                  value={newWorkLikes}
                  onChange={(e) => setNewWorkLikes(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-mono font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  评论/互动数
                </label>
                <input
                  type="text"
                  placeholder="如：1,500"
                  value={newWorkComments}
                  onChange={(e) => setNewWorkComments(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  合作车型 / 品牌
                </label>
                <input
                  type="text"
                  placeholder="例如：广汽传祺 GS8、埃安 Hyper HT"
                  value={newWorkCooperatedBrand}
                  onChange={(e) => setNewWorkCooperatedBrand(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  作品亮点 / 爆款要点
                </label>
                <input
                  type="text"
                  placeholder="例如：以塞纳河畔为背景，突出车辆优雅线条与高级座舱氛围，女性车主占比超60%"
                  value={newWorkHighlights}
                  onChange={(e) => setNewWorkHighlights(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingWork(false)}
                className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                保存录入该作品（自动计算均值）
              </button>
            </div>
          </form>
        )}

        {/* Works List Cards */}
        {pastWorks.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2 bg-slate-50/50">
            <Video className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">暂未录入过往作品链接</p>
            <p className="text-[11px] text-slate-400">
              点击上方「+ 录入往期作品」按钮，添加达人海外发布的作品链接，方便定选评测。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pastWorks.map((work) => (
              <div
                key={work.id}
                className="p-4 bg-slate-50/70 hover:bg-white rounded-xl border border-slate-200 transition-all shadow-2xs space-y-2 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold">
                        {work.platform}
                      </span>
                      {work.category && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
                          {work.category}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {work.publishDate}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 mt-1 truncate" title={work.title}>
                      {work.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {work.url && (
                      <a
                        href={work.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-indigo-600 hover:text-indigo-800 hover:border-indigo-300 shadow-2xs"
                        title="打开此篇作品原始外链"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => setDeletingWorkId(work.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="删除该作品"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metrics Pill & Highlights */}
                <div className="flex items-center gap-3 text-[11px] text-slate-600 font-mono flex-wrap">
                  {work.views && (
                    <span className="flex items-center gap-1 text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100">
                      <Eye className="w-3 h-3 text-indigo-600" />
                      播放: <strong>{work.views}</strong>
                    </span>
                  )}
                  {work.likes && (
                    <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-100">
                      <ThumbsUp className="w-3 h-3 text-emerald-600" />
                      点赞: <strong>{work.likes}</strong>
                    </span>
                  )}
                  {work.comments && (
                    <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      <MessageSquare className="w-3 h-3 text-slate-500" />
                      评论: <strong>{work.comments}</strong>
                    </span>
                  )}
                  {work.cooperatedBrand && (
                    <span className="text-slate-500 text-[10px]">
                      车型/品牌: <strong className="text-slate-700">{work.cooperatedBrand}</strong>
                    </span>
                  )}
                </div>

                {work.highlights && (
                  <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100 leading-relaxed">
                    💡 <span className="font-semibold">亮点:</span> {work.highlights}
                  </p>
                )}

                {/* URL Direct preview */}
                {work.url && (
                  <div className="pt-1 text-[10px] text-slate-400 font-mono truncate">
                    链接: {work.url}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: UNIFIED TAGS SYSTEM */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">统一达人库标签体系</h2>
              <p className="text-xs text-slate-500">
                黑白名单分类 + 梯队定位 (头部/腰部/尾部) + 产出内容类型 + 自定义业务标签
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsTagEditing(!isTagEditing)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100"
          >
            {isTagEditing ? '完成打标' : '+ 快速编辑/打标'}
          </button>
        </div>

        {/* Tags Badges display */}
        <div className="flex flex-wrap gap-1.5 items-center">
          {tags.length === 0 ? (
            <span className="text-xs text-slate-400 italic">暂无标签，点击右上角添加</span>
          ) : (
            tags.map((tag) => (
              <span
                key={tag}
                className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                  tag === '白名单'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                    : tag === '黑名单'
                    ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
                    : tag === '头部' || tag === '腰部' || tag === '尾部'
                    ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                    : standardOutputTypes.includes(tag)
                    ? 'bg-purple-50 text-purple-700 border-purple-200 font-medium'
                    : 'bg-slate-100 text-slate-700 border-slate-200 font-medium'
                }`}
              >
                {tag === '白名单' && <ShieldCheck className="w-3 h-3 text-emerald-600" />}
                {tag === '黑名单' && <ShieldAlert className="w-3 h-3 text-rose-600" />}
                {tag === '头部' && <Crown className="w-3 h-3 text-amber-500" />}
                {tag === '腰部' && <Layers className="w-3 h-3 text-blue-500" />}
                <span>{tag}</span>
                {isTagEditing && (
                  <button
                    onClick={() => dataService.removeKolTag(kol.id, tag)}
                    className="text-slate-400 hover:text-rose-600 ml-1 font-bold"
                  >
                    ×
                  </button>
                )}
              </span>
            ))
          )}
        </div>

        {/* Inline Tag Selector when editing */}
        {isTagEditing && (
          <div className="pt-3 border-t border-slate-200 space-y-2.5 animate-in fade-in duration-100">
            <div className="text-[11px] font-semibold text-slate-600">点击快捷勾选已有标签：</div>
            <div className="flex flex-wrap gap-1.5">
              {allAvailableTags.map((tag) => {
                const isTagged = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => handleToggleTag(tag)}
                    className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1 transition-all ${
                      isTagged
                        ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isTagged && <Check className="w-3 h-3" />}
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Add Custom Tag */}
            <div className="flex items-center gap-2 max-w-sm pt-1">
              <input
                type="text"
                placeholder="输入自建新标签并回车..."
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 shrink-0"
              >
                + 新建
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: HISTORICAL CONTENT TASKS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>该达人在本平台的历史合作 Content 任务 ({contents.length})</span>
          </h3>

          <button
            onClick={onOpenNewContent}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            + 发起新任务
          </button>
        </div>

        {contents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            该达人暂无历史合作任务记录。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">所属 Campaign</th>
                  <th className="px-5 py-3 min-w-[240px]">履约进度 (4阶段流程)</th>
                  <th className="px-5 py-3">Stage 阶段</th>
                  <th className="px-5 py-3">Status 状态</th>
                  <th className="px-5 py-3">发布表现 (手动)</th>
                  <th className="px-5 py-3">Current Owner</th>
                  <th className="px-5 py-3">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contents.map((item) => {
                  const overdue = isOverdue(item.deadline, item.stage);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onNavigate('content-detail', { id: item.id })}
                      className={`hover:bg-indigo-50/40 cursor-pointer transition-colors ${
                        overdue ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-600">
                        {getCampaignName(item.campaignId)}
                      </td>
                      <td className="px-5 py-3.5">
                        <ContentInlineProgressBar content={item} />
                      </td>
                      <td className="px-5 py-3.5">
                        <StageBadge stage={item.stage} size="sm" />
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px]">
                        {item.performanceData ? (
                          <span className="text-emerald-700 font-bold">
                            {(item.performanceData.views || 0).toLocaleString()} 播放 /{' '}
                            {(item.performanceData.likes || 0).toLocaleString()} 赞
                          </span>
                        ) : (
                          <span className="text-slate-400">未录入</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <OwnerBadge owner={item.currentOwner} />
                      </td>
                      <td className="px-5 py-3.5 font-mono">{item.deadline}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit KOL Modal */}
      {isEditModalOpen && (
        <NewKolModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            const updated = dataService.getKolById(kolId);
            setKol(updated);
            setIsEditModalOpen(false);
          }}
          initialKol={kol}
        />
      )}

      {/* Custom Delete Past Work Confirmation Modal */}
      {deletingWorkId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">确认删除该篇作品记录？</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  删除后系统将自动重新计算达人往期均播与互动率等汇总数据。
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingWorkId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteWork(deletingWorkId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
