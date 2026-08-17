import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { ContentItem, Campaign, KOL } from '../types';
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
} from 'lucide-react';
import { ContentInlineProgressBar } from '../components/ContentProgressBar';
import { NewContentModal } from '../components/NewContentModal';
import { UploadBriefModal } from '../components/UploadBriefModal';
import { AiBriefAuditModal } from '../components/AiBriefAuditModal';

interface BriefReviewPageProps {
  onNavigate: (page: string, params?: { id?: string }) => void;
}

export const BriefReviewPage: React.FC<BriefReviewPageProps> = ({ onNavigate }) => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [kols, setKols] = useState<KOL[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentRole, setCurrentRole] = useState(dataService.getCurrentRole());

  // Modals state
  const [isNewContentOpen, setIsNewContentOpen] = useState(false);
  const [editingBriefContent, setEditingBriefContent] = useState<ContentItem | null>(null);
  const [aiAuditContent, setAiAuditContent] = useState<ContentItem | null>(null);
  const [confirmModalItem, setConfirmModalItem] = useState<ContentItem | null>(null);
  const [confirmNotes, setConfirmNotes] = useState('');

  const loadData = () => {
    // Load tasks in 'Brief' stage or with briefData
    const allContents = dataService.getContents();
    const briefTasks = allContents.filter((c) => c.stage === 'Brief');
    setContents(briefTasks);
    setCampaigns(dataService.getCampaigns());
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

  const filteredTasks = contents.filter((task) => {
    if (selectedCampaignId !== 'all' && task.campaignId !== selectedCampaignId) {
      return false;
    }
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const kol = getKol(task.kolId);
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchTopic = task.topic.toLowerCase().includes(q);
      const matchKol = kol?.name.toLowerCase().includes(q);
      const matchCreative = task.briefData?.creativeDirection?.toLowerCase().includes(q);
      return matchTitle || matchTopic || matchKol || matchCreative;
    }
    return true;
  });

  const handleApproveBrief = (task: ContentItem) => {
    setConfirmModalItem(task);
    setConfirmNotes(
      `广汽国际审核意见：同意通过此 Brief！切入点兼具传播热度与智造硬核实力，请省广按此 Brief 推进达人撰写详细分镜脚本。`
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
    const feedback = prompt('请输入退回省广修改 Brief 的具体意见：', '请在 Brief 中进一步明确达人开篇抓人 Hook 与 3000 万对比口播细节。');
    if (feedback) {
      dataService.requestBriefRevision(task.id, feedback, currentRole === 'Me' ? 'Me' : 'Agency');
      loadData();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Brief 审核流转 (Brief Review)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {contents.length} 个 Brief 待审任务
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                省广代理商上传达人 Brief（含创作建议、素材包、投产比预估），广汽国际在线审核或 AI 诊断后核准流转至脚本创作。
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2 text-slate-700 font-medium">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>当前身份：<strong className="text-slate-900">{currentRole === 'Me' ? '广汽国际 (Me)' : '省广代理商 (Agency)'}</strong></span>
          </div>

          <button
            type="button"
            onClick={() => setIsNewContentOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-900/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>新建 Content 提报 Brief</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">待广汽国际审核 Brief</div>
          <div className="text-2xl font-black text-indigo-600 mt-1 font-mono">
            {contents.filter((c) => c.status === 'Waiting for Brief Approval').length}
          </div>
          <div className="text-[11px] text-indigo-600 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>省广已提报，等待广汽国际核准</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">省广待完善 / 草稿</div>
          <div className="text-2xl font-black text-amber-600 mt-1 font-mono">
            {contents.filter((c) => c.status === 'Brief Draft').length}
          </div>
          <div className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>待省广补充创作建议或素材清单</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">关联海外 Campaign</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{campaigns.length} 个</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <FileCheck className="w-3 h-3 text-slate-400" />
            <span>多语种出海传播协同</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">下一流转环节</div>
          <div className="text-sm font-bold text-indigo-700 mt-2 flex items-center gap-1.5">
            <span>3. 脚本审核 (Script Review)</span>
            <ArrowRight className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">核准后达人方可开始编写分镜脚本</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索 Brief 标题、达人、切入诉求..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">活动:</span>
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

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">状态:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">全部状态</option>
              <option value="Waiting for Brief Approval">待广汽国际审核 (Waiting for Approval)</option>
              <option value="Brief Draft">省广草稿 / 待补充 (Brief Draft)</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          共找到 <strong className="text-slate-700">{filteredTasks.length}</strong> 条 Brief 审核任务
        </div>
      </div>

      {/* Task List / Brief Cards */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">当前没有处于「Brief 审核」阶段的任务</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            所有达人任务已完成 Brief 审定并流转至后续环节，或尚未创建新的 Brief 提报。
          </p>
          <button
            type="button"
            onClick={() => setIsNewContentOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>新建 Content 并提报 Brief (支持 serjcraft 范例)</span>
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredTasks.map((task) => {
            const kol = getKol(task.kolId);
            const campaignName = getCampaignName(task.campaignId);
            const bd = task.briefData || {};

            const isWaitingGac = task.status === 'Waiting for Brief Approval';

            return (
              <div
                key={task.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all space-y-4"
              >
                {/* Top Row: Campaign & Title & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {campaignName}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {task.category || '二创'}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        {task.platform}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                          isWaitingGac
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {isWaitingGac ? '待广汽国际审核 Brief' : '省广待完善 / 草稿'}
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
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI 智能诊断 Brief</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingBriefContent(task)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>编辑 / 上传 Brief</span>
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
                          <span>核准 Brief · 推进至脚本</span>
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
                        <span>提报给广汽审核</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Structured Brief Data Panel (对应用户 20 项表格指标) */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                  {/* Row 1: KOL Metrics Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 font-semibold block">达人 ID</span>
                      <span className="font-bold text-slate-900 truncate block">
                        {kol?.name || 'serjcraft'}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 font-semibold block">粉丝量 / 量级</span>
                      <span className="font-bold text-slate-900">
                        {bd.followersCount || kol?.followers || '63,000'} ({bd.tier || '中腰部'})
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 font-semibold block">地区 / 属性</span>
                      <span className="font-bold text-slate-900 truncate block">
                        {bd.region || '俄罗斯'} · {bd.accountAttribute || '车主'}
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

                  {/* Row 2: Creative Direction (创作建议与核心诉求) */}
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
                          rel="noreferrer"
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

                  {/* Row 3: Provided Assets Chips (素材提供清单) */}
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

                  {/* Row 4: Audit & Submission Metadata */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <div>
                      <strong>提报方：</strong> {bd.submittedBy || '省广营销集团 GIMC'} (
                      {bd.submittedAt || '已提报'})
                    </div>
                    {bd.reviewFeedback && (
                      <div className="text-indigo-700 font-medium">
                        <strong>广汽审核批注：</strong> {bd.reviewFeedback}
                      </div>
                    )}
                    <div>
                      <strong>截稿交付：</strong> {task.deadline || '2026-08-28'}
                    </div>
                  </div>
                </div>

                {/* Progress Node */}
                <div className="pt-1">
                  <ContentInlineProgressBar content={task} />
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                <h3 className="text-base font-bold text-slate-900">核准 Brief 并推进到脚本创作阶段</h3>
                <p className="text-xs text-slate-500">任务将正式进入【3. 脚本审核 (Script Review)】阶段</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div>
                <strong>任务名称：</strong> {confirmModalItem.title}
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
                <span>确认核准 · 进入脚本创作</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
