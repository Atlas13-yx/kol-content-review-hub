import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { dataService } from '../services/dataService';

interface NewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (campaignId: string) => void;
}

export const NewCampaignModal: React.FC<NewCampaignModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [brief, setBrief] = useState('');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-09-30');
  const [targetOriginal, setTargetOriginal] = useState('3');
  const [targetSecondary, setTargetSecondary] = useState('5');
  const [targetDirectPost, setTargetDirectPost] = useState('4');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError('请填写 Campaign 名称');
      return;
    }

    const created = dataService.addCampaign({
      name: name.trim(),
      description: description.trim(),
      brief: brief.trim(),
      startDate,
      endDate,
      status: 'Active',
      targetOriginal: parseInt(targetOriginal, 10) || 0,
      targetSecondary: parseInt(targetSecondary, 10) || 0,
      targetDirectPost: parseInt(targetDirectPost, 10) || 0,
    });

    onSuccess(created.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-base font-bold text-slate-900">新建 Campaign 项目</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign 名称 *</label>
            <input
              type="text"
              placeholder="例如：双十一预售全网爆款种草"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">开始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">结束日期</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
            <div>
              <label className="block text-xs font-bold text-indigo-900 mb-1">原创目标篇数</label>
              <input
                type="number"
                min="0"
                placeholder="例如: 3"
                value={targetOriginal}
                onChange={(e) => setTargetOriginal(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-indigo-900 mb-1">二创目标篇数</label>
              <input
                type="number"
                min="0"
                placeholder="例如: 5"
                value={targetSecondary}
                onChange={(e) => setTargetSecondary(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-indigo-900 mb-1">直发目标篇数</label>
              <input
                type="number"
                min="0"
                placeholder="例如: 4"
                value={targetDirectPost}
                onChange={(e) => setTargetDirectPost(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">项目简介</label>
            <textarea
              rows={2}
              placeholder="简述该 Campaign 的推广目的和覆盖渠道..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">通用 Brief 提纲</label>
            <textarea
              rows={3}
              placeholder="给所有参与达人的核心Brief基调..."
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <span>💡 权限说明规则</span>
            </div>
            <p className="leading-relaxed">
              省广代理商与广汽国际<strong>均有权限新建 Campaign</strong>。创建完成后，后期的排期调整、篇数目标变更与核心参数修改<strong>仅限广汽国际 (Me) 拥有调整权限</strong>。
            </p>
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
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              创建 Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
