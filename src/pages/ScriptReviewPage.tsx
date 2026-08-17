import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { ContentItem, Campaign, KOL, ScriptVersion } from '../types';
import {
  FileText,
  Search,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Building2,
  Clock,
  Check,
  Eye,
  AlertCircle,
  Video,
  ChevronRight,
  MessageSquareQuote,
  Flame,
  Plus
} from 'lucide-react';
import { ContentInlineProgressBar } from '../components/ContentProgressBar';
import { StatusBadge } from '../components/StatusBadge';
import { OwnerBadge } from '../components/OwnerBadge';
import { IntegratedReviewWorkbenchModal } from '../components/IntegratedReviewWorkbenchModal';
import { SmartUploadVersionModal } from '../components/SmartUploadVersionModal';

interface ScriptReviewPageProps {
  onNavigate: (page: string, params?: { id?: string }) => void;
}

export const ScriptReviewPage: React.FC<ScriptReviewPageProps> = ({ onNavigate }) => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [kols, setKols] = useState<KOL[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentRole, setCurrentRole] = useState(dataService.getCurrentRole());

  // Modals state
  const [activeWorkbenchContent, setActiveWorkbenchContent] = useState<ContentItem | null>(null);
  const [activeUploadContent, setActiveUploadContent] = useState<ContentItem | null>(null);
  const [confirmModalItem, setConfirmModalItem] = useState<ContentItem | null>(null);
  const [confirmNotes, setConfirmNotes] = useState('');

  const loadData = () => {
    // Only load tasks in 'Script' stage
    const allContents = dataService.getContents();
    const scriptTasks = allContents.filter((c) => c.stage === 'Script');
    setContents(scriptTasks);
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
      return matchTitle || matchTopic || matchKol;
    }
    return true;
  });

  const handleApproveScriptToVideo = (task: ContentItem) => {
    setConfirmModalItem(task);
    setConfirmNotes(`经${currentRole === 'Me' ? '广汽国际' : '省广代理商'}审核确认，脚本定稿，正式推进至【4. 视频拍摄与审核 (Video Review)】阶段。`);
  };

  const handleConfirmAdvanceToVideo = () => {
    if (!confirmModalItem) return;
    dataService.advanceContentStage(
      confirmModalItem.id,
      'Video',
      'Waiting for KOL Video',
      confirmNotes,
      currentRole === 'Me' ? 'Me' : 'Agency'
    );
    setConfirmModalItem(null);
    setConfirmNotes('');
  };

  // Counting sub categories
  const waitingAgencyCount = contents.filter((c) => c.status === 'Waiting for Agency Review').length;
  const waitingMyCount = contents.filter((c) => c.status === 'Waiting for My Review').length;
  const waitingKolCount = contents.filter((c) => c.status === 'Waiting for KOL Revision' || c.status === 'Waiting for KOL Script').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">脚本审核阶段 (Script Review)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  当前阶段：{contents.length} 个脚本任务
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                支持版本迭代对比、AI Brief 对齐诊断、省广初审与广汽裁决。脚本定稿通过后方可推进进入视频拍摄与审核。
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2 text-slate-700 font-medium">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>当前审核身份：<strong className="text-slate-900">{currentRole === 'Me' ? '广汽国际 (Me)' : '省广代理商 (Agency)'}</strong></span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">待广汽终审脚本</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{waitingMyCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">广汽国际直接裁决</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">待省广初审脚本</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{waitingAgencyCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">省广团队需初审把关</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">待达人撰写/修改</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">{waitingKolCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">跟进达人提交新版本</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">定稿流转下一阶段</div>
          <div className="text-sm font-bold text-purple-700 mt-2 flex items-center gap-1.5">
            <span>4. 视频审核 (Video)</span>
            <ArrowRight className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">脚本通过后进入视频制作</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索脚本任务标题、话题或达人..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">活动筛选:</span>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">全部 Campaign</option>
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
              <option value="all">全部脚本状态</option>
              <option value="Waiting for My Review">等待广汽国际审核</option>
              <option value="Waiting for Agency Review">等待省广初审</option>
              <option value="Waiting for KOL Revision">等待达人修改</option>
              <option value="Waiting for KOL Script">等待达人提交</option>
              <option value="Script Approved">脚本已通过</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          共找到 <strong className="text-slate-700">{filteredTasks.length}</strong> 条脚本审核任务
        </div>
      </div>

      {/* Task List / Script Cards */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">当前没有处于「脚本审核」阶段的任务</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            所有脚本已定稿并推进至视频阶段，或可前往「Brief 审核」通过更多需求。
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const kol = getKol(task.kolId);
            const campaignName = getCampaignName(task.campaignId);
            const scriptVersions = dataService.getScriptVersions(task.id);
            const latestVersion = scriptVersions[scriptVersions.length - 1];

            return (
              <div
                key={task.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all space-y-4"
              >
                {/* Top Row: Campaign & Title */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {campaignName}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {task.category}
                      </span>
                      <StatusBadge status={task.status} />
                      <OwnerBadge owner={task.currentOwner} />
                    </div>
                    <h3
                      onClick={() => onNavigate('content-detail', { id: task.id })}
                      className="text-base font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors"
                    >
                      {task.title}
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
                    <button
                      onClick={() => setActiveUploadContent(task)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-xs font-semibold transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>上传新脚本</span>
                    </button>

                    <button
                      onClick={() => setActiveWorkbenchContent(task)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>审稿工作台 (AI诊断+批注)</span>
                    </button>

                    <button
                      onClick={() => handleApproveScriptToVideo(task)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>审核通过 · 进入视频阶段</span>
                    </button>
                  </div>
                </div>

                {/* Script Version Status Box */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">
                        达人：{kol?.name || task.kolId} ({task.platform})
                      </span>
                      <span className="text-slate-400">|</span>
                      <span className="font-semibold text-slate-600">
                        版本历史：共 {scriptVersions.length} 个版本
                        {latestVersion && `（当前 V${latestVersion.versionNumber}）`}
                      </span>
                    </div>
                    {latestVersion && (
                      <p className="text-slate-500 text-[11px] line-clamp-1">
                        最新提交内容：{latestVersion.scriptText || '文档附件提交'}
                      </p>
                    )}
                  </div>

                  {latestVersion?.aiAuditResult && (
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-[11px] font-semibold text-slate-700">
                        AI 与 Brief 匹配度：
                        <strong className="text-indigo-600 ml-1">
                          {latestVersion.aiAuditResult.score}分
                        </strong>
                      </span>
                    </div>
                  )}
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

      {/* Advance to Video Confirmation Modal */}
      {confirmModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">核准通过脚本并推进到视频制作阶段</h3>
                <p className="text-xs text-slate-500">任务将正式进入【4. 视频审核 (Video Review)】阶段</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div><strong>任务名称：</strong> {confirmModalItem.title}</div>
              <div><strong>所属活动：</strong> {getCampaignName(confirmModalItem.campaignId)}</div>
              <div><strong>达人：</strong> {getKol(confirmModalItem.kolId)?.name || confirmModalItem.kolId}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                脚本终审通过批注 / 视频拍摄要求:
              </label>
              <textarea
                rows={3}
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800"
                placeholder="填写脚本定稿意见、视频拍摄画质或特写镜头要求..."
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
                onClick={handleConfirmAdvanceToVideo}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-900/20 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>确认审核 · 进入视频阶段</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Integrated Workbench Modal */}
      {activeWorkbenchContent && (
        <IntegratedReviewWorkbenchModal
          isOpen={true}
          contentId={activeWorkbenchContent.id}
          assetType="Script"
          content={activeWorkbenchContent}
          onClose={() => setActiveWorkbenchContent(null)}
          onSuccess={() => {
            loadData();
            setActiveWorkbenchContent(null);
          }}
        />
      )}

      {/* Smart Upload Version Modal */}
      {activeUploadContent && (
        <SmartUploadVersionModal
          isOpen={true}
          initialContentId={activeUploadContent.id}
          initialAssetType="Script"
          content={activeUploadContent}
          onClose={() => setActiveUploadContent(null)}
          onSuccess={() => {
            loadData();
            setActiveUploadContent(null);
          }}
        />
      )}
    </div>
  );
};
