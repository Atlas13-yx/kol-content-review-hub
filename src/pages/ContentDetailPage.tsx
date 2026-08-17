import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { ContentItem, ScriptVersion, VideoVersion, Review, Stage, UserRole, AssetType } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { OwnerBadge } from '../components/OwnerBadge';
import { Timeline } from '../components/Timeline';
import { AgencyReviewModal } from '../components/AgencyReviewModal';
import { MyReviewModal } from '../components/MyReviewModal';
import { NewScriptVersionModal } from '../components/NewScriptVersionModal';
import { NewVideoVersionModal } from '../components/NewVideoVersionModal';
import { PerformanceModal } from '../components/PerformanceModal';
import { UploadPublishLinkModal } from '../components/UploadPublishLinkModal';
import { ContentProgressBar } from '../components/ContentProgressBar';
import { IntegratedReviewWorkbenchModal } from '../components/IntegratedReviewWorkbenchModal';
import { UploadBriefModal } from '../components/UploadBriefModal';
import { AiBriefAuditModal } from '../components/AiBriefAuditModal';
import { isOverdue } from '../utils/dateUtils';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Edit3,
  Check,
  FileText,
  Video,
  Building2,
  UserCheck,
  Send,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  BarChart2,
  ThumbsUp,
  MessageSquare,
  Share2,
  Bookmark,
  Activity,
  Percent,
  Calculator,
  Eye,
  Timer,
  Zap,
  Shield,
  Lock,
  Package,
  Layers,
  TrendingUp,
  FileSpreadsheet,
  ChevronRight,
} from 'lucide-react';

interface ContentDetailPageProps {
  contentId: string;
  onNavigate: (page: string, params?: { id?: string }) => void;
}

