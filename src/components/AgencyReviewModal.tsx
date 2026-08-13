import React, { useState } from 'react';
import { X, Building2, Sparkles } from 'lucide-react';
import { dataService } from '../services/dataService';
import { AssetType } from '../types';
import { AiSubtitleAuditModal } from './AiSubtitleAuditModal';

interface AgencyReviewModalProps {
  isOpen: boolean;
  contentId: string;
  assetType: AssetType;
  versionId: string;
  versionNumber: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const AgencyReviewModal: React.FC<AgencyReviewModalProps> = ({
  isOpen,
  contentId,
  assetType,
  versionId,
  versionNumber,
  onClose,
  onSuccess,
}) => {
  const [reviewContent, setReviewContent] = useState('');
  const [isAiPluginOpen, setIsAiPluginOpen] = useState(false);

  if (!isOpen) return null;

  const content = dataService.getContentById(contentId);
  const campaign = content ? dataService.getCampaignById(content.campaignId) : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewContent.trim()) {
      alert('请输入省广初审意见');
      return;
    }

    dataService.addAgencyReview(contentId, assetType, versionId, reviewContent.trim());
    onSuccess();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Building2 className="w-5 h-5 text-amber-600" />
              <span>录入省广公司审核意见 ({assetType === 'Script' ? '脚本' : '视频'} V{versionNumber})</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* AI Audit Plugin Trigger Banner */}
            <div className="bg-gradient-to-r from-blue-900 to-slate-900 p-3.5 rounded-xl text-white shadow-md flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-300">
                  <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
                  <span>省广 AI 多语种字幕与 Brief 智能初审插件</span>
                </div>
                <p className="text-[11px] text-blue-200">一键提取字幕/台词对比 Brief 规则，自动生成初审意见</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAiPluginOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow transition-all whitespace-nowrap flex items-center gap-1"
              >
                <span>调用 AI 插件</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">省广审核意见内容 *</label>
              <textarea
                rows={5}
                placeholder="例如：省广意见：视频画面审美极高，建议对1:15处的BGM降低音量，并强化结尾领券卡片停留..."
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800">
              💡 提交省广意见后，系统将自动把该 Task 状态更新为 <strong>等待广汽国际审核</strong>，Current Owner 自动变更为 <strong>Me (广汽国际)</strong>。
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
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
              >
                提交省广意见并移交广汽国际审核
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Embedded AI Plugin Modal */}
      {content && (
        <AiSubtitleAuditModal
          isOpen={isAiPluginOpen}
          content={content}
          campaign={campaign}
          assetType={assetType}
          versionNumber={versionNumber}
          onClose={() => setIsAiPluginOpen(false)}
          onApplyReviewDraft={(draftText) => setReviewContent(draftText)}
        />
      )}
    </>
  );
};

