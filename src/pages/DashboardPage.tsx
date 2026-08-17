import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { ContentItem } from '../types';
import { isOverdue, calculateWaitingTime } from '../utils/dateUtils';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { OwnerBadge } from '../components/OwnerBadge';
import { ContentInlineProgressBar } from '../components/ContentProgressBar';
import { HomeTaskReminderModal } from '../components/HomeTaskReminderModal';
import { UploadPublishLinkModal } from '../components/UploadPublishLinkModal';
import { PerformanceModal } from '../components/PerformanceModal';
import { 
  CheckSquare, 
  Building2, 
  UserCheck, 
  AlertTriangle, 
  ArrowRight,
  Clock,
  Bell,
  Link as LinkIcon,
  BarChart2,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: string, params?: { id?: string }) => void;
  onOpenNewContent: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onOpenNewContent }) => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [selectedPublishLinkContent, setSelectedPublishLinkContent] = useState<ContentItem | null>(null);
  const [selectedPerfContent, setSelectedPerfContent] = useState<ContentItem | null>(null);

  const reloadData = () => {
    setContents(dataService.getContents());
  };

  useEffect(() => {
    reloadData();
    return dataService.subscribe(reloadData);
  }, []);

  // Compute pending reminders for popup and top alert banner
  const pendingPublishLinkContents = contents.filter(
    (c) => c.status === 'Pending Publish Link' || (c.videoApprovedAt && !c.performanceData?.publishUrl && !c.linkUploadedAt)
  );

  const pendingDataEntryContents = contents.filter((c) => {
    if (c.status === 'Pending Data Entry') return true;
    if (c.linkUploadedAt && (!c.performanceData?.views || c.performanceData?.views === 0)) {
      return true;
    }
    return false;
  });

  const totalReminders = pendingPublishLinkContents.length + pendingDataEntryContents.length;

  // Auto show reminder modal on initial visit if there are items to remind
  useEffect(() => {
    const hasShown = sessionStorage.getItem('kol_hub_reminder_shown_session');
    if (!hasShown && totalReminders > 0) {
      setIsReminderOpen(true);
      sessionStorage.setItem('kol_hub_reminder_shown_session', 'true');
    }
  }, [totalReminders]);

  const campaigns = dataService.getCampaigns();
  const kols = dataService.getKols();

  // Calculate KPI Numbers
  const myReviewItems = contents.filter((c) => c.currentOwner === 'Me');
  const agencyWaitingItems = contents.filter((c) => c.currentOwner === 'Agency');
  const kolWaitingItems = contents.filter((c) => c.currentOwner === 'KOL');
  const overdueItems = contents.filter((c) => isOverdue(c.deadline, c.stage));

  const getCampaignName = (id: string) => campaigns.find((c) => c.id === id)?.name || id;
  const getKolName = (id: string) => kols.find((k) => k.id === id)?.name || id;

  // Helper for current version display
  const getCurrentVersionLabel = (c: ContentItem) => {
    if (c.stage === 'Brief') {
      return c.status === 'Waiting for Brief Approval' ? 'Brief 待广汽审核' : 'Brief 待完善';
    }
    if (c.stage === 'KOL Selection') {
      return '达人定选评估';
    }
    if (c.stage === 'Script') {
      const versions = dataService.getScriptVersions(c.id);
      if (versions.length === 0) return '等待脚本V1';
      return `Script V${versions[versions.length - 1].versionNumber}`;
    } else {
      const versions = dataService.getVideoVersions(c.id);
      if (versions.length === 0) return '等待视频V1';
      return `Video V${versions[versions.length - 1].versionNumber}`;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold mb-2 whitespace-nowrap">
              <span>欢迎回来</span>
              <span>·</span>
              <span className="whitespace-nowrap">高效审稿控制台</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight whitespace-nowrap">KOL 达人内容审核总览 Dashboard</h2>
            <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
              5 秒快速掌握全局审核责任归属：清查待我审核事项、跟进省广初审进度与达人交稿倒计时。
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0 flex-wrap">
            {totalReminders > 0 && (
              <button
                onClick={() => setIsReminderOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Bell className="w-4 h-4 text-slate-950 animate-bounce shrink-0" />
                <span className="whitespace-nowrap">协同待办提醒 ({totalReminders})</span>
              </button>
            )}

            <button
              onClick={onOpenNewContent}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <span className="whitespace-nowrap">+ 发起新 Content 任务</span>
            </button>
          </div>
        </div>
      </div>

      {/* Prominent Reminder Alert Bar if Reminders Exist */}
      {totalReminders > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-indigo-500/15 border border-amber-300/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 text-sm">
                  【业务履约提醒】当前有 {totalReminders} 项任务需要及时处理
                </span>
                {pendingPublishLinkContents.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 text-[11px] font-bold">
                    {pendingPublishLinkContents.length} 项待录入发布链接
                  </span>
                )}
                {pendingDataEntryContents.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 text-[11px] font-bold">
                    {pendingDataEntryContents.length} 项满 3 天待补充效果数据
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                包含 1 天内发布链接上传要求及上线满 3 天播放量、互动量（自动加和）、互动率（自动计算）指标录入。
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsReminderOpen(true)}
            className="shrink-0 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors self-end sm:self-auto"
          >
            <span>打开提醒清单</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: 待我审核 */}
        <div
          onClick={() => onNavigate('my-reviews')}
          className="bg-white rounded-xl p-5 border border-indigo-200 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider whitespace-nowrap">待我审核</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-950">{myReviewItems.length}</span>
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">个内容等待终审</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold">
            <span className="whitespace-nowrap">立即处理 Task</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
          </div>
        </div>

        {/* Card 2: 等待省广 */}
        <div className="bg-white rounded-xl p-5 border border-amber-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider whitespace-nowrap">等待省广初审</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-950">{agencyWaitingItems.length}</span>
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">个内容在省广手里</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            省广初审完成后会自动移交至“广汽国际审核”
          </div>
        </div>

        {/* Card 3: 等待达人 */}
        <div className="bg-white rounded-xl p-5 border border-sky-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-sky-900 uppercase tracking-wider whitespace-nowrap">等待达人交稿/改稿</span>
            <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-sky-950">{kolWaitingItems.length}</span>
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">个任务在达人端创作</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            包含脚本创作、脚本修改与视频拍摄剪辑
          </div>
        </div>

        {/* Card 4: 已逾期 */}
        <div className="bg-white rounded-xl p-5 border border-rose-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-900 uppercase tracking-wider whitespace-nowrap">已逾期提醒</span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-950">{overdueItems.length}</span>
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">个任务超过截止日期</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-rose-600 font-medium whitespace-nowrap">
            {overdueItems.length > 0 ? '⚠️ 需要优先催办处理' : '无逾期项目，节点正常'}
          </div>
        </div>
      </div>

      {/* 我的待办 Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 whitespace-nowrap">
              <CheckSquare className="w-5 h-5 text-indigo-600 shrink-0" />
              <span className="whitespace-nowrap">我的待办 (My Reviews)</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-700 whitespace-nowrap">
                {myReviewItems.length}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              只展示 Current Owner = Me (责任在广汽国际) 的待处理脚本与视频审稿任务
            </p>
          </div>

          <button
            onClick={() => onNavigate('my-reviews')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <span className="whitespace-nowrap">进入 My Reviews 深度筛选模式</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {myReviewItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckSquare className="w-12 h-12 mx-auto text-slate-200 mb-3" />
            <p className="text-sm font-semibold text-slate-600">太棒了！目前没有需要您审核的内容</p>
            <p className="text-xs text-slate-400 mt-1">等省广或达人提交新的稿件后，会实时呈现在这里。</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">KOL 达人</th>
                  <th className="px-5 py-3.5">所属 Campaign</th>
                  <th className="px-5 py-3.5 min-w-[240px]">履约进度 (4阶段流程)</th>
                  <th className="px-5 py-3.5">Stage 阶段</th>
                  <th className="px-5 py-3.5">当前版本</th>
                  <th className="px-5 py-3.5">Status 状态</th>
                  <th className="px-5 py-3.5">Deadline</th>
                  <th className="px-5 py-3.5">已等待时长</th>
                  <th className="px-5 py-3.5 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myReviewItems.map((item) => {
                  const overdue = isOverdue(item.deadline, item.stage);
                  const verLabel = getCurrentVersionLabel(item);
                  const waitingTime = calculateWaitingTime(item.updatedAt);

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onNavigate('content-detail', { id: item.id })}
                      className={`hover:bg-indigo-50/40 transition-colors cursor-pointer ${
                        overdue ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {getKolName(item.kolId)}
                        <div className="text-[10px] text-slate-400 font-normal">{item.platform}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 max-w-[160px] truncate" title={getCampaignName(item.campaignId)}>
                        {getCampaignName(item.campaignId)}
                      </td>
                      <td className="px-5 py-4">
                        <ContentInlineProgressBar content={item} />
                      </td>
                      <td className="px-5 py-4">
                        <StageBadge stage={item.stage} />
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {verLabel}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span>{item.deadline}</span>
                          {overdue && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                              已逾期
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-mono">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{waitingTime}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('content-detail', { id: item.id });
                          }}
                          className={`px-3.5 py-1.5 rounded-lg text-white font-semibold text-xs shadow-sm transition-colors ${
                            item.stage === 'Brief'
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : 'bg-indigo-600 hover:bg-indigo-700'
                          }`}
                        >
                          {item.stage === 'Brief' ? '核准 Brief' : 'Review 审核'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reminder Modal Popup */}
      <HomeTaskReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        pendingPublishLinkContents={pendingPublishLinkContents}
        pendingDataEntryContents={pendingDataEntryContents}
        onOpenPublishLinkModal={(c) => setSelectedPublishLinkContent(c)}
        onOpenPerformanceModal={(c) => setSelectedPerfContent(c)}
      />

      {/* Upload Publish Link Modal opened from Reminder */}
      {selectedPublishLinkContent && (
        <UploadPublishLinkModal
          isOpen={true}
          content={selectedPublishLinkContent}
          onClose={() => setSelectedPublishLinkContent(null)}
          onSuccess={reloadData}
        />
      )}

      {/* Performance Modal opened from Reminder */}
      {selectedPerfContent && (
        <PerformanceModal
          isOpen={true}
          content={selectedPerfContent}
          onClose={() => setSelectedPerfContent(null)}
          onSuccess={reloadData}
        />
      )}
    </div>
  );
};

