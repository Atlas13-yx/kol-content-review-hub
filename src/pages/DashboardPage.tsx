import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { ContentItem } from '../types';
import { isOverdue, calculateWaitingTime } from '../utils/dateUtils';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { OwnerBadge } from '../components/OwnerBadge';
import { 
  CheckSquare, 
  Building2, 
  UserCheck, 
  AlertTriangle, 
  ArrowRight,
  Clock
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: string, params?: { id?: string }) => void;
  onOpenNewContent: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onOpenNewContent }) => {
  const [contents, setContents] = useState<ContentItem[]>([]);

  useEffect(() => {
    const update = () => {
      setContents(dataService.getContents());
    };
    update();
    return dataService.subscribe(update);
  }, []);

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
    if (c.stage === 'Script' || c.stage === 'Brief') {
      const versions = dataService.getScriptVersions(c.id);
      if (versions.length === 0) return '未提交';
      return `Script V${versions[versions.length - 1].versionNumber}`;
    } else {
      const versions = dataService.getVideoVersions(c.id);
      if (versions.length === 0) return '等待视频V1';
      return `Video V${versions[versions.length - 1].versionNumber}`;
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold mb-2">
              <span>欢迎回来</span>
              <span>·</span>
              <span>高效审稿控制台</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">KOL 达人内容审核总览 Dashboard</h2>
            <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
              5 秒快速掌握全局审核责任归属：清查待我审核事项、跟进省广初审进度与达人交稿倒计时。
            </p>
          </div>

          <button
            onClick={onOpenNewContent}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-950/50 flex items-center justify-center gap-2 transition-all self-start md:self-auto shrink-0"
          >
            <span>+ 发起新 Content 任务</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: 待我审核 */}
        <div
          onClick={() => onNavigate('my-reviews')}
          className="bg-white rounded-xl p-5 border border-indigo-200 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">待我审核</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-950">{myReviewItems.length}</span>
            <span className="text-xs text-slate-500 font-medium">个内容等待终审</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold">
            <span>立即处理 Task</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: 等待省广 */}
        <div className="bg-white rounded-xl p-5 border border-amber-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">等待省广初审</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-950">{agencyWaitingItems.length}</span>
            <span className="text-xs text-slate-500 font-medium">个内容在省广手里</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            省广初审完成后会自动移交至“广汽国际审核”
          </div>
        </div>

        {/* Card 3: 等待达人 */}
        <div className="bg-white rounded-xl p-5 border border-sky-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-sky-900 uppercase tracking-wider">等待达人交稿/改稿</span>
            <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-sky-950">{kolWaitingItems.length}</span>
            <span className="text-xs text-slate-500 font-medium">个任务在达人端创作</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            包含脚本创作、脚本修改与视频拍摄剪辑
          </div>
        </div>

        {/* Card 4: 已逾期 */}
        <div className="bg-white rounded-xl p-5 border border-rose-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">已逾期提醒</span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-950">{overdueItems.length}</span>
            <span className="text-xs text-slate-500 font-medium">个任务超过截止日期</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-rose-600 font-medium">
            {overdueItems.length > 0 ? '⚠️ 需要优先催办处理' : '无逾期项目，节点正常'}
          </div>
        </div>
      </div>

      {/* 我的待办 Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
              <span>我的待办 (My Reviews)</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-700">
                {myReviewItems.length}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              只展示 Current Owner = Me (责任在广汽国际) 的待处理脚本与视频审稿任务
            </p>
          </div>

          <button
            onClick={() => onNavigate('my-reviews')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>进入 My Reviews 深度筛选模式</span>
            <ArrowRight className="w-4 h-4" />
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
                  <th className="px-5 py-3.5">Content 任务标题</th>
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
                      <td className="px-5 py-4 font-medium text-slate-900 max-w-[220px]">
                        <div className="truncate font-semibold text-slate-800" title={item.title}>
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{item.topic}</div>
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
                          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-colors"
                        >
                          Review 审核
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
    </div>
  );
};
