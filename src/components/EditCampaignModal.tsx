import React, { useState, useEffect } from 'react';
import { X, Calendar, Lock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Campaign } from '../types';
import { dataService } from '../services/dataService';

interface EditCampaignModalProps {
  isOpen: boolean;
  campaign?: Campaign;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditCampaignModal: React.FC<EditCampaignModalProps> = ({
  isOpen,
  campaign,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [brief, setBrief] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<Campaign['status']>('Active');
  const [targetOriginal, setTargetOriginal] = useState('3');
  const [targetSecondary, setTargetSecondary] = useState('5');
  const [targetDirectPost, setTargetDirectPost] = useState('4');

  const canEdit = dataService.canEditCampaign();
  const currentRole = dataService.getCurrentRole();

  useEffect(() => {
    if (campaign) {
      setName(campaign.name || '');
      setDescription(campaign.description || '');
      setBrief(campaign.brief || '');
      setStartDate(campaign.startDate || '');
      setEndDate(campaign.endDate || '');
      setStatus(campaign.status || 'Active');
      setTargetOriginal(String(campaign.targetOriginal ?? 3));
      setTargetSecondary(String(campaign.targetSecondary ?? 5));
      setTargetDirectPost(String(campaign.targetDirectPost ?? 4));
    }
  }, [campaign]);

  if (!isOpen || !campaign) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert('【权限拦截】Campaign 调整权限仅限广汽国际 (Me) 操作！');
      return;
    }

    if (!name.trim()) {
      alert('请填写 Campaign 名称');
      return;
    }

    const updated: Campaign = {
      ...campaign,
      name: name.trim(),
      description: description.trim(),
      brief: brief.trim(),
      startDate,
      endDate,
      status,
      targetOriginal: parseInt(targetOriginal, 10) || 0,
      targetSecondary: parseInt(targetSecondary, 10) || 0,
      targetDirectPost: parseInt(targetDirectPost, 10) || 0,
      updatedAt: new Date().toISOString(),
    };

    dataService.updateCampaign(updated);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">调整 Campaign 时间与设置</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permission Banner */}
        {!canEdit ? (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-900">
            <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-950">当前为【省广代理商】身份 (只读查看)</div>
              <div className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                依据权限规则：省广支持创建新 Campaign，但<strong>后期修改与排期调整权限仅开放给广汽国际 (Me)</strong>。
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-6 mt-4 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>广汽国际权限：已启用 Campaign 排期与全局参数调整权限</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 pt-3 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign 名称 *</label>
            <input
              type="text"
              disabled={!canEdit}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 text-xs border rounded-lg font-bold ${
                !canEdit
                  ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                  : 'border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none'
              }`}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">开始日期</label>
              <input
                type="date"
                disabled={!canEdit}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-3 py-2 text-xs border rounded-lg font-mono font-semibold ${
                  !canEdit
                    ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                    : 'border-indigo-200 bg-indigo-50/30 focus:ring-2 focus:ring-indigo-500 focus:outline-none'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">结束日期</label>
              <input
                type="date"
                disabled={!canEdit}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full px-3 py-2 text-xs border rounded-lg font-mono font-semibold ${
                  !canEdit
                    ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                    : 'border-indigo-200 bg-indigo-50/30 focus:ring-2 focus:ring-indigo-500 focus:outline-none'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">活动状态</label>
              <select
                disabled={!canEdit}
                value={status}
                onChange={(e) => setStatus(e.target.value as Campaign['status'])}
                className={`w-full px-3 py-2 text-xs border rounded-lg ${
                  !canEdit
                    ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                    : 'border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none'
                }`}
              >
                <option value="Active">进行中 (Active)</option>
                <option value="Completed">已结束 (Completed)</option>
                <option value="Archived">已归档 (Archived)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">原创篇数目标</label>
              <input
                type="number"
                disabled={!canEdit}
                min="0"
                value={targetOriginal}
                onChange={(e) => setTargetOriginal(e.target.value)}
                className={`w-full px-3 py-2 text-xs border rounded-lg ${
                  !canEdit
                    ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                    : 'border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">二创篇数目标</label>
              <input
                type="number"
                disabled={!canEdit}
                min="0"
                value={targetSecondary}
                onChange={(e) => setTargetSecondary(e.target.value)}
                className={`w-full px-3 py-2 text-xs border rounded-lg ${
                  !canEdit
                    ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                    : 'border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">直发篇数目标</label>
              <input
                type="number"
                disabled={!canEdit}
                min="0"
                value={targetDirectPost}
                onChange={(e) => setTargetDirectPost(e.target.value)}
                className={`w-full px-3 py-2 text-xs border rounded-lg ${
                  !canEdit
                    ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                    : 'border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">项目简介</label>
            <textarea
              rows={2}
              disabled={!canEdit}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-3 py-2 text-xs border rounded-lg ${
                !canEdit
                  ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                  : 'border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">通用 Brief 提纲</label>
            <textarea
              rows={3}
              disabled={!canEdit}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              className={`w-full px-3 py-2 text-xs border rounded-lg ${
                !canEdit
                  ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                  : 'border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none'
              }`}
            />
          </div>

          {canEdit && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800">
              💡 提示：广汽国际管理员调整 Campaign 时间与目标后，将立即对全网及关联的 Content 生效。
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              {canEdit ? '取消' : '关闭'}
            </button>

            {canEdit ? (
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              >
                保存调整
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-200 text-slate-400 cursor-not-allowed flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>仅广汽国际拥有保存权限</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
