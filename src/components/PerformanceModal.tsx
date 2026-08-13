import React, { useState, useEffect } from 'react';
import { ContentItem, PerformanceData } from '../types';
import { dataService } from '../services/dataService';
import { BarChart2, X, Link as LinkIcon, Calendar, Eye, ThumbsUp, MessageSquare, Share2 } from 'lucide-react';

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
  const [likes, setLikes] = useState('');
  const [comments, setComments] = useState('');
  const [shares, setShares] = useState('');

  useEffect(() => {
    if (content?.performanceData) {
      const pd = content.performanceData;
      setPublishedAt(pd.publishedAt || '');
      setPublishUrl(pd.publishUrl || '');
      setViews(pd.views !== undefined ? String(pd.views) : '');
      setLikes(pd.likes !== undefined ? String(pd.likes) : '');
      setComments(pd.comments !== undefined ? String(pd.comments) : '');
      setShares(pd.shares !== undefined ? String(pd.shares) : '');
    } else {
      setPublishedAt(new Date().toISOString().split('T')[0]);
      setPublishUrl('');
      setViews('');
      setLikes('');
      setComments('');
      setShares('');
    }
  }, [content]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const perfData: PerformanceData = {
      publishedAt: publishedAt || undefined,
      publishUrl: publishUrl || undefined,
      views: views ? parseInt(views, 10) : 0,
      likes: likes ? parseInt(likes, 10) : 0,
      comments: comments ? parseInt(comments, 10) : 0,
      shares: shares ? parseInt(shares, 10) : 0,
    };

    dataService.updatePerformanceData(content.id, perfData);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">手动录入发布后数据</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[260px]">{content.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              发布日期
            </label>
            <input
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
              线上发布链接 (如小红书/抖音视频URL)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={publishUrl}
              onChange={(e) => setPublishUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                播放/阅读量
              </label>
              <input
                type="number"
                min="0"
                placeholder="例如: 150000"
                value={views}
                onChange={(e) => setViews(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <ThumbsUp className="w-3.5 h-3.5 text-rose-600" />
                点赞数
              </label>
              <input
                type="number"
                min="0"
                placeholder="例如: 12000"
                value={likes}
                onChange={(e) => setLikes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                评论数
              </label>
              <input
                type="number"
                min="0"
                placeholder="例如: 850"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                分享/转发数
              </label>
              <input
                type="number"
                min="0"
                placeholder="例如: 320"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold text-xs"
            >
              取消
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors"
            >
              保存发布数据
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
