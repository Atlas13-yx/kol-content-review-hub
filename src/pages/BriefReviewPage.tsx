import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { ContentItem, Campaign, KOL, Platform, ContentCategory, InitiationCandidate, UserRole } from '../types';
import {
  FileText,
  Search,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Building2,
  Clock,
  Check,
  Eye,
  AlertCircle,
  FileCheck,
  Send,
  ChevronRight,
  BookOpen,
  Plus,
  FileSpreadsheet,
  Layers,
  Package,
  TrendingUp,
  RotateCcw,
  Edit3,
  Download,
  Shield,
  Video,
  Share2,
  FileDown,
  Info,
  Upload,
  AlertTriangle,
  Trash2,
  Sliders,
  Filter,
  CheckSquare,
  Square,
  FileCode,
  ArrowUpRight,
  ListFilter
} from 'lucide-react';
import { ContentInlineProgressBar } from '../components/ContentProgressBar';
import { NewContentModal } from '../components/NewContentModal';
import { UploadBriefModal } from '../components/UploadBriefModal';
import { AiBriefAuditModal } from '../components/AiBriefAuditModal';
import { AiTableInitiationAgentModal } from '../components/AiTableInitiationAgentModal';
import {
  downloadStandardBriefExcelTemplate,
  downloadCsvTemplate,
  parseExcelOrCsvFile,
  parsePastedTableText,
  mapRawRowsToCandidates,
  INITIATION_TEMPLATE_COLUMNS,
  SAMPLE_INITIATION_DATA,
} from '../utils/excelTemplate';

interface BriefReviewPageProps {
  onNavigate: (page: string, params?: { id?: string }) => void;
}

