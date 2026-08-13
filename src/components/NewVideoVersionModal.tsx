import React, { useState } from 'react';
import { X, Video } from 'lucide-react';
import { dataService } from '../services/dataService';

interface NewVideoVersionModalProps {
  isOpen: boolean;
  contentId: string;
  nextVersionNumber: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewVideoVersionModal: React.FC<NewVideoVersionModalProps> = ({
  isOpen,
  contentId,
  nextVersionNumber,
  onClose,
  onSuccess,
}) => {
  const [videoUrl, setVideoUrl] = useState(
    'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smartphone-with-a-green-screen-41544-large.mp4'
  );
  const [fileUrl, setFileUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) {
      alert('请填写视频预览 URL 或视频流地址');
      return;
    }

    dataService.addNewVideoVersion(contentId, videoUrl.trim(), fileUrl.trim() || undefined);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-purple-50">
          <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
            <Video className="w-5 h-5 text-purple-600" />
            <span>提交新视频版本：Video V{nextVersionNumber}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">视频预览地址 Video URL *</label>
            <input
              type="text"
              placeholder="https://example.com/video_v2.mp4"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">高清原片下载地址 File URL (可选)</label>
            <input
              type="text"
              placeholder="https://pan.baidu.com/s/video_v2_hd"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="bg-purple-50/70 border border-purple-200 rounded-lg p-3 text-[11px] text-purple-800">
            🔒 新提交的 Video V{nextVersionNumber} <strong>不会覆盖</strong> 之前的 Video V{nextVersionNumber - 1} 历史文件与审稿记录。提交后自动流转至 <strong>等待省广审核</strong>。
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
            >
              提交 Video V{nextVersionNumber}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
