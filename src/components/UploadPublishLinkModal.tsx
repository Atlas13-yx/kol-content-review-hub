import React, { useState, useEffect } from 'react';
import { ContentItem } from '../types';
import { dataService } from '../services/dataService';
import { Link as LinkIcon, X, Calendar, Send, Building2, Clock } from 'lucide-react';

interface UploadPublishLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ContentItem;
  onSuccess: () => void;
}

export const UploadPublishLinkModal: React.FC<UploadPublishLinkModalProps> = ({
  isOpen,
  onClose,
  content,
  onSuccess,
}) => {
  const [publishUrl, setPublishUrl] = useState('');
  const [publishedAt, setPublishedAt] = useState('');

  useEffect(() => {
    if (content?.performanceData?.publishUrl) {
      setPublishUrl(content.performanceData.publishUrl);
    } else {
      setPublishUrl('');
    }
    setPublishedAt(new Date().toISOString().split('T')[0]);
  }, [content]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishUrl.trim()) {
      alert('请填写线上视频发布链接');
      return;
    }

    dataService.updatePublishUrl(content.id, publishUrl.trim(), publishedAt);
    onSuccess();
    onClose();
  };

  const deadlineStr = content.linkUploadDeadline
    ? new Date(content.linkUploadDeadline).toLocaleString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '24小时内';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">省广上传视频发布链接</h3>
              <p className="text-[11px] text-purple-200 truncate max-w-[240px]">{content.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-purple-200 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-purple-50/80 border-b border-purple-100 flex items-center gap-2 text-xs text-purple-900">
          <Clock className="w-4 h-4 text-purple-600 shrink-0" />
          <div>
            <span className="font-bold">广汽国际 1 天内上传要求：</span>
            <span>请于 <strong className="text-purple-950 font-mono">{deadlineStr}</strong> 前提交上线链接</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <LinkIcon className="w-4 h-4 text-purple-600" />
              线上视频公开发布链接 (URL) *
            </label>
            <input
              type="url"
              required
              placeholder="https://www.xiaohongshu.com/discovery/item/..."
              value={publishUrl}
              onChange={(e) => setPublishUrl(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-purple-600" />
              实际上线日期
            </label>
            <input
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans text-slate-900"
            />
          </div>

          <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 text-[11px] text-purple-900 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <span>💡 履约闭环机制：</span>
            </div>
            <div>
              上传发布链接后，系统将记录实际上线时间，并于 <strong className="text-purple-950 font-bold">3 天后提醒省广团队</strong> 补充录入播放量、点赞量、评论量、收藏量、转发量等全套数据指标。
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-md shadow-purple-700/20 flex items-center justify-center gap-1.5 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>提交发布链接</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
