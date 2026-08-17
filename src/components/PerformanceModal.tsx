import React, { useState, useEffect } from 'react';
import { ContentItem, PerformanceData } from '../types';
import { dataService } from '../services/dataService';
import { 
  BarChart2, 
  X, 
  Link as LinkIcon, 
  Calendar, 
  Eye, 
  ThumbsUp, 
  MessageSquare, 
  Bookmark, 
  Share2, 
  Calculator, 
  Activity, 
  Percent, 
  Info,
  CheckCircle2,
  Zap,
  Timer
} from 'lucide-react';

interface PerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ContentItem;
  onSuccess: () => void;
}

export const PerformanceModal: React.FC<PerformanceModalProps> = ({
  isOpen,
  onClose,
  content,
  onSuccess,
}) => {
  const [publishedAt, setPublishedAt] = useState('');
  const [publishUrl, setPublishUrl] = useState('');
  const [views, setViews] = useState('');
  const [threeSecondPlayRate, setThreeSecondPlayRate] = useState('');
  const [likes, setLikes] = useState('');
  const [comments, setComments] = useState('');
  const [favorites, setFavorites] = useState('');
  const [shares, setShares] = useState('');

  useEffect(() => {
    if (content?.performanceData) {
      const pd = content.performanceData;
      setPublishedAt(pd.publishedAt || '');
      setPublishUrl(pd.publishUrl || '');
      setViews(pd.views !== undefined ? String(pd.views) : '');
      setThreeSecondPlayRate(pd.threeSecondPlayRate !== undefined ? String(pd.threeSecondPlayRate) : '');
      setLikes(pd.likes !== undefined ? String(pd.likes) : '');
      setComments(pd.comments !== undefined ? String(pd.comments) : '');
      setFavorites(pd.favorites !== undefined ? String(pd.favorites) : '');
      setShares(pd.shares !== undefined ? String(pd.shares) : '');
    } else {
      setPublishedAt(new Date().toISOString().split('T')[0]);
      setPublishUrl('');
      setViews('');
      setThreeSecondPlayRate('');
      setLikes('');
      setComments('');
      setFavorites('');
      setShares('');
    }
  }, [content]);

  if (!isOpen) return null;

  // Real-time calculations:
  const numViews = Math.max(0, parseInt(views, 10) || 0);
  const num3sRate = Math.max(0, Math.min(100, parseFloat(threeSecondPlayRate) || 0));
  const numLikes = Math.max(0, parseInt(likes, 10) || 0);
  const numComments = Math.max(0, parseInt(comments, 10) || 0);
  const numFavorites = Math.max(0, parseInt(favorites, 10) || 0);
  const numShares = Math.max(0, parseInt(shares, 10) || 0);

  // 1. 互动量 = 点赞量 + 评论量 + 收藏量 + 转发量
  const totalEngagements = numLikes + numComments + numFavorites + numShares;

  // 2. 互动率 = 互动量 / 播放量 (以百分比展示)
  const engagementRate = numViews > 0 ? (totalEngagements / numViews) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const perfData: PerformanceData = {
      publishedAt: publishedAt || undefined,
      publishUrl: publishUrl.trim() || undefined,
      views: numViews,
      threeSecondPlayRate: threeSecondPlayRate ? parseFloat(num3sRate.toFixed(2)) : undefined,
      likes: numLikes,
      comments: numComments,
      favorites: numFavorites,
      shares: numShares,
      engagements: totalEngagements,
      engagementRate: parseFloat(engagementRate.toFixed(2)),
      updatedAt: new Date().toISOString(),
    };

    dataService.updatePerformanceData(content.id, perfData);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/80 border border-indigo-400/30 flex items-center justify-center text-white shadow-sm">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">发布后数据录入与智能计算</h3>
              <p className="text-[11px] text-slate-300 truncate max-w-[320px]">{content.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs max-h-[85vh] overflow-y-auto custom-scrollbar">
          {/* Base URL and Date Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                上线发布日期
              </label>
              <input
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
                视频发布在线链接 (URL)
              </label>
              <input
                type="url"
                placeholder="https://www.xiaohongshu.com/..."
                value={publishUrl}
                onChange={(e) => setPublishUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
              />
            </div>
          </div>

          {/* 6 Core Metric Inputs */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-600" />
                6 项核心数据指标录入
              </span>
              <span className="text-[11px] text-slate-500">数值将自动代入下方实时计算与表现评估</span>
            </div>

            {/* Row 1: 播放量 & 三秒完播率 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. 播放量 */}
              <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3">
                <label className="block font-bold text-blue-950 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-blue-600" />
                    1. 播放量 / 阅读量 (Views) *
                  </span>
                  <span className="text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-mono font-bold">
                    互动率计算分母
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="例如: 250000"
                  value={views}
                  onChange={(e) => setViews(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-900 font-semibold"
                />
              </div>

              {/* 2. 三秒完播率 */}
              <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3">
                <label className="block font-bold text-amber-950 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-amber-600" />
                    2. 三秒完播率 (%)
                  </span>
                  <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-mono font-bold">
                    黄金前3s留存
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="例如: 38.5 (请输入百分比)"
                    value={threeSecondPlayRate}
                    onChange={(e) => setThreeSecondPlayRate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-slate-900 font-semibold pr-8"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 font-mono font-bold">%</span>
                </div>
              </div>
            </div>

            {/* 4 Interaction Components Grid: 点赞量, 评论量, 收藏量, 转发量 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* 点赞量 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1 text-[11px]">
                  <ThumbsUp className="w-3.5 h-3.5 text-rose-600" />
                  3. 点赞量 (Likes)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={likes}
                  onChange={(e) => setLikes(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-slate-900 font-semibold"
                />
              </div>

              {/* 评论量 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1 text-[11px]">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                  4. 评论量 (Comments)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-slate-900 font-semibold"
                />
              </div>

              {/* 收藏量 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1 text-[11px]">
                  <Bookmark className="w-3.5 h-3.5 text-purple-600" />
                  5. 收藏量 (Favorites)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={favorites}
                  onChange={(e) => setFavorites(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-slate-900 font-semibold"
                />
              </div>

              {/* 转发量 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1 text-[11px]">
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  6. 转发量 (Shares)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Automatic Calculation & Formula Display Card */}
          <div className="bg-gradient-to-br from-indigo-50/90 via-sky-50/60 to-purple-50/80 border border-indigo-200 rounded-2xl p-4 space-y-3 shadow-inner">
            <div className="flex items-center justify-between border-b border-indigo-200/80 pb-2">
              <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-indigo-600" />
                系统内置公式实时自动计算与留存分析
              </span>
              <span className="px-2 py-0.5 bg-indigo-200 text-indigo-900 rounded font-mono text-[10px] font-bold">
                Auto-Calculated
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 互动量计算卡片 */}
              <div className="bg-white/90 p-3 rounded-xl border border-indigo-100 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-slate-600 text-[11px] font-semibold">
                  <span className="flex items-center gap-1 text-slate-800 font-bold">
                    <Activity className="w-3.5 h-3.5 text-indigo-600" />
                    互动量 (Engagements)
                  </span>
                  <span className="text-indigo-600 font-mono text-[10px]">四项加和</span>
                </div>
                <div className="text-xl font-extrabold text-indigo-950 font-mono">
                  {totalEngagements.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 font-mono bg-slate-50 p-1.5 rounded border border-slate-200 truncate">
                  公式: {numLikes} + {numComments} + {numFavorites} + {numShares}
                </div>
              </div>

              {/* 互动率计算卡片 */}
              <div className="bg-white/90 p-3 rounded-xl border border-indigo-100 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-slate-600 text-[11px] font-semibold">
                  <span className="flex items-center gap-1 text-slate-800 font-bold">
                    <Percent className="w-3.5 h-3.5 text-emerald-600" />
                    互动率 (Eng. Rate)
                  </span>
                  <span className="text-emerald-700 font-mono text-[10px]">互动量 ÷ 播放量</span>
                </div>
                <div className="text-xl font-extrabold text-emerald-700 font-mono flex items-center gap-1.5">
                  <span>{engagementRate.toFixed(2)}%</span>
                  {engagementRate >= 5 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-sans font-bold">
                      极佳
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-mono bg-slate-50 p-1.5 rounded border border-slate-200 truncate">
                  公式: {totalEngagements.toLocaleString()} ÷ {numViews.toLocaleString() || '0'} × 100%
                </div>
              </div>

              {/* 三秒完播率评估卡片 */}
              <div className="bg-white/90 p-3 rounded-xl border border-amber-100 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-slate-600 text-[11px] font-semibold">
                  <span className="flex items-center gap-1 text-slate-800 font-bold">
                    <Timer className="w-3.5 h-3.5 text-amber-600" />
                    三秒完播率 (3s Rate)
                  </span>
                  <span className="text-amber-700 font-mono text-[10px]">前3s黄金留存</span>
                </div>
                <div className="text-xl font-extrabold text-amber-800 font-mono flex items-center gap-1.5">
                  <span>{threeSecondPlayRate ? `${num3sRate}%` : '--'}</span>
                  {num3sRate >= 40 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded font-sans font-bold flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" />
                      高吸睛
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-mono bg-slate-50 p-1.5 rounded border border-slate-200 truncate">
                  {num3sRate >= 40 ? '行业标杆水平 (>40%)' : num3sRate >= 25 ? '正常平稳区间 (25%-40%)' : '前3s需强化钩子设计'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-indigo-900 bg-white/60 p-2 rounded-lg border border-indigo-100">
              <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>保存后将自动归档至本任务表现数据看板，并同步至相关数据报表。</span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
            >
              取消
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>保存数据 (完成归档)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

