import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';
import { dataService } from '../services/dataService';

interface NewScriptVersionModalProps {
  isOpen: boolean;
  contentId: string;
  nextVersionNumber: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewScriptVersionModal: React.FC<NewScriptVersionModalProps> = ({
  isOpen,
  contentId,
  nextVersionNumber,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState(`Script V${nextVersionNumber} (修改提交稿)`);
  const [scriptText, setScriptText] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptText.trim()) {
      alert('请填写脚本文本内容');
      return;
    }

    dataService.addNewScriptVersion(contentId, title.trim(), scriptText.trim(), fileUrl.trim() || undefined);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-50">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>提交新脚本版本：Script V{nextVersionNumber}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">脚本标题说明</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">脚本文本内容 *</label>
            <textarea
              rows={6}
              placeholder="[00:00-00:15] 画面：... 口播：... [00:15-00:45] 画面：..."
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Word/DOCX 附件或云文档链接</label>
            <input
              type="text"
              placeholder="https://example.com/files/script_v2.docx"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-[11px] text-blue-800">
            🔒 核心规则：新提交的 Script V{nextVersionNumber} <strong>绝对不会覆盖</strong> 之前的历史版本。提交后状态将转为 <strong>等待省广审核</strong>。
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
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              提交 Script V{nextVersionNumber}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