export const ContentDetailPage: React.FC<ContentDetailPageProps> = ({ contentId, onNavigate }) => {
  const [content, setContent] = useState<ContentItem | undefined>();
  const [scriptVersions, setScriptVersions] = useState<ScriptVersion[]>([]);
  const [videoVersions, setVideoVersions] = useState<VideoVersion[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>(dataService.getCurrentRole());

  // Selected Version Tabs
  const [selectedScriptVerId, setSelectedScriptVerId] = useState<string>('');
  const [selectedVideoVerId, setSelectedVideoVerId] = useState<string>('');

  // Brief Edit Mode
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [briefText, setBriefText] = useState('');
  const [briefUrl, setBriefUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Modal states
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [showMyReviewModal, setShowMyReviewModal] = useState(false);
  const [showNewScriptModal, setShowNewScriptModal] = useState(false);
  const [showNewVideoModal, setShowNewVideoModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [showUploadLinkModal, setShowUploadLinkModal] = useState(false);
  const [showIntegratedWorkbench, setShowIntegratedWorkbench] = useState(false);
  const [workbenchAssetType, setWorkbenchAssetType] = useState<AssetType>('Script');
  const [showUploadBriefModal, setShowUploadBriefModal] = useState(false);
  const [showAiBriefAuditModal, setShowAiBriefAuditModal] = useState(false);

  const reloadData = () => {
    setCurrentRole(dataService.getCurrentRole());
    const cnt = dataService.getContentById(contentId);
    setContent(cnt);
    if (cnt) {
      setBriefText(cnt.briefText || '');
      setBriefUrl(cnt.briefUrl || '');
      setNotes(cnt.notes || '');

      const svs = dataService.getScriptVersions(contentId);
      setScriptVersions(svs);
      if (svs.length > 0) {
        setSelectedScriptVerId((prev) => (svs.some((v) => v.id === prev) ? prev : svs[svs.length - 1].id));
      }

      const vvs = dataService.getVideoVersions(contentId);
      setVideoVersions(vvs);
      if (vvs.length > 0) {
        setSelectedVideoVerId((prev) => (vvs.some((v) => v.id === prev) ? prev : vvs[vvs.length - 1].id));
      }

      setReviews(dataService.getReviews(contentId));
    }
  };

  useEffect(() => {
    reloadData();
    return dataService.subscribe(reloadData);
  }, [contentId]);

  if (!content) {
    return (
      <div className="p-12 text-center text-slate-500 space-y-3">
        <p className="text-base font-bold text-slate-800">未找到该 Content 任务</p>
        <button
          onClick={() => onNavigate('contents')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs"
        >
          返回 Content 任务列表
        </button>
      </div>
    );
  }

  const campaign = dataService.getCampaignById(content.campaignId);
  const kol = dataService.getKolById(content.kolId);
  const overdue = isOverdue(content.deadline, content.stage);
  const timelineEvents = dataService.getTimelineEvents(contentId);

  const selectedScriptVer = scriptVersions.find((v) => v.id === selectedScriptVerId) || scriptVersions[scriptVersions.length - 1];
  const selectedVideoVer = videoVersions.find((v) => v.id === selectedVideoVerId) || videoVersions[videoVersions.length - 1];

  // Helper for reviews of selected script/video version
  const getVersionReviews = (assetType: 'Script' | 'Video', versionId?: string) => {
    if (!versionId) return { agency: null, me: null, final: null };
    const versReviews = reviews.filter((r) => r.assetType === assetType && r.versionId === versionId);
    return {
      agency: versReviews.find((r) => r.reviewerType === 'Agency'),
      me: versReviews.find((r) => r.reviewerType === 'Me'),
      final: versReviews.find((r) => r.reviewerType === 'Final Feedback'),
    };
  };

  const currentScriptReviews = getVersionReviews('Script', selectedScriptVer?.id);
  const currentVideoReviews = getVersionReviews('Video', selectedVideoVer?.id);

  const handleSaveBrief = () => {
    dataService.updateContentBrief(contentId, briefText, briefUrl, notes);
    setIsEditingBrief(false);
  };

  const handleMarkCompleted = () => {
    if (window.confirm('确定要将该 Content 内容任务标记为已完成 (Completed) 吗？')) {
      dataService.markContentCompleted(contentId);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto pb-24 font-sans">
      {/* Back & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('contents')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回 Contents 任务列表</span>
        </button>

        <div className="flex items-center gap-2">
          {content.stage !== 'Completed' && (
            <button
              onClick={handleMarkCompleted}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>标记为审核完成 (Mark as Completed)</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Content Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        {/* Top Badges & Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {kol?.name || '未知KOL'} ({content.platform})
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-600 font-medium">{campaign?.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <StageBadge stage={content.stage} />
            <StatusBadge status={content.status} size="lg" />
            <OwnerBadge owner={content.currentOwner} />
          </div>
        </div>

        {/* Role Access Banner Notice */}
        <div className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
          currentRole === 'Agency'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-indigo-50 border-indigo-200 text-indigo-900'
        }`}>
          <div className="flex items-center gap-2">
            {currentRole === 'Agency' ? <Building2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <Shield className="w-4 h-4 text-indigo-600 shrink-0" />}
            <span>
              <strong>当前登录身份：{currentRole === 'Agency' ? '省广代理商 (Agency)' : '广汽国际 (Me)'}</strong>
              {currentRole === 'Agency'
                ? ' — 仅允许编辑/上传【省广初审意见】。广汽国际终审意见需由广汽国际账号登录后裁决。'
                : ' — 负责广汽国际终审。广汽国际不直接和达人对接，您上传修改裁决后由省广转告达人执行修改。'}
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-white font-bold shadow-xs">
            {currentRole === 'Agency' ? '上传省广初审' : '广汽国际裁决'}
          </span>
        </div>

        {/* Publish Link & Data Entry Reminder Banner */}
        {(content.status === 'Pending Publish Link' || content.status === 'Pending Data Entry' || content.videoApprovedAt) && (
          <div className="space-y-3 pt-1">
            {/* 1. Agency Reminder Banner */}
            {content.status === 'Pending Publish Link' && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-purple-500/30">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-400/30 text-purple-300 shrink-0 mt-0.5">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-purple-100 flex items-center gap-2">
                      <span>🚨 【省广任务提醒】广汽国际已同意视频发布，请于 1 天内上传线上链接</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/40 text-purple-200 border border-purple-400/30 font-mono">
                        限时 24 小时
                      </span>
                    </div>
                    <p className="text-xs text-purple-200/90 leading-relaxed">
                      广汽国际于 {content.videoApprovedAt ? new Date(content.videoApprovedAt).toLocaleString('zh-CN') : '近期'} 批准该视频公开发布。请省广团队于{' '}
                      <strong className="text-white font-mono bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-400/40">
                        {content.linkUploadDeadline ? new Date(content.linkUploadDeadline).toLocaleString('zh-CN') : '1天内'}
                      </strong>{' '}
                      前在 Tiktok / Instagram / Youtube / Facebook 等平台上线，并在此提交公开视频链接。
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUploadLinkModal(true)}
                  className="px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>上传线上发布链接</span>
                </button>
              </div>
            )}

            {/* 2. Agency (省广) 3-Day Data Reminder Banner */}
            {(content.videoApprovedAt || content.status === 'Pending Data Entry') && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-cyan-500/30">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 shrink-0 mt-0.5">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-cyan-100 flex items-center gap-2">
                      <span>📊 【省广数据履约提醒】视频发布 3 天后补充详细投放数据</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/30 text-cyan-200 border border-cyan-400/30 font-mono">
                        上线满3天数据归档
                      </span>
                    </div>
                    <p className="text-xs text-cyan-200/90 leading-relaxed">
                      系统履约机制：视频公开发布 3 天后（提醒触发日期：
                      <strong className="text-white font-mono bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-400/40">
                        {content.dataReminderDate ? new Date(content.dataReminderDate).toLocaleDateString('zh-CN') : '3天后'}
                      </strong>
                      ）由省广团队补充录入该视频的播放量、3秒完播率、点赞、评论、收藏与转发互动数据。
                      {content.performanceData?.publishUrl && (
                        <span className="ml-1 text-emerald-300">
                          (省广已提交上线链接：<a href={content.performanceData.publishUrl} target="_blank" rel="noreferrer" className="underline font-mono">{content.performanceData.publishUrl}</a>)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPerformanceModal(true)}
                  className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BarChart2 className="w-4 h-4" />
                  <span>补充录入表现数据</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Title & Topic */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{content.title}</h1>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
              <span>主题 Topic: {content.topic}</span>
              <span className="text-slate-300">|</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                content.category === '二创' ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {content.category || '原创'}
              </span>
            </p>
          </div>

          {/* Action Zone for Reviewing */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {/* If Waiting for Agency Review -> Add Agency Review button */}
            {content.status === 'Waiting for Agency Review' && (
              <button
                onClick={() => {
                  if (currentRole !== 'Agency') {
                    if (!window.confirm('您当前身份为【广汽国际】，是否继续代省广团队录入初审意见？')) return;
                  }
                  setWorkbenchAssetType(content.stage === 'Video' ? 'Video' : 'Script');
                  setShowIntegratedWorkbench(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-900/20 transition-all cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                <span>录入省广审核意见</span>
              </button>
            )}

            {/* If Waiting for My Review -> Prominent Review Button */}
            {content.status === 'Waiting for My Review' && (
              <button
                onClick={() => {
                  if (currentRole === 'Agency') {
                    alert('【身份限制】您当前身份为【省广代理商】，不能代替广汽国际录入终审意见！请在右上角‘切换身份’为广汽国际。');
                    return;
                  }
                  setWorkbenchAssetType(content.stage === 'Video' ? 'Video' : 'Script');
                  setShowIntegratedWorkbench(true);
                }}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all animate-bounce-subtle cursor-pointer ${
                  currentRole === 'Agency'
                    ? 'bg-slate-400 text-white cursor-not-allowed opacity-80'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-900/30'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>广汽国际终审 Review {content.stage === 'Script' ? '脚本' : '视频'}</span>
              </button>
            )}

            {/* Add New Version buttons */}
            {content.stage === 'Script' && (
              <button
                onClick={() => setShowNewScriptModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>+ 提交新脚本版本 (Script)</span>
              </button>
            )}

            {content.stage === 'Video' && (
              <button
                onClick={() => setShowNewVideoModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-purple-600" />
                <span>+ 提交新视频版本 (Video)</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Progress Bar Pipeline (Replacing Old Contact / Owner Text Fields) */}
        <ContentProgressBar content={content} />

        {/* Deadline & Key Fields Row */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 font-medium block text-[11px]">截止日期 Deadline</span>
            <div className="font-mono font-bold text-slate-800 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className={overdue ? 'text-rose-600' : ''}>{content.deadline}</span>
              {overdue && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-100 text-rose-700 font-extrabold ml-1">
                  已逾期
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-medium block text-[11px]">当前责任方 Owner</span>
            <div className="mt-0.5">
              <OwnerBadge owner={content.currentOwner} />
            </div>
          </div>
        </div>
      </div>

      {/* Brief Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Brief 提报方案与创作诉求 (含达人画像、素材包、投产比预估)
            </h3>
            {content.stage === 'Brief' && (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {content.status === 'Waiting for Brief Approval' ? '待广汽审核' : '省广草稿'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAiBriefAuditModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI 诊断 Brief</span>
            </button>

            <button
              onClick={() => setShowUploadBriefModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>省广上传 / 完善 Brief 表格</span>
            </button>

            {content.stage === 'Brief' && currentRole === 'Me' && (
              <button
                onClick={() => {
                  dataService.approveBrief(content.id, '广汽国际审核通过 Brief 方案，同意推进脚本撰写');
                  reloadData();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>核准通过 Brief</span>
              </button>
            )}
          </div>
        </div>

        {/* Structured Brief Display */}
        <div className="space-y-3.5 text-xs text-slate-700">
          {/* Row 1: Key Metrics from BriefData */}
          {content.briefData && (
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                <span className="text-[10px] text-slate-400 font-semibold block">粉丝量 / 量级</span>
                <span className="font-bold text-slate-900">
                  {content.briefData.followersCount || '63,000'} ({content.briefData.tier || '中腰部'})
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                <span className="text-[10px] text-slate-400 font-semibold block">地区 / 属性</span>
                <span className="font-bold text-slate-900 truncate block">
                  {content.briefData.region || '俄罗斯'} · {content.briefData.accountAttribute || '车主'}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                <span className="text-[10px] text-slate-400 font-semibold block">合作费用预算</span>
                <span className="font-bold font-mono text-indigo-700">
                  ¥{content.briefData.collaborationCost !== undefined ? content.briefData.collaborationCost : 15000}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                <span className="text-[10px] text-slate-400 font-semibold block">投流合作</span>
                <span className="font-bold text-slate-900">
                  {content.briefData.adBoostCooperation || '愿意辅助投流'}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                <span className="text-[10px] text-slate-400 font-semibold block">预估播放 / 互动</span>
                <span className="font-bold font-mono text-emerald-700">
                  {content.briefData.estimatedViews || '25000+'} / {content.briefData.estimatedEngagements || '500+'}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                <span className="text-[10px] text-slate-400 font-semibold block">预估 CPC</span>
                <span className="font-bold font-mono text-cyan-700">
                  ¥{content.briefData.estimatedCpc !== undefined ? content.briefData.estimatedCpc : '0.60'}
                </span>
              </div>
            </div>
          )}

          {/* Row 2: Creative Direction & Hook */}
          <div>
            <span className="font-bold text-slate-900 block mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              创作建议与核心诉求 (Creative Direction)：
            </span>
            <p className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 leading-relaxed whitespace-pre-line text-slate-800">
              {content.briefData?.creativeDirection || content.briefText || '暂无详细 Brief 描述'}
            </p>
          </div>

          {/* Row 3: Provided Assets */}
          {content.briefData?.providedAssets && content.briefData.providedAssets.length > 0 && (
            <div>
              <span className="font-bold text-slate-900 block mb-1.5 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-emerald-600" />
                省广提供素材清单 (Materials Provided to KOL)：
              </span>
              <div className="flex flex-wrap gap-1.5">
                {content.briefData.providedAssets.map((asset, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                  >
                    ✓ {asset}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Row 4: Links & Notes */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              {(content.briefData?.briefDocUrl || content.briefUrl) && (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900">Brief 云文档表格：</span>
                  <a
                    href={content.briefData?.briefDocUrl || content.briefUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline font-medium inline-flex items-center gap-1"
                  >
                    点击打开在线文档 <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {content.briefData?.submittedBy && (
                <div className="flex items-center gap-1 text-slate-500">
                  <span>提报方：</span>
                  <strong className="text-slate-700">{content.briefData.submittedBy}</strong>
                  <span>({content.briefData.submittedAt || '已提交'})</span>
                </div>
              )}
            </div>

            {content.briefData?.reviewFeedback && (
              <div className="text-indigo-700 font-medium bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                <strong>广汽审核批注：</strong> {content.briefData.reviewFeedback}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Script Version Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Script 脚本版本历史与多轮意见管理</h3>
            <span className="text-xs text-slate-400">({scriptVersions.length} 个版本)</span>
          </div>

          <div className="flex items-center gap-2">
            {currentRole === 'Agency' && (
              <button
                onClick={() => setShowNewScriptModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>添加新脚本版本 (省广提交)</span>
              </button>
            )}
          </div>
        </div>

        {scriptVersions.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            达人尚未提交脚本。点击上方“添加新脚本版本”进行录入。
          </div>
        ) : (
          <div className="space-y-4">
            {/* Script Version Tabs / Version Selector */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
              {scriptVersions.map((sv) => {
                const isSelected = sv.id === selectedScriptVer?.id;
                return (
                  <button
                    key={sv.id}
                    onClick={() => setSelectedScriptVerId(sv.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>Script V{sv.versionNumber}</span>
                    {sv.status === 'Approved' && (
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${isSelected ? 'bg-white text-emerald-700' : 'bg-emerald-100 text-emerald-800'}`}>
                        Approved 已通过
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Script Version Detail Block */}
            {selectedScriptVer && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{selectedScriptVer.title}</span>
                    <span className="text-slate-400 font-mono">提交于 {selectedScriptVer.submittedAt.replace('T', ' ').substring(0, 16)}</span>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                    {selectedScriptVer.scriptText}
                  </div>

                  {/* Direct Open Document Link */}
                  {selectedScriptVer.fileUrl && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-blue-950">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>已附带 Word/DOCX 脚本文档附件：</span>
                        <code className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono text-[11px] text-blue-900">
                          {selectedScriptVer.fileUrl.split('/').pop() || selectedScriptVer.fileUrl}
                        </code>
                      </div>
                      <a
                        href={selectedScriptVer.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm inline-flex items-center gap-1 transition-colors"
                      >
                        <span>直接打开文档</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  {/* AI Agent Brief Audit Result Box (1, 2, 3 Points) */}
                  {selectedScriptVer.aiAuditResult && (
                    <div className="p-3.5 bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-950">
                      <div className="flex items-center justify-between font-bold border-b border-amber-200/80 pb-2 text-amber-900">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          🤖 AI Agent 自动诊断：与 Brief 未匹配点 ({selectedScriptVer.aiAuditResult.unmatchedPoints?.length || 0}条)
                        </span>
                        <span className="px-2 py-0.5 bg-amber-200/80 rounded font-mono text-[10px]">
                          Brief 契合度 {selectedScriptVer.aiAuditResult.score || 85}%
                        </span>
                      </div>

                      {selectedScriptVer.aiAuditResult.unmatchedPoints?.length > 0 ? (
                        <div className="space-y-1.5 pt-1">
                          {selectedScriptVer.aiAuditResult.unmatchedPoints.map((pt: string, idx: number) => (
                            <div key={idx} className="p-2.5 bg-white rounded-lg border border-amber-200 flex items-start gap-2.5 shadow-2xs">
                              <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-medium text-amber-950 leading-relaxed">{pt}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-emerald-700 font-bold flex items-center gap-1 py-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>AI Agent 诊断完成：本版脚本 100% 契合 Brief 全部核心要求！</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3 Distinct Review Boxes (省广意见, 我的意见, Final Feedback) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Agency Review Box */}
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-amber-600" />
                        省广审核意见
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Agency Review</span>
                    </div>

                    {currentScriptReviews.agency ? (
                      <p className="text-xs text-amber-950 leading-relaxed whitespace-pre-wrap font-medium">
                        {currentScriptReviews.agency.reviewContent}
                      </p>
                    ) : (
                      <div className="text-xs text-amber-700/60 italic py-2">暂无省广初审意见</div>
                    )}
                  </div>

                  {/* My Review Box */}
                  <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-indigo-600" />
                        我的审核意见
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">My Review</span>
                    </div>

                    {currentScriptReviews.me ? (
                      <p className="text-xs text-indigo-950 leading-relaxed whitespace-pre-wrap font-medium">
                        {currentScriptReviews.me.reviewContent}
                      </p>
                    ) : (
                      <div className="text-xs text-indigo-700/60 italic py-2">暂无我的内部审核意见</div>
                    )}
                  </div>

                  {/* Final Feedback Box */}
                  <div className="bg-rose-50/60 border border-rose-200/80 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        Final Feedback (发给达人)
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">达人反馈</span>
                    </div>

                    {currentScriptReviews.final ? (
                      <p className="text-xs text-rose-950 leading-relaxed whitespace-pre-wrap font-medium">
                        {currentScriptReviews.final.reviewContent}
                      </p>
                    ) : (
                      <div className="text-xs text-rose-700/60 italic py-2">暂无发给达人的统一终审意见</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video Version Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Video 视频版本历史与审核意见</h3>
            <span className="text-xs text-slate-400">({videoVersions.length} 个版本)</span>
          </div>

          <div className="flex items-center gap-2">
            {currentRole === 'Agency' && (
              <button
                onClick={() => setShowNewVideoModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>添加新视频版本 (省广提交)</span>
              </button>
            )}
          </div>
        </div>

        {videoVersions.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            尚未提交视频版本（脚本通过后达人开始拍摄成片）。
          </div>
        ) : (
          <div className="space-y-4">
            {/* Video Version Selector */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
              {videoVersions.map((vv) => {
                const isSelected = vv.id === selectedVideoVer?.id;
                return (
                  <button
                    key={vv.id}
                    onClick={() => setSelectedVideoVerId(vv.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>Video V{vv.versionNumber}</span>
                    {vv.status === 'Approved' && (
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${isSelected ? 'bg-white text-emerald-700' : 'bg-emerald-100 text-emerald-800'}`}>
                        Approved 已通过
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedVideoVer && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">Video V{selectedVideoVer.versionNumber} 视频文件与播放</span>
                    <span className="text-slate-400 font-mono">提交于 {selectedVideoVer.submittedAt.replace('T', ' ').substring(0, 16)}</span>
                  </div>

                  {/* Video Player */}
                  <div className="rounded-lg overflow-hidden border border-slate-300 bg-black max-w-xl mx-auto">
                    <video
                      src={selectedVideoVer.videoUrl}
                      controls
                      className="w-full max-h-80 object-contain"
                    />
                  </div>

                  {selectedVideoVer.fileUrl && (
                    <div className="text-xs text-center">
                      <a
                        href={selectedVideoVer.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-600 hover:underline font-semibold inline-flex items-center gap-1"
                      >
                        下载 HD 4K 高清原片素材 <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>

                {/* 3 Distinct Review Boxes for Video */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Agency Review */}
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-amber-600" />
                        省广视频审核意见
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Agency Review</span>
                    </div>

                    {currentVideoReviews.agency ? (
                      <p className="text-xs text-amber-950 leading-relaxed whitespace-pre-wrap font-medium">
                        {currentVideoReviews.agency.reviewContent}
                      </p>
                    ) : (
                      <div className="text-xs text-amber-700/60 italic py-2">暂无省广视频初审意见</div>
                    )}
                  </div>

                  {/* My Review */}
                  <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-indigo-600" />
                        我的视频审核意见
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">My Review</span>
                    </div>

                    {currentVideoReviews.me ? (
                      <p className="text-xs text-indigo-950 leading-relaxed whitespace-pre-wrap font-medium">
                        {currentVideoReviews.me.reviewContent}
                      </p>
                    ) : (
                      <div className="text-xs text-indigo-700/60 italic py-2">暂无我的内部审核意见</div>
                    )}
                  </div>

                  {/* Final Feedback */}
                  <div className="bg-rose-50/60 border border-rose-200/80 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        Final Feedback (发给达人)
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">达人反馈</span>
                    </div>

                    {currentVideoReviews.final ? (
                      <p className="text-xs text-rose-950 leading-relaxed whitespace-pre-wrap font-medium">
                        {currentVideoReviews.final.reviewContent}
                      </p>
                    ) : (
                      <div className="text-xs text-rose-700/60 italic py-2">暂无发给达人的视频修改意见</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post-Release Performance Data Section (发布后数据手动填充与智能计算) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">发布后效果数据看板 (8项核心指标与转化分析)</h3>
                {content.performanceData && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    已归档
                  </span>
                )}
              </div>
              {content.performanceData?.publishedAt && (
                <span className="text-xs text-slate-500 font-mono">
                  实际上线日期: {content.performanceData.publishedAt}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {content.videoApprovedAt && !content.performanceData?.publishUrl && (
              <button
                onClick={() => setShowUploadLinkModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-semibold transition-colors"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>录入线上发布链接</span>
              </button>
            )}

            <button
              onClick={() => setShowPerformanceModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{content.performanceData ? '修改/重新计算发布数据' : '录入发布数据 (智能计算)'}</span>
            </button>
          </div>
        </div>

        {content.performanceData ? (
          <div className="space-y-4">
            {/* Highlights row: 互动量, 互动率 & 三秒完播率 Calculation & retention summaries */}
            {(() => {
              const views = content.performanceData.views || 0;
              const threeSecondPlayRate = content.performanceData.threeSecondPlayRate;
              const likes = content.performanceData.likes || 0;
              const comments = content.performanceData.comments || 0;
              const favorites = content.performanceData.favorites || 0;
              const shares = content.performanceData.shares || 0;
              const engagements = content.performanceData.engagements !== undefined 
                ? content.performanceData.engagements 
                : likes + comments + favorites + shares;
              const engagementRate = content.performanceData.engagementRate !== undefined
                ? content.performanceData.engagementRate
                : views > 0 ? parseFloat(((engagements / views) * 100).toFixed(2)) : 0;

              return (
                <>
                  {/* Highlight Calculation Banner */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1. 互动量总览 */}
                    <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 p-4 rounded-xl border border-indigo-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-indigo-600" />
                          综合互动量 (Engagements)
                        </span>
                        <span className="text-[10px] font-mono text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded font-bold">
                          四项加和
                        </span>
                      </div>
                      <div className="text-2xl font-extrabold text-indigo-950 font-mono">
                        {engagements.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        计算公式: 点赞 + 评论 + 收藏 + 转发
                      </div>
                    </div>

                    {/* 2. 互动率总览 */}
                    <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 p-4 rounded-xl border border-emerald-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <Percent className="w-4 h-4 text-emerald-600" />
                          综合互动率 (Eng. Rate)
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                          互动量 ÷ 播放量
                        </span>
                      </div>
                      <div className="text-2xl font-extrabold text-emerald-800 font-mono flex items-center gap-2">
                        <span>{engagementRate}%</span>
                        {engagementRate >= 5 && (
                          <span className="text-[10px] font-sans px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-full font-bold">
                            优质转化
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        公式: {engagements.toLocaleString()} ÷ {views.toLocaleString()} × 100%
                      </div>
                    </div>

                    {/* 3. 三秒完播率总览 */}
                    <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 p-4 rounded-xl border border-amber-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                          <Timer className="w-4 h-4 text-amber-600" />
                          三秒完播率 (3s Rate)
                        </span>
                        <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold">
                          黄金3秒留存
                        </span>
                      </div>
                      <div className="text-2xl font-extrabold text-amber-900 font-mono flex items-center gap-2">
                        <span>{threeSecondPlayRate !== undefined ? `${threeSecondPlayRate}%` : '未录入'}</span>
                        {threeSecondPlayRate !== undefined && threeSecondPlayRate >= 40 && (
                          <span className="text-[10px] font-sans px-2 py-0.5 bg-amber-200 text-amber-950 rounded-full font-bold flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5" />
                            高吸睛
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        {threeSecondPlayRate !== undefined 
                          ? (threeSecondPlayRate >= 40 ? '前3s极具吸睛力与停留价值' : '前3s留存表现平稳')
                          : '短视频平台黄金前3秒注意力捕获率'}
                      </div>
                    </div>
                  </div>

                  {/* 6 Detailed Metric Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* 1. 播放量 */}
                    <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100 text-center">
                      <div className="text-slate-500 text-xs flex items-center justify-center gap-1 mb-1 font-semibold">
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>播放/阅读量</span>
                      </div>
                      <div className="text-base font-extrabold text-blue-950 font-mono">
                        {views.toLocaleString()}
                      </div>
                    </div>

                    {/* 2. 三秒完播率 */}
                    <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100 text-center">
                      <div className="text-slate-500 text-xs flex items-center justify-center gap-1 mb-1 font-semibold">
                        <Timer className="w-3.5 h-3.5 text-amber-600" />
                        <span>三秒完播率</span>
                      </div>
                      <div className="text-base font-extrabold text-amber-950 font-mono">
                        {threeSecondPlayRate !== undefined ? `${threeSecondPlayRate}%` : '--'}
                      </div>
                    </div>

                    {/* 3. 点赞量 */}
                    <div className="bg-rose-50/40 p-3 rounded-xl border border-rose-100 text-center">
                      <div className="text-slate-500 text-xs flex items-center justify-center gap-1 mb-1 font-semibold">
                        <ThumbsUp className="w-3.5 h-3.5 text-rose-600" />
                        <span>点赞数</span>
                      </div>
                      <div className="text-base font-extrabold text-rose-950 font-mono">
                        {likes.toLocaleString()}
                      </div>
                    </div>

                    {/* 4. 评论量 */}
                    <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100 text-center">
                      <div className="text-slate-500 text-xs flex items-center justify-center gap-1 mb-1 font-semibold">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                        <span>评论数</span>
                      </div>
                      <div className="text-base font-extrabold text-amber-950 font-mono">
                        {comments.toLocaleString()}
                      </div>
                    </div>

                    {/* 5. 收藏量 */}
                    <div className="bg-purple-50/40 p-3 rounded-xl border border-purple-100 text-center">
                      <div className="text-slate-500 text-xs flex items-center justify-center gap-1 mb-1 font-semibold">
                        <Bookmark className="w-3.5 h-3.5 text-purple-600" />
                        <span>收藏量</span>
                      </div>
                      <div className="text-base font-extrabold text-purple-950 font-mono">
                        {favorites.toLocaleString()}
                      </div>
                    </div>

                    {/* 6. 转发量 */}
                    <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100 text-center">
                      <div className="text-slate-500 text-xs flex items-center justify-center gap-1 mb-1 font-semibold">
                        <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>分享/转发</span>
                      </div>
                      <div className="text-base font-extrabold text-emerald-950 font-mono">
                        {shares.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

            {content.performanceData.publishUrl && (
              <div className="text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                  线上视频公开链接：
                </span>
                <a
                  href={content.performanceData.publishUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 hover:underline font-mono font-bold inline-flex items-center gap-1 truncate max-w-md text-xs"
                >
                  {content.performanceData.publishUrl} <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <BarChart2 className="w-8 h-8 mx-auto text-slate-400" />
            <p className="font-semibold text-slate-700">暂未录入发布后效果数据</p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              视频在 Tiktok / Instagram / Youtube / Facebook 等平台公开发布 3 天后，省广团队将收到首页弹窗提醒，可在此补充录入播放量、点赞量、评论量、收藏量、转发量等核心指标。
            </p>
            <button
              onClick={() => setShowPerformanceModal(true)}
              className="mt-2 inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>立即录入数据 (支持自动计算)</span>
            </button>
          </div>
        )}
      </div>

      {/* Timeline Section */}
      <Timeline events={timelineEvents} />

      {/* MODALS */}
      <PerformanceModal
        isOpen={showPerformanceModal}
        content={content}
        onClose={() => setShowPerformanceModal(false)}
        onSuccess={reloadData}
      />

      <UploadPublishLinkModal
        isOpen={showUploadLinkModal}
        content={content}
        onClose={() => setShowUploadLinkModal(false)}
        onSuccess={reloadData}
      />
      <AgencyReviewModal
        isOpen={showAgencyModal}
        contentId={contentId}
        assetType={content.stage === 'Video' ? 'Video' : 'Script'}
        versionId={
          content.stage === 'Video'
            ? selectedVideoVer?.id || ''
            : selectedScriptVer?.id || ''
        }
        versionNumber={
          content.stage === 'Video'
            ? selectedVideoVer?.versionNumber || 1
            : selectedScriptVer?.versionNumber || 1
        }
        onClose={() => setShowAgencyModal(false)}
        onSuccess={reloadData}
      />

      <MyReviewModal
        isOpen={showMyReviewModal}
        contentId={contentId}
        assetType={content.stage === 'Video' ? 'Video' : 'Script'}
        versionId={
          content.stage === 'Video'
            ? selectedVideoVer?.id || ''
            : selectedScriptVer?.id || ''
        }
        versionNumber={
          content.stage === 'Video'
            ? selectedVideoVer?.versionNumber || 1
            : selectedScriptVer?.versionNumber || 1
        }
        onClose={() => setShowMyReviewModal(false)}
        onSuccess={reloadData}
      />

      <NewScriptVersionModal
        isOpen={showNewScriptModal}
        contentId={contentId}
        nextVersionNumber={
          scriptVersions.length > 0
            ? Math.max(...scriptVersions.map((v) => v.versionNumber)) + 1
            : 1
        }
        onClose={() => setShowNewScriptModal(false)}
        onSuccess={reloadData}
      />

      <NewVideoVersionModal
        isOpen={showNewVideoModal}
        contentId={contentId}
        nextVersionNumber={
          videoVersions.length > 0
            ? Math.max(...videoVersions.map((v) => v.versionNumber)) + 1
            : 1
        }
        onClose={() => setShowNewVideoModal(false)}
        onSuccess={reloadData}
      />

      <IntegratedReviewWorkbenchModal
        isOpen={showIntegratedWorkbench}
        contentId={contentId}
        assetType={workbenchAssetType}
        reviewerRole={currentRole}
        onClose={() => setShowIntegratedWorkbench(false)}
        onSuccess={reloadData}
      />

      <UploadBriefModal
        isOpen={showUploadBriefModal}
        content={content || null}
        onClose={() => setShowUploadBriefModal(false)}
        onSuccess={reloadData}
      />

      <AiBriefAuditModal
        isOpen={showAiBriefAuditModal}
        content={content || null}
        onClose={() => setShowAiBriefAuditModal(false)}
        onApproveSuccess={reloadData}
      />
    </div>
  );
};
