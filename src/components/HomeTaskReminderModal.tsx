import React from 'react';
import { ContentItem } from '../types';
import { 
  Bell, 
  X, 
  Link as LinkIcon, 
  BarChart2, 
  Calendar, 
  Clock, 
  ExternalLink, 
  ArrowRight, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

interface HomeTaskReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingPublishLinkContents: ContentItem[];
  pendingDataEntryContents: ContentItem[];
  onOpenPublishLinkModal: (content: ContentItem) => void;
  onOpenPerformanceModal: (content: ContentItem) => void;
}

export const HomeTaskReminderModal: React.FC<HomeTaskReminderModalProps> = ({
  isOpen,
  onClose,
  pendingPublishLinkContents,
  pendingDataEntryContents,
  onOpenPublishLinkModal,
  onOpenPerformanceModal,
}) => {
  if (!isOpen) return null;

  const totalCount = pendingPublishLinkContents.length + pendingDataEntryContents.length;

  if (totalCount === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Bell className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">广汽国际 × 省广协作提醒中心</h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/90 text-white font-mono text-[11px] font-bold">
                  {totalCount} 项待办
                </span>
              </div>
              <p className="text-xs text-slate-300">
                发布链接上传与上线满 3 天投放数据均由省广团队补充录入，系统定点触发催办提醒
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-xs">
          {/* Section 1: 待录入发布链接提醒 */}
          {pendingPublishLinkContents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <div className="flex items-center gap-2 text-purple-950 font-bold text-sm">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <LinkIcon className="w-3.5 h-3.5" />
                  </div>
                  <span>【待录入发布链接提醒 (省广执行)】</span>
                  <span className="text-xs font-normal text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    视频过审 1 天内上传要求 ({pendingPublishLinkContents.length})
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                {pendingPublishLinkContents.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200 hover:border-purple-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs truncate max-w-[280px]">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200 font-mono">
                          {item.platform}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-3 h-3 text-purple-600" />
                          截止时间: {item.linkUploadDeadline ? new Date(item.linkUploadDeadline).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : '24小时内'}
                        </span>
                        <span className="text-purple-800 font-medium">
                          视频终审已通过，请省广团队尽快提交线上首发链接
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenPublishLinkModal(item);
                      }}
                      className="shrink-0 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>录入发布链接</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: 待补充发布数据提醒（满 3 天提醒省广补充） */}
          {pendingDataEntryContents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <span>【发布数据满 3 天补充提醒 (省广负责录入)】</span>
                  <span className="text-xs font-normal text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    上线满 3 天 · 待省广录入指标 ({pendingDataEntryContents.length})
                  </span>
                </div>
              </div>

              {/* Data requirements explanation */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">省广数据履约考核要求：</div>
                  <div>
                    所有投放效果数据均由 <strong className="font-bold text-amber-950">省广团队负责补充录入</strong>。视频发布满 3 天已进入数据沉淀期，请录入 <strong className="font-bold text-amber-950">播放量、三秒完播率、点赞量、评论量、收藏量、转发量</strong>。
                    系统将自动为您实时计算 <strong className="font-bold text-amber-950">互动量</strong>（四项加和）与 <strong className="font-bold text-amber-950">互动率</strong>（互动量÷播放量）。
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                {pendingDataEntryContents.map((item) => {
                  const publishedDate = item.performanceData?.publishedAt || item.linkUploadedAt?.split('T')[0] || '近日';
                  const daysSince = item.linkUploadedAt 
                    ? Math.max(3, Math.floor((Date.now() - new Date(item.linkUploadedAt).getTime()) / (1000 * 60 * 60 * 24)))
                    : 3;

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-200 hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs truncate max-w-[280px]">
                            {item.title}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200 font-mono">
                            {item.platform}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                            已上线 {daysSince} 天
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1 text-slate-500">
                            <Calendar className="w-3 h-3 text-indigo-600" />
                            发布时间: {publishedDate}
                          </span>
                          {item.performanceData?.publishUrl && (
                            <a
                              href={item.performanceData.publishUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 hover:underline flex items-center gap-1 font-mono text-[10px]"
                            >
                              <span>查看线上视频</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onClose();
                          onOpenPerformanceModal(item);
                        }}
                        className="shrink-0 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-all"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>补充发布数据</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>数据补充后将自动归档并同步至 Campaign 整体看板。</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-sm"
          >
            我知道了 (稍后处理)
          </button>
        </div>
      </div>
    </div>
  );
};
