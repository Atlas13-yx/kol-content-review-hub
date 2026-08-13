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
import { AiSubtitleAuditModal } from '../components/AiSubtitleAuditModal';
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
  Eye,
  Shield,
  Lock
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
  const [showAiAuditModal, setShowAiAuditModal] = useState(false);
  const [aiAuditAssetType, setAiAuditAssetType] = useState<AssetType>('Video');
  const [aiAuditVersionNum, setAiAuditVersionNum] = useState<number>(1);
  const [aiAuditInitialSubtitles, setAiAuditInitialSubtitles] = useState<string>('');

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
    <div className="p-8 space-y-8 max-w-7xl mx-auto pb-24">
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
                  setShowAgencyModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-900/20 transition-all"
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
                  setShowMyReviewModal(true);
                }}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all animate-bounce-subtle ${
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
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>+ 提交新脚本版本 (Script)</span>
              </button>
            )}

            {content.stage === 'Video' && (
              <button
                onClick={() => setShowNewVideoModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                <Plus className="w-4 h-4 text-purple-600" />
                <span>+ 提交新视频版本 (Video)</span>
              </button>
            )}
          </div>
        </div>

        {/* Deadline & Key Fields Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 text-xs">
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

          <div>
            <span className="text-slate-400 font-medium block text-[11px]">达人联系人</span>
            <div className="font-medium text-slate-800 mt-0.5 truncate">{kol?.contact || '未填写'}</div>
          </div>

          <div>
            <span className="text-slate-400 font-medium block text-[11px]">责任负责人</span>
            <div className="font-medium text-slate-800 mt-0.5">{content.owner || '广汽国际'}</div>
          </div>
        </div>
      </div>

      {/* Brief Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-600" />
            <span>Brief 需求与参考素材资料</span>
          </h3>
          {isEditingBrief ? (
            <button
              onClick={handleSaveBrief}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700"
            >
              <Check className="w-3.5 h-3.5" />
              <span>保存修改</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditingBrief(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
              <span>编辑 Brief</span>
            </button>
          )}
        </div>

        {isEditingBrief ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brief 要求说明</label>
              <textarea
                rows={3}
                value={briefText}
                onChange={(e) => setBriefText(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brief 云文档 / 素材链接</label>
              <input
                type="text"
                value={briefUrl}
                onChange={(e) => setBriefUrl(e.target.value)}
                className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">审核特别注意与团队备注</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-slate-700">
            <div>
              <span className="font-bold text-slate-900 block mb-1">Brief 核心要点：</span>
              <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                {content.briefText || '暂无详细 Brief 描述'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              {content.briefUrl && (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900">Brief 素材文档：</span>
                  <a
                    href={content.briefUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline font-medium inline-flex items-center gap-1"
                  >
                    点击打开在线文档 <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {content.notes && (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900">审核注意事项：</span>
                  <span className="text-slate-600">{content.notes}</span>
                </div>
              )}
            </div>
          </div>
        )}
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
            <button
              onClick={() => {
                setAiAuditAssetType('Script');
                setAiAuditVersionNum(selectedScriptVer?.versionNumber || 1);
                setAiAuditInitialSubtitles(selectedScriptVer?.scriptText || '');
                setShowAiAuditModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold text-xs shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              <span>AI 脚本与 Brief 智能初审插件</span>
            </button>

            <button
              onClick={() => setShowNewScriptModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>添加新脚本版本</span>
            </button>
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
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{selectedScriptVer.title}</span>
                    <span className="text-slate-400 font-mono">提交于 {selectedScriptVer.submittedAt.replace('T', ' ').substring(0, 16)}</span>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                    {selectedScriptVer.scriptText}
                  </div>

                  {selectedScriptVer.fileUrl && (
                    <div className="pt-1 text-xs">
                      <a
                        href={selectedScriptVer.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-1"
                      >
                        下载/查看完整 Word 脚本附件 <ExternalLink className="w-3.5 h-3.5" />
                      </a>
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
            <button
              onClick={() => {
                setAiAuditAssetType('Video');
                setAiAuditVersionNum(selectedVideoVer?.versionNumber || 1);
                setAiAuditInitialSubtitles('');
                setShowAiAuditModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-xs shadow-md border border-cyan-400/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              <span>AI 多语种字幕识别与 Brief 初审插件</span>
            </button>

            <button
              onClick={() => setShowNewVideoModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>添加新视频版本</span>
            </button>
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

      {/* Post-Release Performance Data Section (发布后数据手动填充) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">发布后表现数据 (手动填充)</h3>
            {content.performanceData?.publishedAt && (
              <span className="text-xs text-slate-400 font-mono">
                发布日期: {content.performanceData.publishedAt}
              </span>
            )}
          </div>

          <button
            onClick={() => setShowPerformanceModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{content.performanceData ? '修改/更新发布数据' : '录入发布后数据'}</span>
          </button>
        </div>

        {content.performanceData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <div className="text-slate-400 text-xs flex items-center justify-center gap-1 mb-1">
                  <Eye className="w-3.5 h-3.5 text-blue-500" />
                  <span>阅读/播放量</span>
                </div>
                <div className="text-base font-extrabold text-slate-900 font-mono">
                  {(content.performanceData.views || 0).toLocaleString()}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <div className="text-slate-400 text-xs flex items-center justify-center gap-1 mb-1">
                  <ThumbsUp className="w-3.5 h-3.5 text-rose-500" />
                  <span>点赞数</span>
                </div>
                <div className="text-base font-extrabold text-slate-900 font-mono">
                  {(content.performanceData.likes || 0).toLocaleString()}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <div className="text-slate-400 text-xs flex items-center justify-center gap-1 mb-1">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                  <span>评论数</span>
                </div>
                <div className="text-base font-extrabold text-slate-900 font-mono">
                  {(content.performanceData.comments || 0).toLocaleString()}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <div className="text-slate-400 text-xs flex items-center justify-center gap-1 mb-1">
                  <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>分享/转发</span>
                </div>
                <div className="text-base font-extrabold text-slate-900 font-mono">
                  {(content.performanceData.shares || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {content.performanceData.publishUrl && (
              <div className="text-xs bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 flex items-center justify-between">
                <span className="font-semibold text-emerald-900">线上发布链接：</span>
                <a
                  href={content.performanceData.publishUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 hover:underline font-bold inline-flex items-center gap-1 truncate max-w-md"
                >
                  {content.performanceData.publishUrl} <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            内容核准发布后，可点击右上角“录入发布后数据”手动补充各平台的展现与互动效果。
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

      <AiSubtitleAuditModal
        isOpen={showAiAuditModal}
        content={content}
        campaign={campaign}
        assetType={aiAuditAssetType}
        versionNumber={aiAuditVersionNum}
        initialSubtitles={aiAuditInitialSubtitles}
        onClose={() => setShowAiAuditModal(false)}
        onApplyReviewDraft={(draftText) => {
          if (content.status === 'Waiting for Agency Review') {
            setShowAgencyModal(true);
          } else if (content.status === 'Waiting for My Review') {
            setShowMyReviewModal(true);
          }
        }}
      />
    </div>
  );
};