export const BriefReviewPage: React.FC<BriefReviewPageProps> = ({ onNavigate }) => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [kols, setKols] = useState<KOL[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>(dataService.getCurrentRole());

  // Main Page Level Tab: 'review-revisions' (有需要修改/待审核的 Brief) vs 'batch-initiation' (上传批量立项)
  const [activeMainTab, setActiveMainTab] = useState<'review-revisions' | 'batch-initiation'>('review-revisions');

  // Sub-filter for Review & Revisions tab: 'all' | 'needs-revision' | 'waiting-approval' | 'drafts'
  const [reviewSubFilter, setReviewSubFilter] = useState<'all' | 'needs-revision' | 'waiting-approval' | 'drafts'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');

  // Modals state
  const [isAiAgentModalOpen, setIsAiAgentModalOpen] = useState(false);
  const [isNewContentOpen, setIsNewContentOpen] = useState(false);
  const [editingBriefContent, setEditingBriefContent] = useState<ContentItem | null>(null);
  const [aiAuditContent, setAiAuditContent] = useState<ContentItem | null>(null);
  const [confirmModalItem, setConfirmModalItem] = useState<ContentItem | null>(null);
  const [confirmNotes, setConfirmNotes] = useState('');
  const [rejectModalItem, setRejectModalItem] = useState<ContentItem | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState('');

  // Batch Initiation In-Page states
  const [batchInputMode, setBatchInputMode] = useState<'upload' | 'paste'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedCandidates, setParsedCandidates] = useState<InitiationCandidate[]>([]);
  const [batchCampaignId, setBatchCampaignId] = useState<string>('');
  const [isBatchSubmitting, setIsBatchSubmitting] = useState<boolean>(false);
  const [batchSubmitSuccessMsg, setBatchSubmitSuccessMsg] = useState<string | null>(null);

  // Selection in draft list for quick batch submit
  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);

  const loadData = () => {
    const allContents = dataService.getContents();
    const briefTasks = allContents.filter((c) => c.stage === 'Brief');
    setContents(briefTasks);
    const camps = dataService.getCampaigns();
    setCampaigns(camps);
    if (!batchCampaignId && camps.length > 0) {
      setBatchCampaignId(camps[0].id);
    }
    setKols(dataService.getKols());
    setCurrentRole(dataService.getCurrentRole());
  };

  useEffect(() => {
    loadData();
    return dataService.subscribe(loadData);
  }, []);

  const getCampaignName = (id: string) => {
    return campaigns.find((c) => c.id === id)?.name || id;
  };

  const getKol = (id: string) => {
    return kols.find((k) => k.id === id);
  };

  // Identify items that need revision: has review feedback from GAC, or status is Brief Draft with feedback
  const isItemNeedingRevision = (item: ContentItem) => {
    const hasFeedback = Boolean(item.briefData?.reviewFeedback?.trim());
    const isNotesRevision = Boolean(item.notes?.includes('退回') || item.notes?.includes('修改意见'));
    const isDraft = item.status === 'Brief Draft';
    return (hasFeedback || isNotesRevision) && isDraft;
  };

  // Counts
  const revisionCount = contents.filter(isItemNeedingRevision).length;
  const waitingApprovalCount = contents.filter((c) => c.status === 'Waiting for Brief Approval').length;
  const draftCount = contents.filter((c) => c.status === 'Brief Draft').length;

  // Filter tasks for the Review & Revisions tab
  const filteredTasks = contents.filter((task) => {
    if (selectedCampaignId !== 'all' && task.campaignId !== selectedCampaignId) {
      return false;
    }
    if (reviewSubFilter === 'needs-revision') {
      if (!isItemNeedingRevision(task)) return false;
    } else if (reviewSubFilter === 'waiting-approval') {
      if (task.status !== 'Waiting for Brief Approval') return false;
    } else if (reviewSubFilter === 'drafts') {
      if (task.status === 'Waiting for Brief Approval') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const kol = getKol(task.kolId);
      const campName = getCampaignName(task.campaignId).toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchTopic = task.topic.toLowerCase().includes(q);
      const matchKol = kol?.name.toLowerCase().includes(q);
      const matchCreative = task.briefData?.creativeDirection?.toLowerCase().includes(q);
      const matchFeedback = task.briefData?.reviewFeedback?.toLowerCase().includes(q);
      return matchTitle || matchTopic || matchKol || matchCreative || Boolean(matchFeedback) || campName.includes(q);
    }
    return true;
  });

  const handleApproveBrief = (task: ContentItem) => {
    setConfirmModalItem(task);
    const nextStageName = task.category === '直发' ? '4. 视频审核 (Video Review)' : '3. 脚本审核 (Script Review)';
    setConfirmNotes(
      `广汽国际审核意见：同意通过此 Brief！切入点兼具传播热度与智造硬核实力，请按此 Brief 推进达人交付（${nextStageName}）。`
    );
  };

  const handleConfirmAdvanceToScript = () => {
    if (!confirmModalItem) return;
    dataService.approveBrief(confirmModalItem.id, confirmNotes, currentRole === 'Me' ? 'Me' : 'Agency');
    setConfirmModalItem(null);
    setConfirmNotes('');
    loadData();
  };

  const handleQuickSubmitToGac = (task: ContentItem) => {
    if (!task.briefData) {
      setEditingBriefContent(task);
      return;
    }
    dataService.submitBrief(task.id, task.briefData, 'Agency');
    loadData();
  };

  const handleRequestRevision = (task: ContentItem) => {
    setRejectModalItem(task);
    setRejectFeedback('请在 Brief 中进一步明确达人开篇抓人 Hook 与 3000 万对比口播细节。');
  };

  const handleConfirmRejectBrief = () => {
    if (!rejectModalItem || !rejectFeedback.trim()) return;
    dataService.requestBriefRevision(rejectModalItem.id, rejectFeedback.trim(), currentRole === 'Me' ? 'Me' : 'Agency');
    setRejectModalItem(null);
    setRejectFeedback('');
    loadData();
  };

  // Batch Initiation Actions in Page
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setParseError(null);
    }
  };

  const handleLoadDemoData = () => {
    const headers = Object.keys(SAMPLE_INITIATION_DATA[0]);
    const lines = [headers.join('\t')];
    SAMPLE_INITIATION_DATA.forEach((row) => {
      lines.push(headers.map((h) => (row as any)[h] ?? '').join('\t'));
    });
    const sampleText = lines.join('\n');
    setPastedText(sampleText);
    setBatchInputMode('paste');
    setParseError(null);
  };

  const handleParseBatchData = async () => {
    setIsParsing(true);
    setParseError(null);
    try {
      let rawRows: any[] = [];
      if (batchInputMode === 'upload') {
        if (!uploadedFile) {
          throw new Error('请先选择或拖拽上传 Excel / CSV 文件！');
        }
        rawRows = await parseExcelOrCsvFile(uploadedFile);
      } else {
        if (!pastedText.trim()) {
          throw new Error('请先粘贴包含表头的表格数据！');
        }
        rawRows = parsePastedTableText(pastedText);
      }

      if (!rawRows || rawRows.length === 0) {
        throw new Error('未识别到有效的表格数据行，请检查表格格式或下载标准模板。');
      }

      const defaultCamp = campaigns.find((c) => c.id === batchCampaignId) || campaigns[0];
      const orderedCampaigns = defaultCamp
        ? [defaultCamp, ...campaigns.filter((campaign) => campaign.id !== defaultCamp.id)]
        : campaigns;
      const parsed = mapRawRowsToCandidates(rawRows, orderedCampaigns, kols);
      if (parsed.length === 0) {
        throw new Error('未能匹配到符合条件的立项行，请确保包含必填项（达人姓名/账号、合作模式、平台）。');
      }

      setParsedCandidates(parsed);
      setBatchSubmitSuccessMsg(null);
    } catch (err: any) {
      setParseError(err.message || '解析失败，请检查表格内容');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmBatchCreation = (submitDirectlyToGac: boolean) => {
    setParseError(null);
    const selectedItems = parsedCandidates.filter((c) => c.selected);
    if (selectedItems.length === 0) {
      setParseError('请至少勾选一条需要立项的达人 Brief 记录！');
      return;
    }

    setIsBatchSubmitting(true);
    try {
      const created = dataService.batchAddContents(selectedItems, currentRole);

      // If requested direct submission to GAC
      if (submitDirectlyToGac) {
        created.forEach((cnt) => {
          if (cnt.briefData) {
            dataService.submitBrief(cnt.id, cnt.briefData, 'Agency');
          }
        });
      }

      setBatchSubmitSuccessMsg(`🎉 成功批量立项 ${created.length} 条 Brief 任务！${submitDirectlyToGac ? '已一键直接提报给广汽国际审核。' : '已保存为省广待完善草稿。'}`);
      setParsedCandidates([]);
      setUploadedFile(null);
      setPastedText('');
      loadData();
      setIsBatchSubmitting(false);
    } catch (err: any) {
      setParseError('批量立项失败：' + (err.message || '未知错误'));
      setIsBatchSubmitting(false);
    }
  };

  // Quick batch submit selected drafts from draft list
  const handleBulkSubmitDrafts = () => {
    if (selectedDraftIds.length === 0) return;
    selectedDraftIds.forEach((id) => {
      const task = contents.find((c) => c.id === id);
      if (task && task.briefData) {
        dataService.submitBrief(task.id, task.briefData, 'Agency');
      }
    });
    setSelectedDraftIds([]);
    loadData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Brief 提报与审核流转 (Brief Review)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {contents.length} 个 Brief 任务
                </span>
                {revisionCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>{revisionCount} 个需修改</span>
                  </span>
                )}
                {waitingApprovalCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {waitingApprovalCount} 个待广汽审核
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                清晰区分【批量上传与立项】与【需修改 / 待审核 Brief】两个专区，实现高效立项与精准流转。
              </p>
            </div>
          </div>
        </div>

        {/* Identity & Top Fast Triggers */}
        <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2 text-slate-700 font-medium shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              当前身份：
              <strong className="text-slate-900 font-bold">
                {currentRole === 'Me' ? '广汽国际 (Me)' : '省广代理商 (Agency)'}
              </strong>
            </span>
          </div>

          <button
            type="button"
            onClick={downloadStandardBriefExcelTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200/90 shadow-2xs transition-all cursor-pointer"
            title="下载标准表格模板 (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>下载标准模板</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewContentOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-900/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新建单条 Brief</span>
          </button>
        </div>
      </div>

      {/* Main Mode Tabs Switcher: Distinct separation between Bulk Upload/Initiation and Review/Revisions */}
      <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveMainTab('review-revisions')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeMainTab === 'review-revisions'
              ? 'bg-white text-indigo-900 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span>Brief 审核与修改流转区</span>
          <div className="flex items-center gap-1.5 ml-1">
            {revisionCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                {revisionCount} 需修改
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700">
              {contents.length}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('batch-initiation')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeMainTab === 'batch-initiation'
              ? 'bg-white text-indigo-900 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-purple-600" />
          <span>上传与批量立项工作区 (Excel 导入)</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700">
            AI 智能解析
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: BRIEF REVIEW & REVISIONS WORKSPACE            */}
      {/* ======================================================== */}
      {activeMainTab === 'review-revisions' && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => setReviewSubFilter('needs-revision')}
              className={`bg-white border rounded-2xl p-4 shadow-2xs cursor-pointer transition-all ${
                reviewSubFilter === 'needs-revision'
                  ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/20'
                  : 'border-slate-200 hover:border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-rose-700 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>有需要修改的 Brief</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                  高优先级
                </span>
              </div>
              <div className="text-2xl font-black text-rose-600 mt-1 font-mono">
                {revisionCount}
              </div>
              <div className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                <span>广汽提出修改批注，省广需调整完善</span>
              </div>
            </div>

            <div
              onClick={() => setReviewSubFilter('waiting-approval')}
              className={`bg-white border rounded-2xl p-4 shadow-2xs cursor-pointer transition-all ${
                reviewSubFilter === 'waiting-approval'
                  ? 'border-indigo-400 ring-2 ring-indigo-200 bg-indigo-50/20'
                  : 'border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="text-xs font-semibold text-slate-500">待广汽国际审核 Brief</div>
              <div className="text-2xl font-black text-indigo-600 mt-1 font-mono">
                {waitingApprovalCount}
              </div>
              <div className="text-[11px] text-indigo-600 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>省广已提报，等待广汽国际核准</span>
              </div>
            </div>

            <div
              onClick={() => setReviewSubFilter('drafts')}
              className={`bg-white border rounded-2xl p-4 shadow-2xs cursor-pointer transition-all ${
                reviewSubFilter === 'drafts'
                  ? 'border-amber-400 ring-2 ring-amber-200 bg-amber-50/20'
                  : 'border-slate-200 hover:border-amber-300'
              }`}
            >
              <div className="text-xs font-semibold text-slate-500">省广待完善草稿</div>
              <div className="text-2xl font-black text-amber-600 mt-1 font-mono">
                {draftCount}
              </div>
              <div className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                <Edit3 className="w-3 h-3" />
                <span>草稿完善中，尚未提交广汽</span>
              </div>
            </div>

            <div
              onClick={() => setReviewSubFilter('all')}
              className={`bg-white border rounded-2xl p-4 shadow-2xs cursor-pointer transition-all ${
                reviewSubFilter === 'all'
                  ? 'border-slate-400 ring-2 ring-slate-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-xs font-semibold text-slate-500">下一流转环节</div>
              <div className="text-sm font-bold text-indigo-700 mt-2 flex items-center gap-1.5">
                <span>3. 脚本审核 / 4. 视频审核</span>
                <ArrowRight className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">广汽核准后达人方可开始创作交付</div>
            </div>
          </div>

          {/* Sub Filter Chips & Search Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Category Filter Chips */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setReviewSubFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    reviewSubFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  全部 Brief ({contents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewSubFilter('needs-revision')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    reviewSubFilter === 'needs-revision'
                      ? 'bg-rose-600 text-white shadow-2xs font-bold'
                      : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>有需要修改 ({revisionCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewSubFilter('waiting-approval')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    reviewSubFilter === 'waiting-approval'
                      ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>待广汽审核 ({waitingApprovalCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewSubFilter('drafts')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    reviewSubFilter === 'drafts'
                      ? 'bg-amber-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  省广草稿 ({draftCount})
                </button>
              </div>

              {/* Campaign Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="all">全部 Campaign ({contents.length})</option>
                  {campaigns.map((camp) => (
                    <option key={camp.id} value={camp.id}>
                      {camp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索 Brief 标题、达人、诉求或修改意见..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>
          </div>

          {/* Cards List */}
          {filteredTasks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                {reviewSubFilter === 'needs-revision'
                  ? '当前没有需要修改的 Brief 任务'
                  : '未找到符合条件的 Brief 审核任务'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {reviewSubFilter === 'needs-revision'
                  ? '所有 Brief 均已进入正常流转或已通过广汽审核。如需新建任务，请切换到【上传与批量立项工作区】。'
                  : '可通过上方【上传与批量立项工作区】导入表格或点击新建单条 Brief。'}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveMainTab('batch-initiation')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>前往上传批量立项工作区</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredTasks.map((task) => {
                const kol = getKol(task.kolId);
                const campaignName = getCampaignName(task.campaignId);
                const bd = task.briefData || {};
                const isNeedsRevision = isItemNeedingRevision(task);
                const isWaitingGac = task.status === 'Waiting for Brief Approval';
                const isDirectPost = task.category === '直发';

                const hasAddonRights = Boolean(
                  bd.tier ||
                  bd.socialMediaUrl ||
                  bd.resourceType ||
                  bd.videoOrLive ||
                  bd.portraitAuthDuration ||
                  bd.canTeaserVideo ||
                  bd.canTestimonial ||
                  bd.canSecondaryCreation ||
                  bd.canProvideRawFootage ||
                  bd.canPinLinkOrMention ||
                  bd.canProvideAdCode ||
                  bd.audiencePersona ||
                  bd.feedback ||
                  bd.remarks
                );

                return (
                  <div
                    key={task.id}
                    className={`bg-white border rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all space-y-4 ${
                      isNeedsRevision
                        ? 'border-rose-300 ring-2 ring-rose-100/80 bg-gradient-to-b from-rose-50/30 to-white'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* TOP PROMINENT REVISION ALERT BOX IF NEEDS REVISION */}
                    {isNeedsRevision && (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs shadow-2xs">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <AlertCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-rose-900 flex items-center gap-2">
                              <span>广汽国际审核退回 · 需补充/修改 Brief</span>
                              <span className="px-2 py-0.5 rounded text-[10px] bg-rose-200/80 text-rose-900 font-black">
                                待省广修改
                              </span>
                            </div>
                            <div className="text-rose-800 mt-1 leading-relaxed font-medium whitespace-pre-line">
                              {bd.reviewFeedback || task.notes || '请根据广汽国际评审意见调整创作方向、补充素材清单并重新提报。'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => setEditingBriefContent(task)}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>立即修改 Brief</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Top Row: Campaign & Title & Actions */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {campaignName}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              task.category === '二创'
                                ? 'bg-purple-100 text-purple-800'
                                : task.category === '直发'
                                ? 'bg-emerald-100 text-emerald-800 font-bold'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {task.category || '原创'}
                            {isDirectPost && ' (免脚本)'}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {task.platform}
                          </span>
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                              isNeedsRevision
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : isWaitingGac
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {isNeedsRevision
                              ? '退回需修改 (Revision Required)'
                              : isWaitingGac
                              ? '待广汽国际审核 Brief'
                              : '省广待完善 / 草稿'}
                          </span>
                        </div>

                        <h3
                          onClick={() => onNavigate('content-detail', { id: task.id })}
                          className="text-base font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors pt-0.5 flex items-center gap-2"
                        >
                          <span>{task.title}</span>
                        </h3>
                      </div>

                      {/* Flow Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => setAiAuditContent(task)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                          <span>AI 智能诊断</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingBriefContent(task)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          <span>编辑 Brief</span>
                        </button>

                        {currentRole === 'Me' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRequestRevision(task)}
                              className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                            >
                              退回修改
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveBrief(task)}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-900/20 transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>
                                {isDirectPost ? '核准 Brief · 直通视频' : '核准 Brief · 推进至脚本'}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleQuickSubmitToGac(task)}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-900/20 transition-all cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>
                              {isNeedsRevision
                                ? '修改完成并重新提报'
                                : isWaitingGac
                                ? '重新提报给广汽'
                                : '确认提报给广汽审核'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Structured Brief Data Panel */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                      {/* Row 1: KOL Metrics Chips */}
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                          <span className="text-[10px] text-slate-400 font-semibold block">达人 ID / 账号</span>
                          <span className="font-bold text-slate-900 truncate block">
                            {kol?.name || 'serjcraft'}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                          <span className="text-[10px] text-slate-400 font-semibold block">粉丝量 / 量级</span>
                          <span className="font-bold text-slate-900 truncate block">
                            {bd.followersCount || kol?.followers || '63,000'} ({bd.tier || '中腰部'})
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                          <span className="text-[10px] text-slate-400 font-semibold block">地区 / 类型</span>
                          <span className="font-bold text-slate-900 truncate block">
                            {bd.region || '俄罗斯'} · {bd.accountCategory || '汽车'}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                          <span className="text-[10px] text-slate-400 font-semibold block">合作费用预算</span>
                          <span className="font-bold font-mono text-indigo-700">
                            ¥{bd.collaborationCost !== undefined ? bd.collaborationCost : 15000}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                          <span className="text-[10px] text-slate-400 font-semibold block">预估播放 / 互动</span>
                          <span className="font-bold font-mono text-emerald-700">
                            {bd.estimatedViews || '25000+'} / {bd.estimatedEngagements || '500+'}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                          <span className="text-[10px] text-slate-400 font-semibold block">预估 CPC</span>
                          <span className="font-bold font-mono text-cyan-700">
                            ¥{bd.estimatedCpc !== undefined ? bd.estimatedCpc : '0.60'}
                          </span>
                        </div>
                      </div>

                      {/* Row 2: Creative Direction */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-indigo-600" />
                            创作建议与核心诉求 (Creative Direction)：
                          </span>
                          {bd.briefDocUrl && (
                            <a
                              href={bd.briefDocUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 text-[11px]"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>查看在线 Brief 表格附件</span>
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200/60 leading-relaxed font-sans whitespace-pre-line">
                          {bd.creativeDirection || task.briefText || '重点以中国制造产业深度解析，汽车工厂便携溯源、区域市场产品力反差对比为切入视角，自然植入广汽国际全球化出海布局、智能制造硬核实力与全球市场产品竞争力。'}
                        </p>
                      </div>

                      {/* Row 3: Add-on Rights & Collaboration Terms */}
                      {hasAddonRights && (
                        <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-3 space-y-1.5">
                          <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5 text-purple-600" />
                            附加合作权益与交付细则：
                          </span>
                          <div className="flex flex-wrap gap-1.5 text-[11px]">
                            {bd.resourceType && (
                              <span className="px-2 py-0.5 rounded bg-white text-purple-800 border border-purple-200 font-medium">
                                资源: {bd.resourceType}
                              </span>
                            )}
                            {bd.portraitAuthDuration && (
                              <span className="px-2 py-0.5 rounded bg-white text-purple-800 border border-purple-200 font-medium">
                                肖像授权: {bd.portraitAuthDuration}
                              </span>
                            )}
                            {bd.canProvideAdCode && (
                              <span className="px-2 py-0.5 rounded bg-white text-purple-800 border border-purple-200 font-medium">
                                投流授权: {bd.canProvideAdCode}
                              </span>
                            )}
                            {bd.canSecondaryCreation === '是' && (
                              <span className="px-2 py-0.5 rounded bg-white text-emerald-800 border border-emerald-200 font-medium">
                                ✓ 授权二剪二创
                              </span>
                            )}
                            {bd.canProvideRawFootage === '是' && (
                              <span className="px-2 py-0.5 rounded bg-white text-emerald-800 border border-emerald-200 font-medium">
                                ✓ 网盘原片交付
                              </span>
                            )}
                            {bd.canPinLinkOrMention === '是' && (
                              <span className="px-2 py-0.5 rounded bg-white text-indigo-800 border border-indigo-200 font-medium">
                                ✓ 圈官号/挂车型Link
                              </span>
                            )}
                            {bd.canTeaserVideo === '是' && (
                              <span className="px-2 py-0.5 rounded bg-white text-blue-800 border border-blue-200 font-medium">
                                ✓ 可发预热视频
                              </span>
                            )}
                            {bd.canTestimonial === '是' && (
                              <span className="px-2 py-0.5 rounded bg-white text-blue-800 border border-blue-200 font-medium">
                                ✓ 可配合证言
                              </span>
                            )}
                            {bd.audiencePersona && (
                              <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                                受众: {bd.audiencePersona}
                              </span>
                            )}
                            {bd.feedback && (
                              <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                                达人反馈: {bd.feedback}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Row 4: Provided Assets */}
                      {Array.isArray(bd.providedAssets) && bd.providedAssets.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                            <Package className="w-3.5 h-3.5 text-emerald-600" />
                            提供素材包清单：
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {bd.providedAssets.map((asset, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                              >
                                ✓ {asset}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Row 5: Submission Metadata */}
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <div>
                          <strong>提报方：</strong> {bd.submittedBy || '省广营销集团 GIMC'} (
                          {bd.submittedAt || '已提报'})
                        </div>
                        <div>
                          <strong>截稿交付：</strong> {task.deadline || '2026-08-28'}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-1">
                      <ContentInlineProgressBar content={task} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: BATCH UPLOAD & INITIATION WORKSPACE           */}
      {/* ======================================================== */}
      {activeMainTab === 'batch-initiation' && (
        <div className="space-y-6">
          {/* Top Banner Guide for Batch Initiation */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <span>Excel 表格批量立项与 AI 自动解析工作区</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                      Batch Initiation Hub
                    </span>
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    支持下载海外营销标准 Excel 模板，上传或粘贴多行达人采购与 Brief 诉求表格，由 AI 自动解析并一键批量建立项目。
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={downloadStandardBriefExcelTemplate}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>下载标准 Excel 模板</span>
                </button>
                <button
                  type="button"
                  onClick={downloadCsvTemplate}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>下载 CSV 模板</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAiAgentModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>打开全屏弹窗解析器</span>
                </button>
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {batchSubmitSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-900 text-xs font-bold animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{batchSubmitSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveMainTab('review-revisions')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                前往审核流转区查看
              </button>
            </div>
          )}

          {/* Batch In-Page Workbench */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setBatchInputMode('upload')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      batchInputMode === 'upload'
                        ? 'bg-white text-indigo-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>上传 Excel / CSV 文件</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchInputMode('paste')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      batchInputMode === 'paste'
                        ? 'bg-white text-indigo-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>粘贴表格文字 (Ctrl+V)</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleLoadDemoData}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>一键载入出海活动示范数据</span>
                </button>
              </div>

              {/* Campaign Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">指定所属 Campaign:</span>
                <select
                  value={batchCampaignId}
                  onChange={(e) => setBatchCampaignId(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Upload or Paste Area */}
            {batchInputMode === 'upload' ? (
              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 text-center transition-all bg-slate-50/50 relative">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                {uploadedFile ? (
                  <div>
                    <p className="text-sm font-bold text-slate-900">{uploadedFile.name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      大小: {(uploadedFile.size / 1024).toFixed(1)} KB · 点击下方按钮开始 AI 解析
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      拖拽 Excel/CSV 表格到此处，或 <span className="text-indigo-600 underline">点击上传</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      支持 .xlsx / .xls / .csv 格式，包含达人账号、合作报价、Brief 创作建议与素材清单等列
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  rows={6}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="从 Excel 直接复制并粘贴多行（需带表头，Tab分隔格式）..."
                  className="w-full p-3.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800"
                />
                <p className="text-[11px] text-slate-400">
                  提示：可直接在 Excel 中全选数据行（含表头）按 Ctrl+C 复制，再在此框按 Ctrl+V 粘贴。
                </p>
              </div>
            )}

            {/* Parse Error Display */}
            {parseError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Parse Action Button */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-500">
                已支持 22 项海外采购标准表头字段自动映射
              </span>
              <button
                type="button"
                onClick={handleParseBatchData}
                disabled={isParsing || (batchInputMode === 'upload' && !uploadedFile) || (batchInputMode === 'paste' && !pastedText.trim())}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-900/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>{isParsing ? '正在智能解析映射...' : 'AI 智能解析并映射表格'}</span>
              </button>
            </div>

            {/* Parsed Candidates Preview & Bulk Execution */}
            {parsedCandidates.length > 0 && (
              <div className="border-t border-slate-200 pt-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      解析候选立项列表 ({parsedCandidates.length} 条)
                    </h3>
                    <span className="text-xs text-slate-500">
                      (已选中 {parsedCandidates.filter((c) => c.selected).length} 条)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() =>
                        setParsedCandidates((prev) =>
                          prev.map((c) => ({ ...c, selected: true }))
                        )
                      }
                      className="text-xs text-indigo-600 font-bold hover:underline"
                    >
                      全选
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() =>
                        setParsedCandidates((prev) =>
                          prev.map((c) => ({ ...c, selected: false }))
                        )
                      }
                      className="text-xs text-slate-500 hover:underline"
                    >
                      取消全选
                    </button>
                  </div>
                </div>

                {/* Candidate Table */}
                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={
                              parsedCandidates.length > 0 &&
                              parsedCandidates.every((c) => c.selected)
                            }
                            onChange={(e) =>
                              setParsedCandidates((prev) =>
                                prev.map((c) => ({
                                  ...c,
                                  selected: e.target.checked,
                                }))
                              )
                            }
                            className="rounded text-indigo-600"
                          />
                        </th>
                        <th className="p-3 font-bold">达人账号 / 平台</th>
                        <th className="p-3 font-bold">合作模式</th>
                        <th className="p-3 font-bold">立项标题 / 主题</th>
                        <th className="p-3 font-bold">预算报价</th>
                        <th className="p-3 font-bold">创作方向要点</th>
                        <th className="p-3 font-bold">交付截止</th>
                        <th className="p-3 font-bold text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedCandidates.map((cand, idx) => (
                        <tr
                          key={cand.tempId || idx}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            cand.selected ? 'bg-indigo-50/30' : ''
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={cand.selected}
                              onChange={(e) =>
                                setParsedCandidates((prev) =>
                                  prev.map((c) =>
                                    c.tempId === cand.tempId
                                      ? { ...c, selected: e.target.checked }
                                      : c
                                  )
                                )
                              }
                              className="rounded text-indigo-600"
                            />
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">
                              {cand.kolName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {cand.platform} · {cand.followers || '未填'}粉丝
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                cand.category === '二创'
                                  ? 'bg-purple-100 text-purple-800'
                                  : cand.category === '直发'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {cand.category || '原创'}
                            </span>
                          </td>
                          <td className="p-3 max-w-xs">
                            <div className="font-semibold text-slate-900 truncate">
                              {cand.title}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {cand.topic}
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-indigo-700">
                            ¥{cand.collaborationCost || 0}
                          </td>
                          <td className="p-3 max-w-xs text-[11px] text-slate-600 truncate">
                            {cand.creativeDirection || '—'}
                          </td>
                          <td className="p-3 text-slate-600 font-mono text-[11px]">
                            {cand.deadline}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setParsedCandidates((prev) =>
                                  prev.filter((c) => c.tempId !== cand.tempId)
                                )
                              }
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              title="移除此行"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bulk Confirm Bar */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-700">
                    已选 <strong className="text-indigo-700 font-black">{parsedCandidates.filter((c) => c.selected).length}</strong> 条达人 Brief 进行立项
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      disabled={isBatchSubmitting || parsedCandidates.filter((c) => c.selected).length === 0}
                      onClick={() => handleConfirmBatchCreation(false)}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                    >
                      保存为省广草稿 (暂不提报)
                    </button>
                    <button
                      type="button"
                      disabled={isBatchSubmitting || parsedCandidates.filter((c) => c.selected).length === 0}
                      onClick={() => handleConfirmBatchCreation(true)}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-900/20 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isBatchSubmitting ? '正在批量立项中...' : '一键批量立项并提报给广汽国际审核'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Draft Briefs Quick Batch Submission section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>当前草稿态 / 待提报 Brief 列表 ({draftCount} 条)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  可在此处快速多选已立项的省广草稿，一键批量向广汽国际发起提报。
                </p>
              </div>

              {selectedDraftIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleBulkSubmitDrafts}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>批量提报选中的 {selectedDraftIds.length} 个 Brief 给广汽</span>
                </button>
              )}
            </div>

            {contents.filter((c) => c.status === 'Brief Draft').length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                暂无待提报的草稿 Brief。
              </p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {contents
                  .filter((c) => c.status === 'Brief Draft')
                  .map((draft) => {
                    const kol = getKol(draft.kolId);
                    const isChecked = selectedDraftIds.includes(draft.id);
                    return (
                      <div
                        key={draft.id}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDraftIds((prev) => [...prev, draft.id]);
                              } else {
                                setSelectedDraftIds((prev) =>
                                  prev.filter((id) => id !== draft.id)
                                );
                              }
                            }}
                            className="rounded text-indigo-600"
                          />
                          <div>
                            <div className="font-bold text-slate-900">
                              {draft.title}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {getCampaignName(draft.campaignId)} · {kol?.name || '达人'} · ¥{draft.briefData?.collaborationCost || 0}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingBriefContent(draft)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-white text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                          >
                            编辑
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickSubmitToGac(draft)}
                            className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>提报广汽</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Table Initiation Agent Modal */}
      <AiTableInitiationAgentModal
        isOpen={isAiAgentModalOpen}
        onClose={() => setIsAiAgentModalOpen(false)}
        onSuccess={() => {
          loadData();
          setActiveMainTab('review-revisions');
        }}
      />

      {/* New Content & Brief Modal */}
      <NewContentModal
        isOpen={isNewContentOpen}
        onClose={() => setIsNewContentOpen(false)}
        onSuccess={(id) => {
          loadData();
          onNavigate('content-detail', { id });
        }}
        defaultStage="Brief"
      />

      {/* Upload & Edit Brief Modal */}
      <UploadBriefModal
        isOpen={!!editingBriefContent}
        content={editingBriefContent}
        onClose={() => setEditingBriefContent(null)}
        onSuccess={loadData}
      />

      {/* AI Brief Audit Modal */}
      <AiBriefAuditModal
        isOpen={!!aiAuditContent}
        content={aiAuditContent}
        onClose={() => setAiAuditContent(null)}
        onApproveSuccess={loadData}
      />

      {/* Confirmation Modal */}
      {confirmModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {confirmModalItem.category === '直发'
                    ? '核准直发 Brief 并直通视频审核阶段'
                    : '核准 Brief 并推进到脚本创作阶段'}
                </h3>
                <p className="text-xs text-slate-500">
                  {confirmModalItem.category === '直发'
                    ? '直发合作免分镜脚本，任务将直接进入【4. 视频审核 (Video Review)】阶段'
                    : '任务将正式进入【3. 脚本审核 (Script Review)】阶段'}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div>
                <strong>任务名称：</strong> {confirmModalItem.title}
              </div>
              <div>
                <strong>合作类型：</strong> {confirmModalItem.category || '原创'}
              </div>
              <div>
                <strong>所属活动：</strong> {getCampaignName(confirmModalItem.campaignId)}
              </div>
              <div>
                <strong>合作达人：</strong> {getKol(confirmModalItem.kolId)?.name || confirmModalItem.kolId}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Brief 审核批注 / 创作指导提示:
              </label>
              <textarea
                rows={3}
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800"
                placeholder="填写核心卖点强调、禁忌词提示或创作指导..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmModalItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAdvanceToScript}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-900/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>
                  {confirmModalItem.category === '直发' ? '确认核准 · 进入视频审核' : '确认核准 · 进入脚本创作'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Brief Rejection / Revision Request Modal */}
      {rejectModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  退回 Brief 修改意见
                </h3>
                <p className="text-xs text-slate-500">
                  任务将退回给省广团队重新修订 Brief 内容与策略
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div>
                <strong>任务名称：</strong> {rejectModalItem.title}
              </div>
              <div>
                <strong>合作达人：</strong> {getKol(rejectModalItem.kolId)?.name || rejectModalItem.kolId}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                具体修改要求与指导意见 <span className="text-rose-500">*</span>:
              </label>
              <textarea
                rows={4}
                value={rejectFeedback}
                onChange={(e) => setRejectFeedback(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-slate-800"
                placeholder="请输入退回省广修改 Brief 的具体意见，例如开篇抓人 Hook、3000万对比口播细节或素材补充..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setRejectModalItem(null);
                  setRejectFeedback('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                disabled={!rejectFeedback.trim()}
                onClick={handleConfirmRejectBrief}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-rose-900/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>确认退回修改</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
