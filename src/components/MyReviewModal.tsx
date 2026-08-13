import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, UserCheck } from 'lucide-react';
import { dataService } from '../services/dataService';
import { AssetType } from '../types';

interface MyReviewModalProps {
  isOpen: boolean;
  contentId: string;
  assetType: AssetType;
  versionId: string;
  versionNumber: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const MyReviewModal: React.FC<MyReviewModalProps> = ({
  isOpen,
  contentId,
  assetType,
  versionId,
  versionNumber,
  onClose,
  onSuccess,
}) => {
  const [outcome, setOutcome] = useState<'Approve' | 'Request Revision'>('Approve');
  const [myReview, setMyReview] = useState('');
  const [finalFeedback, setFinalFeedback] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (outcome === 'Request Revision' && !finalFeedback.trim()) {
      alert('选择“需要修改”时，必须填写反馈给达人的 Final Feedback（最终反馈意见）');
      return;
    }

    if (assetType === 'Script') {
      dataService.submitMyScriptReview(contentId, versionId, outcome, myReview.trim(), finalFeedback.trim());
    } else {
      dataService.submitMyVideoReview(contentId, versionId, outcome, myReview.trim(), finalFeedback.trim());
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <span>广汽国际终审 ({assetType === 'Script' ? '脚本' : '视频'} V{versionNumber})</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Outcome Radio Cards */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">审核结论 Decision *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOutcome('Approve')}
                className={`p-3 rounded-lg border flex items-center gap-3 transition-all text-left ${
                  outcome === 'Approve'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 text-emerald-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <CheckCircle className={`w-5 h-5 shrink-0 ${outcome === 'Approve' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-bold">{assetType === 'Script' ? '脚本通过' : '视频通过'} (Approve)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {assetType === 'Script' ? '流转至视频制作阶段' : '完成审核，可排期发布'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOutcome('Request Revision')}
                className={`p-3 rounded-lg border flex items-center gap-3 transition-all text-left ${
                  outcome === 'Request Revision'
                    ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20 text-amber-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 shrink-0 ${outcome === 'Request Revision' ? 'text-amber-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-bold">需要修改 (Request Revision)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">需要达人修改后提交新版本</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">广汽国际审核意见 (GAC Review Internal)</label>
            <textarea
              rows={3}
              placeholder="记录广汽国际团队内部审核意见或注意事项..."
              value={myReview}
              onChange={(e) => setMyReview(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {outcome === 'Request Revision' && (
            <div className="animate-in fade-in duration-150">
              <label className="block text-xs font-bold text-amber-900 mb-1">
                最终修改反馈意见 (发给省广转达达人) *
              </label>
              <textarea
                rows={4}
                placeholder="填写广汽国际对该稿件的明确修改要求..."
                value={finalFeedback}
                onChange={(e) => setFinalFeedback(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-amber-50/30"
                required
              />
              <p className="text-[11px] text-amber-700 mt-1">
                * 该意见将作为广汽国际的裁决结果提交，并由省广代理商同步转达给达人执行修改。
              </p>
            </div>
          )}

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
              className={`px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-sm ${
                outcome === 'Approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {outcome === 'Approve' ? '确认审核通过' : '确认发送修改要求'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
