import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  FileText,
  Video as VideoIcon,
  CheckCircle2,
  AlertTriangle,
  Send,
  Building2,
  UserCheck,
  History,
  Zap,
  Copy,
  Shield,
  PlayCircle,
  FileCode,
  Info,
  Lock,
  ExternalLink,
  Target,
  Layers,
  Package,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { AssetType, ContentItem, Campaign, KOL, Review, ScriptVersion, VideoVersion, UserRole } from '../types';

interface IntegratedReviewWorkbenchModalProps {
  isOpen: boolean;
  contentId?: string;
  content?: ContentItem;
  assetType?: AssetType;
  versionNumber?: number;
  reviewerRole?: UserRole; // 'Me' or 'Agency'
  onClose: () => void;
  onSuccess: () => void;
}

// Preset subtitles for AI Audit fast test
const DEFAULT_SUBTITLES = `[00:00 - 00:08] (EN) Welcome to Paris Motor Show! Today we are testing the all-new GAC AION V.
[00:09 - 00:20] (FR) La nouvelle GAC AION V fait sa première apparition européenne avec un design élégant.
[00:21 - 00:38] (CN) GAC ADAS 2.0 智能驾驶辅助系统在巴黎狭窄路段表现非常平稳！
[00:39 - 00:55] (EN) Euro-NCAP 5-Star safety rating gives absolute peace of mind.
[00:56 - 01:10] (CN) 广汽国际全球累计下线突破3000万台品质背书！Go For More!`;

