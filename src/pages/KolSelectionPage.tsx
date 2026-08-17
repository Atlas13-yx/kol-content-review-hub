import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { ContentItem, Campaign, KOL, KolSelectionBatch, KolSelectionBatchStatus } from '../types';
import {
  Users,
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
  TrendingUp,
  Tag,
  SlidersHorizontal,
  ChevronRight,
  Upload,
  FileSpreadsheet,
  Download,
  RotateCcw,
  Plus,
  Layers,
  MessageSquareQuote,
  Filter,
  FileCheck,
  ArrowLeftRight,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { ContentInlineProgressBar } from '../components/ContentProgressBar';
import { UploadKolSelectionModal } from '../components/UploadKolSelectionModal';
import { ReviewKolSelectionModal } from '../components/ReviewKolSelectionModal';

interface KolSelectionPageProps {
  onNavigate: (page: string, params?: { id?: string }) => void;
}

export const KolSelectionPage: React.FC<KolSelectionPageProps> = ({ onNavigate }) => {
  const [batches, setBatches] = useState<KolSelectionBatch[]>([]);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [kols, setKols] = useState<KOL[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'batches' | 'tasks'>('batches');
  const [currentRole, setCurrentRole] = useState(dataService.getCurrentRole());

  // Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedBatchForReview, setSelectedBatchForReview] = useState<KolSelectionBatch | null>(null);

  // Advance Task Modal state
  const [confirmModalItem, setConfirmModalItem] = useState<ContentItem | null>(null);
  const [confirmNotes, setConfirmNotes] = useState('');

  const loadData = () => {
    setBatches(dataService.getKolSelectionBatches());
    const allContents = dataService.getContents();
    setContents(allContents.filter((c) => c.stage === 'KOL Selection'));
    setCampaigns(dataService.getCampaigns());
    setKols(dataService.getKols());
    setCurrentRole(dataService.getCurrentRole());
  };

  useEffect(() => {
    loadData();
    return dataService.subscribe(loadData);
  }, []);

  const getCampaign = (id: string) => {
    return campaigns.find((c) => c.id === id);
  };

  const getCampaignName = (id: string) => {
    return getCampaign(id)?.name || id;
  };

  const getKol = (id: string) => {
    return kols.find((k) => k.id === id);
  };

  // Filtered Batches
  const filteredBatches = batches.filter((batch) => {
    if (selectedCampaignId !== 'all' && batch.campaignId !== selectedCampaignId) {
      return false;
    }
    if (selectedStatus !== 'all' && batch.status !== selectedStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const campName = getCampaignName(batch.campaignId).toLowerCase();
      const matchTitle = batch.title.toLowerCase().includes(q);
      const matchFile = batch.agencyFileName.toLowerCase().includes(q) || (batch.gacFileName || '').toLowerCase().includes(q);
      const matchNotes = (batch.agencyNotes || '').toLowerCase().includes(q) || (batch.gacNotes || '').toLowerCase().includes(q);
      return matchTitle || matchFile || matchNotes || campName.includes(q);
    }
    return true;
  });

  // Filtered Tasks (Legacy/Content stage tasks)
  const filteredTasks = contents.filter((task) => {
    if (selectedCampaignId !== 'all' && task.campaignId !== selectedCampaignId) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const kol = getKol(task.kolId);
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchTopic = task.topic.toLowerCase().includes(q);
      const matchKol = kol?.name.toLowerCase().includes(q);
      return matchTitle || matchTopic || matchKol;
    }
    return true;
  });

  // Statistics
  const pendingCount = batches.filter((b) => b.status === 'Pending GAC Review').length;
  const approvedCount = batches.filter((b) => b.status === 'Approved').length;
  const revisionCount = batches.filter((b) => b.status === 'Revision Required').length;

  const handleApproveKolSelection = (task: ContentItem) => {
    setConfirmModalItem(task);
    setConfirmNotes(
      `经${currentRole === 'Me' ? '广汽国际' : '省广代理商'}审核，确认该达人画像、报价及档期符合活动要求，正式定选并推进至 Brief 阶段。`
    );
  };

  const handleConfirmAdvanceToBrief = () => {
    if (!confirmModalItem) return;
    dataService.advanceContentStage(
      confirmModalItem.id,
      'Brief',
      'Brief Draft',
      confirmNotes,
      currentRole === 'Me' ? 'Me' : 'Agency'
    );
    setConfirmModalItem(null);
    setConfirmNotes('');
  };

  const handleCreateNewContentFromApprovedBatch = (batch: KolSelectionBatch) => {
    const camp = getCampaign(batch.campaignId);
    onNavigate('brief-review');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">达人筛选阶段 (KOL Selection)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {batches.length} 个提报批次
                </span>
                {pendingCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
                    {pendingCount} 个待广汽审核
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                省广上传各 Campaign 候选达人表格进行初选提报 ➔ 广汽国际审核筛选并通过专属通道上传反馈表格定选。
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons & Current Identity */}
        <div className="flex items-center gap-3 flex-wrap self-start lg:self-auto">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2 text-slate-700 font-medium shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              当前身份：
              <strong className="text-slate-900 font-bold">
                {currentRole === 'Me' ? '广汽国际 (Me)' : '省广代理商 (Agency)'}
              </strong>
            </span>
          </div>

          {/* Primary Action Button: Agency uploads table, GAC reviews table */}
          {currentRole === 'Agency' ? (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-900/20 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>上传达人筛选表格 (提报)</span>
            </button>
          ) : (
            <button
              onClick={() => {
                const firstPending = batches.find((b) => b.status === 'Pending GAC Review') || batches[0];
                if (firstPending) {
                  setSelectedBatchForReview(firstPending);
                } else {
                  setIsUploadModalOpen(true);
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm shadow-amber-900/20 transition-all cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>
                {pendingCount > 0 ? `审核待定选表格 (${pendingCount})` : '审核达人表格 / 反馈通道'}
              </span>
            </button>
          )}

          {/* Fallback upload for Me (e.g. testing) */}
          {currentRole === 'Me' && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              title="也可以直接模拟省广提报新的达人表格"
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">待广汽国际审核筛选</div>
          <div className="text-2xl font-black text-indigo-700 mt-1">{pendingCount} <span className="text-xs font-normal text-slate-400">个批次</span></div>
          <div className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>等待广汽下载并上传定选反馈</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">已定选确认批次</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{approvedCount} <span className="text-xs font-normal text-slate-400">个批次</span></div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>已下发广汽反馈表并可进入 Brief</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">需调整 / 补充候选人</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{revisionCount} <span className="text-xs font-normal text-slate-400">个批次</span></div>
          <div className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
            <RotateCcw className="w-3 h-3" />
            <span>省广需按反馈补充提报</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">关联 Campaign 活动</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{campaigns.length} <span className="text-xs font-normal text-slate-400">个项目</span></div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" />
            <span>覆盖巴黎车展、3000万下线等</span>
          </div>
        </div>
      </div>

      {/* Main Filter & Navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('batches')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'batches'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>达人提报批次与文件流转通道 ({filteredBatches.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'tasks'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>已定选达人任务清单 ({filteredTasks.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>文件实时双向流转通道已启用</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索批次标题、文件名、Campaign..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>

            {/* Campaign Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Campaign:</span>
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="all">全部 Campaign ({campaigns.length})</option>
                {campaigns.map((camp) => (
                  <option key={camp.id} value={camp.id}>
                    {camp.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Selector for Batches */}
            {activeTab === 'batches' && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">状态:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="all">全部状态 ({batches.length})</option>
                  <option value="Pending GAC Review">待广汽审核 ({pendingCount})</option>
                  <option value="Approved">已定选通过 ({approvedCount})</option>
                  <option value="Revision Required">需调整修改 ({revisionCount})</option>
                </select>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-400">
            共匹配到 <strong className="text-slate-700">{activeTab === 'batches' ? filteredBatches.length : filteredTasks.length}</strong> 条记录
          </div>
        </div>
      </div>

      {/* TAB 1: Batches and File Transfer Channel (达人提报批次与文件通道) */}
      {activeTab === 'batches' && (
        <div className="space-y-4">
          {filteredBatches.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">暂无符合条件的达人初选提报批次</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                省广可以通过上方「上传达人筛选表格」通道提报候选达人清单并选择归属的 Campaign。
              </p>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-900/20 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>立即提报新达人表格</span>
              </button>
            </div>
          ) : (
            filteredBatches.map((batch) => {
              const camp = getCampaign(batch.campaignId);
              const isPending = batch.status === 'Pending GAC Review';
              const isApproved = batch.status === 'Approved';
              const isRevision = batch.status === 'Revision Required';

              return (
                <div
                  key={batch.id}
                  className={`bg-white border rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all space-y-4 ${
                    isPending
                      ? 'border-indigo-200 ring-1 ring-indigo-100'
                      : isApproved
                      ? 'border-emerald-200'
                      : 'border-rose-200'
                  }`}
                >
                  {/* Batch Card Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          <span>{camp?.name || batch.campaignId}</span>
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          第 {batch.batchNumber} 批提报
                        </span>
                        {batch.candidateCount ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            候选达人: {batch.candidateCount} 位
                          </span>
                        ) : null}

                        {/* Status Badge */}
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                            isPending
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                              : isApproved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-rose-50 text-rose-700 border-rose-300'
                          }`}
                        >
                          {isPending && <Clock className="w-3 h-3 text-indigo-600 animate-pulse" />}
                          {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {isRevision && <RotateCcw className="w-3 h-3 text-rose-600" />}
                          <span>
                            {isPending
                              ? '待广汽国际审核筛选'
                              : isApproved
                              ? `已定选通过 (定选 ${batch.approvedKolCount || batch.candidateCount || 0} 位)`
                              : '需调整补充候选人'}
                          </span>
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {batch.title}
                      </h3>
                    </div>

                    {/* Batch Action Buttons */}
                    <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                      {/* Review Button for GAC (Me) */}
                      <button
                        onClick={() => setSelectedBatchForReview(batch)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ${
                          isPending
                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/20'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          {currentRole === 'Me'
                            ? isPending
                              ? '进行定选审核与上传反馈'
                              : '修改审核与反馈表格'
                            : '查看广汽反馈通道与批注'}
                        </span>
                      </button>

                      {/* If approved, quick link to brief */}
                      {isApproved && (
                        <button
                          onClick={() => onNavigate('brief-review')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                        >
                          <span>进入 Brief 阶段</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dual Channel Split View: Agency Upload vs. GAC Feedback */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* LEFT: Agency Upload Channel */}
                    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                            省
                          </div>
                          <span className="text-xs font-bold text-slate-800">
                            省广提报表格 (Agency Upload)
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(batch.agencySubmittedAt).toLocaleDateString('zh-CN')}</span>
                        </span>
                      </div>

                      {/* File Card */}
                      <div className="bg-white border border-slate-200/90 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <FileSpreadsheet className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {batch.agencyFileName}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>大小: {batch.agencyFileSize || '2.1 MB'}</span>
                              <span className="text-indigo-600 font-medium">候选 {batch.candidateCount || 0} 位</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {batch.agencySheetUrl && (
                            <a
                              href={batch.agencySheetUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold"
                              title="打开在线表格"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <a
                            href={batch.agencyFileUrl || '#'}
                            onClick={(e) => {
                              alert(`正在下载省广提报表格：${batch.agencyFileName}`);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>下载表格</span>
                          </a>
                        </div>
                      </div>

                      {/* Agency Notes */}
                      {batch.agencyNotes && (
                        <div className="text-xs text-slate-600 bg-white/70 border border-slate-200/60 rounded-lg p-2.5 leading-relaxed">
                          <span className="font-bold text-slate-700">省广初选说明：</span>
                          {batch.agencyNotes}
                        </div>
                      )}

                      <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                        <span>提报团队：{batch.agencySubmittedBy}</span>
                      </div>
                    </div>

                    {/* RIGHT: GAC Review & Feedback Channel */}
                    <div
                      className={`border rounded-xl p-4 space-y-3 ${
                        isPending
                          ? 'bg-amber-50/40 border-amber-200/80 border-dashed'
                          : isApproved
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-rose-50/40 border-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-md text-white flex items-center justify-center text-xs font-bold ${
                              isPending
                                ? 'bg-amber-500'
                                : isApproved
                                ? 'bg-emerald-600'
                                : 'bg-rose-600'
                            }`}
                          >
                            广
                          </div>
                          <span className="text-xs font-bold text-slate-800">
                            广汽国际定选反馈 (GAC Feedback Channel)
                          </span>
                        </div>
                        {batch.gacReviewedAt && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(batch.gacReviewedAt).toLocaleDateString('zh-CN')}</span>
                          </span>
                        )}
                      </div>

                      {isPending ? (
                        <div className="bg-white/80 border border-amber-200 rounded-xl p-4 text-center space-y-2">
                          <div className="text-xs font-bold text-amber-900 flex items-center justify-center gap-1.5">
                            <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                            <span>等待广汽国际审核并上传反馈表格</span>
                          </div>
                          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                            {currentRole === 'Me'
                              ? '请点击下方按钮打开反馈提交通道，上传定选/修改意见表格并批复。'
                              : '省广表格已成功送达广汽国际，广汽完成筛选后将在此处回传定选确认表。'}
                          </p>
                          {currentRole === 'Me' && (
                            <button
                              onClick={() => setSelectedBatchForReview(batch)}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer mt-1"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>立即上传广汽反馈表格</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* GAC Feedback File Card */}
                          <div className="bg-white border border-slate-200/90 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                  isApproved
                                    ? 'bg-emerald-50 text-emerald-600 font-bold'
                                    : 'bg-rose-50 text-rose-600 font-bold'
                                }`}
                              >
                                <FileSpreadsheet className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 truncate">
                                  {batch.gacFileName || '广汽达人定选确认表.xlsx'}
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                  <span>大小: {batch.gacFileSize || '2.2 MB'}</span>
                                  {batch.approvedKolCount !== undefined && (
                                    <span className="text-emerald-700 font-bold">
                                      定选达人: {batch.approvedKolCount} 位
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {batch.gacSheetUrl && (
                                <a
                                  href={batch.gacSheetUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold"
                                  title="打开广汽在线表格"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <a
                                href={batch.gacFileUrl || '#'}
                                onClick={(e) => {
                                  alert(`正在下载广汽国际反馈表格：${batch.gacFileName}`);
                                }}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                  isApproved
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-800'
                                }`}
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>下载反馈表</span>
                              </a>
                            </div>
                          </div>

                          {/* GAC Notes */}
                          {batch.gacNotes && (
                            <div className="text-xs text-slate-700 bg-white/80 border border-slate-200/60 rounded-lg p-2.5 leading-relaxed">
                              <span className="font-bold text-slate-900">广汽定选批复：</span>
                              {batch.gacNotes}
                            </div>
                          )}

                          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                            <span>审核人：{batch.gacReviewedBy || '广汽国际海外营销部'}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: Candidate Tasks / Content Items (已定选达人任务清单) */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">当前没有处于「达人筛选」阶段的单体任务</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                所有候选达人已定选流转至 Brief 阶段，或可通过批次提报新达人。
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const kol = getKol(task.kolId);
              const campaignName = getCampaignName(task.campaignId);

              return (
                <div
                  key={task.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {campaignName}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {task.category}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                          {task.platform}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          待确认达人定选
                        </span>
                      </div>
                      <h3
                        onClick={() => onNavigate('content-detail', { id: task.id })}
                        className="text-base font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors"
                      >
                        {task.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                      <button
                        onClick={() => onNavigate('content-detail', { id: task.id })}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        查看详情
                      </button>
                      <button
                        onClick={() => handleApproveKolSelection(task)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs shadow-sm shadow-amber-900/20 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>确认达人 · 推进至 Brief 阶段</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {kol && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={kol.avatar}
                          alt={kol.name}
                          className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-2xs"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{kol.name}</span>
                            <span className="text-[11px] font-semibold text-slate-500">{kol.platform}</span>
                            {kol.tags?.map((t) => (
                              <span
                                key={t}
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  t === '白名单'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : t === '黑名单'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-indigo-50 text-indigo-700'
                                }`}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                            <span>粉丝量：<strong className="text-slate-800">{kol.followers || '未知'}</strong></span>
                            <span>分类：<strong className="text-slate-800">{kol.category || '综合车生活'}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={kol.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>达人主页</span>
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-slate-600 bg-amber-50/50 border border-amber-100 rounded-xl p-3 space-y-1">
                    <div className="font-bold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>筛选与定选考量：</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{task.briefText || '暂无初步需求说明'}</p>
                  </div>

                  <div className="pt-1">
                    <ContentInlineProgressBar content={task} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Upload KOL Selection Modal (Agency Channel) */}
      <UploadKolSelectionModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        campaigns={campaigns}
        defaultCampaignId={selectedCampaignId !== 'all' ? selectedCampaignId : undefined}
        onSuccess={loadData}
      />

      {/* Review & Feedback Upload Channel Modal (GAC Channel) */}
      {selectedBatchForReview && (
        <ReviewKolSelectionModal
          isOpen={Boolean(selectedBatchForReview)}
          onClose={() => setSelectedBatchForReview(null)}
          batch={selectedBatchForReview}
          campaign={getCampaign(selectedBatchForReview.campaignId)}
          onSuccess={loadData}
        />
      )}

      {/* Confirmation Modal for Single Task Advance */}
      {confirmModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">确认达人定选并推进到下一阶段</h3>
                <p className="text-xs text-slate-500">任务将正式进入【2. Brief 审核】阶段</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div><strong>任务名称：</strong> {confirmModalItem.title}</div>
              <div><strong>所属活动：</strong> {getCampaignName(confirmModalItem.campaignId)}</div>
              <div><strong>拟定达人：</strong> {getKol(confirmModalItem.kolId)?.name || confirmModalItem.kolId}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                审核定选意见 / 流转批注:
              </label>
              <textarea
                rows={3}
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-800"
                placeholder="填写定选确认理由、传播期望或预算说明..."
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
                onClick={handleConfirmAdvanceToBrief}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-900/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>确认审核 · 进入 Brief 阶段</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