export const IntegratedReviewWorkbenchModal: React.FC<IntegratedReviewWorkbenchModalProps> = ({
  isOpen,
  contentId,
  content: propContent,
  assetType: propAssetType,
  versionNumber,
  reviewerRole,
  onClose,
  onSuccess,
}) => {
  const effectiveContentId = contentId || propContent?.id || '';
  const effectiveAssetType: AssetType =
    propAssetType || (propContent?.stage === 'Video' ? 'Video' : 'Script');

  // Data State
  const [content, setContent] = useState<ContentItem | undefined>(propContent);
  const [campaign, setCampaign] = useState<Campaign | undefined>(undefined);
  const [kol, setKol] = useState<KOL | undefined>(undefined);
  const [scriptVersions, setScriptVersions] = useState<ScriptVersion[]>([]);
  const [videoVersions, setVideoVersions] = useState<VideoVersion[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showScriptDrawer, setShowScriptDrawer] = useState(false);

  // Logged-in Role & User
  const loggedInRole: UserRole = reviewerRole || dataService.getCurrentRole();
  const currentUser = dataService.getCurrentUser();

  // AI Audit State
  const [subtitlesText, setSubtitlesText] = useState(DEFAULT_SUBTITLES);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAuditResult, setAiAuditResult] = useState<any>(null);

  // Form State
  const [outcome, setOutcome] = useState<'Approve' | 'Request Revision'>('Approve');
  const [agencyContent, setAgencyContent] = useState('');
  const [myReviewContent, setMyReviewContent] = useState('');
  const [finalFeedbackContent, setFinalFeedbackContent] = useState('');
  const [pastedImages, setPastedImages] = useState<string[]>([]);

  // Clipboard Paste & Upload Image Handlers
  const handlePasteImage = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (dataUrl) {
              setPastedImages((prev) => [...prev, dataUrl]);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (dataUrl) {
            setPastedImages((prev) => [...prev, dataUrl]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleRemoveImage = (index: number) => {
    setPastedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Load Data
  useEffect(() => {
    if (!isOpen || !effectiveContentId) return;

    const loadData = () => {
      const c = dataService.getContentById(effectiveContentId);
      setContent(c);
      if (c) {
        setCampaign(dataService.getCampaignById(c.campaignId));
        setKol(dataService.getKols().find((k) => k.id === c.kolId));
        const svs = dataService.getScriptVersions(c.id);
        const vvs = dataService.getVideoVersions(c.id);
        setScriptVersions(svs);
        setVideoVersions(vvs);
        setReviews(dataService.getReviews(c.id));

        // Pre-fill script text into subtitles preview
        if (svs.length > 0) {
          const latestScript = svs[svs.length - 1];
          if (latestScript.scriptText) {
            setSubtitlesText(latestScript.scriptText);
          }
        }
      }
    };

    loadData();
    const unsubscribe = dataService.subscribe(loadData);
    return () => unsubscribe();
  }, [isOpen, effectiveContentId, reviewerRole]);

  if (!isOpen || !content) return null;

  // Selected Version Objects
  const latestScriptVer = scriptVersions.length > 0 ? scriptVersions[scriptVersions.length - 1] : undefined;
  const latestVideoVer = videoVersions.length > 0 ? videoVersions[videoVersions.length - 1] : undefined;

  const currentVerNumber =
    versionNumber ||
    (effectiveAssetType === 'Script' ? latestScriptVer?.versionNumber || 1 : latestVideoVer?.versionNumber || 1);

  const currentVersionObj =
    effectiveAssetType === 'Script'
      ? scriptVersions.find((v) => v.versionNumber === currentVerNumber) || latestScriptVer
      : videoVersions.find((v) => v.versionNumber === currentVerNumber) || latestVideoVer;

  // Format Date for History Reviews list: "8.11 省广：xxx意见"
  const formatReviewDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) return '8.12';
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}.${day}`;
    } catch {
      return '8.12';
    }
  };

  const cleanText = (txt: string) => {
    return txt.replace(/^(省广意见：|我的意见：|最终修改意见：)/, '');
  };

  // Run AI Brief Audit
  const handleRunAiAudit = async () => {
    setIsAiLoading(true);
    try {
      const res = await dataService.auditBriefWithAi({
        contentTitle: content.title,
        campaignName: campaign?.name || '广汽国际出海营销',
        campaignBrief: campaign?.brief || '重点突出巴黎车展首秀、欧洲五星安全、智驾系统与3000万下线品质背书。',
        contentBrief: content.briefText || '多语种本地化测评视频，要求融入车展镜头与品牌 Tagline。',
        subtitlesText: subtitlesText.trim(),
        language: '多语种 (中/英/法/泰/阿)',
        assetType: effectiveAssetType,
      });

      if (res.success && res.result) {
        setAiAuditResult(res.result);
      }
    } catch (err) {
      console.error('AI Audit Error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Submit Review Form
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentVersionObj) {
      alert('未找到待审核版本对象');
      return;
    }

    const imageNote =
      pastedImages.length > 0
        ? `\n\n【📷 附带审核截图与标记 (${pastedImages.length}张)】\n` +
          pastedImages.map((img, i) => `[截图 ${i + 1}](${img})`).join('\n')
        : '';

    if (loggedInRole === 'Agency') {
      if (!agencyContent.trim() && pastedImages.length === 0) {
        alert('请填写省广初审意见内容或粘贴审核截图');
        return;
      }
      const fullContent = (agencyContent.trim() || '（无文字，已附带审核截图说明）') + imageNote;
      dataService.addAgencyReview(content.id, effectiveAssetType, currentVersionObj.id, fullContent);
    } else {
      // Me (GAC International)
      if (outcome === 'Request Revision' && !finalFeedbackContent.trim() && pastedImages.length === 0) {
        alert('选择“需要修改”时，必须填写反馈给达人的 Final Feedback（最终修改要求）或上传截图');
        return;
      }

      const fullMyContent = myReviewContent.trim() ? myReviewContent.trim() + imageNote : imageNote.trim();
      const fullFinalContent = finalFeedbackContent.trim()
        ? finalFeedbackContent.trim() + imageNote
        : imageNote.trim() || '请参照广汽团队修改意见调整';

      if (effectiveAssetType === 'Script') {
        dataService.submitMyScriptReview(
          content.id,
          currentVersionObj.id,
          outcome,
          fullMyContent,
          fullFinalContent
        );
      } else {
        dataService.submitMyVideoReview(
          content.id,
          currentVersionObj.id,
          outcome,
          fullMyContent,
          fullFinalContent
        );
      }
    }

    onSuccess();
    onClose();
  };

  // Apply AI Draft to Form
  const handleApplyAiDraft = () => {
    if (aiAuditResult?.agencyReviewDraft) {
      if (loggedInRole === 'Agency') {
        setAgencyContent(aiAuditResult.agencyReviewDraft);
      } else {
        setMyReviewContent(aiAuditResult.agencyReviewDraft);
        if (aiAuditResult.revisionPoints?.length > 0) {
          setFinalFeedbackContent(aiAuditResult.revisionPoints.join('；\n'));
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-fade-in font-sans">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-7xl h-[94vh] flex flex-col overflow-hidden text-slate-900">
        
        {/* Top Header Bar (Light Mode) */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl shadow-md text-white">
              {effectiveAssetType === 'Video' ? <VideoIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900">{content.title}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {effectiveAssetType === 'Video' ? '视频稿件审核' : '脚本稿件审核'} V{currentVerNumber}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200/80 text-slate-700 border border-slate-300">
                  项目: {campaign?.name || '广汽国际出海营销'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                集成式全屏审核工作台 • {effectiveAssetType === 'Video' ? '成片视频预览与 AI 诊断' : 'AI Agent Brief 匹配诊断与脚本文档查验'} • 广汽国际/省广三方留痕
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Identity Badge - Locked based on login account */}
            <div
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 shadow-sm ${
                loggedInRole === 'Me'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {loggedInRole === 'Me' ? (
                <Shield className="w-4 h-4 text-indigo-600" />
              ) : (
                <Building2 className="w-4 h-4 text-emerald-600" />
              )}
              <span>
                当前视图：
                {loggedInRole === 'Me' ? '广汽国际 (GAC Admin)' : '省广代理商 (Agency)'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-600 font-mono">
                {currentUser?.username || (loggedInRole === 'Me' ? 'gac_admin' : 'agency_user')}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal 3-Column Main Content Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-200 bg-slate-100/50">
          
          {/* LEFT COLUMN (4 Cols): Brief 需求规范与核心要点 (无论脚本还是视频审核均置于左侧首位) + AI 诊断 + 历史修改意见 */}
          <div className="lg:col-span-4 p-4 overflow-y-auto space-y-4 bg-slate-50 custom-scrollbar">
            
            {/* 1. Brief 需求方案与核心要点 (脚本审核阶段不放脚本，视频审核阶段增加 Brief) */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    1. Brief 需求方案与核心要点
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Brief 已核准定稿</span>
                </span>
              </div>

              {/* Creative Direction & Focus (核心诉求与创作建议) */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900">
                  <span className="flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-indigo-600" />
                    专项 Brief 核心诉求与创作建议:
                  </span>
                </div>
                <p className="text-xs text-indigo-950 leading-relaxed font-medium">
                  {content.briefData?.creativeDirection || content.briefText || '重点结合海外用户痛点与智能驾驶体验，突出欧洲五星安全与广汽品质背书。'}
                </p>
              </div>

              {/* Campaign Global Requirement (品牌战役总要求) */}
              {campaign && (
                <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                      <Layers className="w-3.5 h-3.5 text-slate-600" />
                      战役核心传播要求:
                    </span>
                    <span className="text-[10px] text-indigo-600 font-semibold truncate max-w-[150px]">
                      {campaign.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">
                    {campaign.brief || '突出巴黎车展首秀、欧洲五星安全、AION V智驾、3000万台下线品质背书，品牌 Tagline "Go For More"。'}
                  </p>
                </div>
              )}

              {/* Specifications Matrix */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">选题与车型:</span>
                  <span className="font-semibold text-slate-800 text-xs truncate block" title={content.topic}>
                    {content.topic}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">内容形式 & 平台:</span>
                  <span className="font-semibold text-slate-800 text-xs truncate block">
                    {content.category} • {content.platform}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">达人 & 地区:</span>
                  <span className="font-semibold text-slate-800 text-xs truncate block">
                    {kol?.name || '指定达人'} • {content.briefData?.region || '海外市场'}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">预估曝光 / 预算:</span>
                  <span className="font-semibold text-slate-800 text-xs truncate block">
                    {content.briefData?.estimatedViews || '25K+'} • {content.briefData?.collaborationCost ? `¥${content.briefData.collaborationCost}` : '标准采购'}
                  </span>
                </div>
              </div>

              {/* Provided Assets */}
              {content.briefData?.providedAssets && content.briefData.providedAssets.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-slate-500" />
                    官方素材提供清单:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {content.briefData.providedAssets.map((asset, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-medium">
                        {asset}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Brief Online Doc / Table Link */}
              {(content.briefData?.briefDocUrl || content.briefUrl) && (
                <div className="pt-0.5">
                  <a
                    href={content.briefData?.briefDocUrl || content.briefUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-blue-700 text-xs font-bold flex items-center justify-between transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="truncate">查看 Brief 完整提报文档与在线表格</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              )}

              {/* GAC Brief Review Note */}
              {content.briefData?.reviewFeedback && (
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs space-y-0.5">
                  <span className="text-[10px] font-bold text-emerald-800 block">广汽国际 Brief 核准批注:</span>
                  <p className="text-[11px] text-emerald-900 leading-relaxed font-medium">
                    {content.briefData.reviewFeedback}
                  </p>
                </div>
              )}
            </div>

            {/* 视频审核阶段额外提供：定稿脚本对照展开卡片 */}
            {effectiveAssetType === 'Video' && latestScriptVer && (
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm space-y-2">
                <div
                  onClick={() => setShowScriptDrawer(!showScriptDrawer)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    定稿脚本分镜台词参考 (Script V{latestScriptVer.versionNumber})
                  </span>
                  <span className="text-xs text-indigo-600 font-semibold flex items-center gap-0.5">
                    {showScriptDrawer ? '收起' : '展开核对'}
                    {showScriptDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </span>
                </div>

                {showScriptDrawer && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 animate-in fade-in duration-150">
                    {latestScriptVer.fileUrl && (
                      <a
                        href={latestScriptVer.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] border border-indigo-200 flex items-center justify-between transition-colors"
                      >
                        <span className="truncate">打开定稿 Word 脚本文档</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    )}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] font-mono text-slate-800 max-h-40 overflow-y-auto leading-relaxed custom-scrollbar whitespace-pre-wrap">
                      {latestScriptVer.scriptText || '（暂无详细脚本文本）'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. 之前的修改意见历史 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-amber-600" />
                  2. 之前的修改意见历史
                </span>
                <span className="text-[11px] text-slate-500 font-medium">共 {reviews.length} 条记录</span>
              </div>

              <div className="space-y-2 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                {reviews.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs italic bg-slate-50 rounded-lg border border-slate-100">
                    暂无历史修改意见记录
                  </div>
                ) : (
                  reviews
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map((rev) => {
                      const dateLabel = formatReviewDate(rev.createdAt);
                      const isAgency = rev.reviewerType === 'Agency';
                      const isMe = rev.reviewerType === 'Me';

                      const roleLabel = isAgency
                        ? '省广'
                        : isMe
                        ? '我/广汽国际'
                        : '最终修改要求';

                      const tagColor = isAgency
                        ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                        : isMe
                        ? 'bg-indigo-50 text-indigo-800 border-indigo-300 font-bold'
                        : 'bg-rose-50 text-rose-800 border-rose-300 font-bold';

                      return (
                        <div
                          key={rev.id}
                          className="bg-slate-50/80 border border-slate-200/90 rounded-lg p-2.5 text-xs space-y-1 hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center justify-between text-[11px] font-semibold">
                            <span className={`px-2 py-0.5 rounded text-[10px] border ${tagColor}`}>
                              {dateLabel} {roleLabel}：
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {rev.createdAt?.slice(11, 16)}
                            </span>
                          </div>
                          <p className="text-slate-800 font-medium pl-1 leading-relaxed">
                            {cleanText(rev.reviewContent)}
                          </p>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* 3. AI Agent 与 Brief 匹配诊断结果 */}
            <div className="bg-gradient-to-br from-cyan-50/80 via-sky-50/50 to-indigo-50/40 border border-cyan-200 rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-cyan-200/60 pb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-600 animate-pulse" />
                  3. AI Agent 与 Brief 匹配诊断
                </span>
                <button
                  type="button"
                  onClick={handleRunAiAudit}
                  disabled={isAiLoading}
                  className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                >
                  <Zap className="w-3 h-3" />
                  <span>{isAiLoading ? '分析中...' : '重新运行 AI Agent 诊断'}</span>
                </button>
              </div>

              {!aiAuditResult ? (
                <div className="p-3 bg-white/80 rounded-xl border border-cyan-200/80 text-center space-y-2">
                  <p className="text-xs text-slate-600">
                    点击下方按钮，由 AI Agent 严格逐项比对{effectiveAssetType === 'Video' ? '视频成片/字幕' : '脚本正文'}与 Campaign Brief 的契合程度与缺失点
                  </p>
                  <button
                    type="button"
                    onClick={handleRunAiAudit}
                    className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold shadow transition-all cursor-pointer"
                  >
                    立即运行 AI Agent 匹配诊断
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 animate-in fade-in duration-200 text-xs">
                  <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-cyan-200 shadow-sm">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-base text-white shadow-md ${
                        aiAuditResult.overallPass ? 'bg-emerald-600' : 'bg-amber-600'
                      }`}
                    >
                      {aiAuditResult.score}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 text-xs">
                        Brief 契合度: {aiAuditResult.overallPass ? '✅ 符合广汽出海要求' : '⚠️ 部分卖点需强化'}
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{aiAuditResult.summary}</p>
                    </div>
                  </div>

                  {/* Selling Points Badges */}
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    {aiAuditResult.sellingPointsCheck?.slice(0, 4).map((sp: any, idx: number) => (
                      <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between shadow-2xs">
                        <span className="text-slate-800 font-medium truncate max-w-[90px]">{sp.point}</span>
                        <span className={`px-1.5 py-0.2 rounded font-bold ${sp.status?.includes('已') ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'}`}>
                          {sp.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Revision Points */}
                  {aiAuditResult.revisionPoints?.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        系统判定优化点建议:
                      </span>
                      <ul className="text-[11px] text-amber-800 space-y-0.5 list-disc pl-3.5">
                        {aiAuditResult.revisionPoints.map((pt: string, i: number) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleApplyAiDraft}
                    className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>自动将 AI 初审意见填入右侧审核框</span>
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* MIDDLE COLUMN (5 Cols): 最新版本视频播放器或脚本正文与 Word 附件 */}
          <div className="lg:col-span-5 p-4 overflow-y-auto space-y-4 bg-slate-100/60 flex flex-col justify-between custom-scrollbar">
            <div className="space-y-3 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  {effectiveAssetType === 'Video' ? (
                    <PlayCircle className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <FileText className="w-4 h-4 text-blue-600" />
                  )}
                  <span>
                    {effectiveAssetType === 'Video'
                      ? `最新版本成片视频播放器 (Video V${currentVerNumber})`
                      : `最新版本脚本正文与 Word 附件 (Script V${currentVerNumber})`}
                  </span>
                </span>
                <span className="px-2.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-mono font-bold">
                  {effectiveAssetType === 'Video' ? '4K / 1080P 高清原片预览' : 'Word / DOCX 结构化解析'}
                </span>
              </div>

              {/* Video Player or Script Text Box */}
              {effectiveAssetType === 'Video' ? (
                <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-300 shadow-xl aspect-video flex items-center justify-center group">
                  <video
                    src={latestVideoVer?.videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-car-driving-on-a-road-at-sunset-41221-large.mp4'}
                    controls
                    className="w-full h-full object-cover"
                    poster="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80"
                  />
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex-1 flex flex-col space-y-3 shadow-sm min-h-[360px]">
                  {/* Direct Open Document Link if fileUrl exists */}
                  {latestScriptVer?.fileUrl ? (
                    <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-xl flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-950 truncate">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="truncate">Word 脚本文档附件：{latestScriptVer.fileUrl.split('/').pop() || '脚本文档.docx'}</span>
                      </div>
                      <a
                        href={latestScriptVer.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm transition-colors shrink-0 flex items-center gap-1"
                      >
                        <span>直接打开文档</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                      <span>省广/达人已直接在系统录入完整脚本正文，格式已按分镜结构化解析：</span>
                    </div>
                  )}

                  <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 overflow-y-auto leading-relaxed custom-scrollbar whitespace-pre-wrap">
                    {latestScriptVer?.scriptText || '暂无详细脚本文本，请要求达人更新。'}
                  </div>
                </div>
              )}

              {/* File Info Banner */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs shadow-2xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">版本提交时间:</span>
                  <span className="font-mono text-slate-900 font-semibold">
                    {currentVersionObj?.submittedAt || '2026-08-12 10:30'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">
                    {effectiveAssetType === 'Video' ? 'CDN 视频存储节点:' : '云端文档存储节点:'}
                  </span>
                  <span className="font-mono text-blue-700 font-semibold truncate block">
                    {effectiveAssetType === 'Video'
                      ? `GAC-Global-CDN/v${currentVerNumber}/master.mp4`
                      : `GAC-Cloud-Docs/v${currentVerNumber}/${latestScriptVer?.fileUrl?.split('/').pop() || 'script_v1.docx'}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (3 Cols): 根据真实登录身份严格限制表单 */}
          <div className="lg:col-span-3 p-4 overflow-y-auto bg-white space-y-4 border-l border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                {loggedInRole === 'Agency' ? (
                  <>
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    省广初审意见录入
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    广汽国际终审裁决
                  </>
                )}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  loggedInRole === 'Agency'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                }`}
              >
                {loggedInRole === 'Agency' ? '省广账号仅限省广操作' : '广汽国际账号终审'}
              </span>
            </div>

            {/* Context Notice if Task owner is different */}
            {loggedInRole === 'Agency' && content.currentOwner === 'Me' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1 text-amber-800">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  当前处于【等待广汽国际审核】阶段
                </div>
                <p className="text-[11px] text-amber-700">
                  只有登录广汽国际账号才能提交终审裁决。您当前为省广账号，可录入补充意见供广汽国际参考。
                </p>
              </div>
            )}

            {loggedInRole === 'Me' && content.currentOwner === 'Agency' && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1 text-indigo-800">
                  <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  当前处于【等待省广初审】阶段
                </div>
                <p className="text-[11px] text-indigo-700">
                  省广暂未提交初审。您作为广汽国际可直接进行提前裁决通过，或等待省广初审意见。
                </p>
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* If Logged In as GAC International (Me) */}
              {loggedInRole === 'Me' ? (
                <>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-900">审核结论 Decision *</label>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => setOutcome('Approve')}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                          outcome === 'Approve'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/30 font-bold'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <CheckCircle2
                          className={`w-4.5 h-4.5 shrink-0 ${
                            outcome === 'Approve' ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900">审核通过 (Approve)</div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            {effectiveAssetType === 'Script' ? '通过脚本，流转至视频拍摄' : '通过视频，可安排上线发布'}
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOutcome('Request Revision')}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                          outcome === 'Request Revision'
                            ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/30 font-bold'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <AlertTriangle
                          className={`w-4.5 h-4.5 shrink-0 ${
                            outcome === 'Request Revision' ? 'text-amber-600' : 'text-slate-400'
                          }`}
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900">需要修改 (Request Revision)</div>
                          <div className="text-[10px] text-slate-500 font-normal">退回并生成要求，交由省广督促修改</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-900">广汽国际团队内部意见</label>
                      <textarea
                        rows={3}
                        placeholder="记录广汽国际团队内部审核判定要点（支持 Ctrl+V 粘贴截图）..."
                        value={myReviewContent}
                        onChange={(e) => setMyReviewContent(e.target.value)}
                        onPaste={handlePasteImage}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 font-sans"
                      />
                    </div>

                    {outcome === 'Request Revision' && (
                      <div className="space-y-1.5 animate-in fade-in duration-150">
                        <label className="block text-xs font-bold text-amber-800">
                          最终修改反馈意见 (发给省广转达达人) *
                        </label>
                        <textarea
                          rows={4}
                          placeholder="标注需达人修改的具体条目（支持 Ctrl+V 粘贴截图）..."
                          value={finalFeedbackContent}
                          onChange={(e) => setFinalFeedbackContent(e.target.value)}
                          onPaste={handlePasteImage}
                          className="w-full px-3 py-2 text-xs bg-amber-50/80 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-900 font-sans"
                          required
                        />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* If Logged In as Agency (省广代理商) */
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-emerald-900">省广代理商初审意见内容 *</label>
                    <textarea
                      rows={6}
                      placeholder="请输入省广初审意见，按 Ctrl+V 可直接粘贴剪贴板截图..."
                      value={agencyContent}
                      onChange={(e) => setAgencyContent(e.target.value)}
                      onPaste={handlePasteImage}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 leading-relaxed font-sans"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Screenshot Upload / Paste Attachment Area */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1">
                    <span>📷 审核修改截图/标记图附件 ({pastedImages.length}张)</span>
                  </span>
                  <label className="px-2.5 py-1 bg-white hover:bg-slate-100 text-indigo-700 border border-slate-300 rounded-lg text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-2xs">
                    <span>+ 上传截图</span>
                    <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                <div className="text-[10px] text-slate-500">
                  💡 提示：也可以在上方输入框内直接按 <kbd className="bg-white border px-1 rounded font-mono">Ctrl+V</kbd> / <kbd className="bg-white border px-1 rounded font-mono">Cmd+V</kbd> 粘贴剪贴板中的图片
                </div>

                {pastedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {pastedImages.map((imgUrl, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-300 bg-black aspect-square">
                        <img src={imgUrl} alt={`screenshot-${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow transition-transform group-hover:scale-110"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Hint Footer */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                {loggedInRole === 'Agency' ? (
                  <span>
                    💡 省广提交后，任务状态将变更为 <strong className="text-slate-900">等待广汽国际审核</strong>，并在左侧历史增加一条记录。
                  </span>
                ) : (
                  <span>
                    💡 广汽国际提交裁决后，结果将即时穿透并通知省广代理商转达。
                  </span>
                )}
              </div>

              {/* Submit Button - Locked to current role */}
              <div className="pt-2">
                <button
                  type="submit"
                  className={`w-full py-3 rounded-xl text-xs font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    loggedInRole === 'Agency'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : outcome === 'Approve'
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                      : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {loggedInRole === 'Agency'
                      ? '提交省广意见并移交广汽国际审核'
                      : outcome === 'Approve'
                      ? '提交广汽国际终审通过 (Approve)'
                      : '提交广汽国际修改要求 (Request Revision)'}
                  </span>
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
