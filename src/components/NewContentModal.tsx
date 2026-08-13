import React, { useState } from 'react';
import { X } from 'lucide-react';
import { dataService } from '../services/dataService';
import { Platform, Stage, Status, CurrentOwner, ContentCategory } from '../types';

interface NewContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newContentId: string) => void;
}

export const NewContentModal: React.FC<NewContentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const campaigns = dataService.getCampaigns();
  const kols = dataService.getKols();

  const [campaignId, setCampaignId] = useState(campaigns[0]?.id || '');
  const [kolId, setKolId] = useState(kols[0]?.id || '');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<Platform>('小红书');
  const [category, setCategory] = useState<ContentCategory>('原创');
  const [stage, setStage] = useState<Stage>('Script');
  const [deadline, setDeadline] = useState('2026-08-25');
  const [briefText, setBriefText] = useState('');
  const [briefUrl, setBriefUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('请填写 Content 标题');
      return;
    }

    let status: Status = 'Waiting for KOL Script';
    let currentOwner: CurrentOwner = 'KOL';

    if (stage === 'Brief') {
      status = 'Brief Sent';
      currentOwner = 'KOL';
    } else if (stage === 'Script') {
      status = 'Waiting for KOL Script';
      currentOwner = 'KOL';
    }

    const created = dataService.addContent({
      campaignId,
      kolId,
      title: title.trim(),
      topic: topic.trim() || '通用推广主题',
      platform,
      category,
      stage,
      status,
      currentOwner,
      owner: '广汽国际',
      deadline,
      briefText,
      briefUrl,
      notes: '',
    });

    onSuccess(created.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-base font-bold text-slate-900">新建 KOL Content 审核任务</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">所属 Campaign *</label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">合作 KOL 达人 *</label>
              <select
                value={kolId}
                onChange={(e) => {
                  setKolId(e.target.value);
                  const selectedKol = kols.find((k) => k.id === e.target.value);
                  if (selectedKol) setPlatform(selectedKol.platform);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {kols.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} ({k.platform})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Content 任务标题 *</label>
            <input
              type="text"
              placeholder="例如：极客老张 × 2026巴黎车展广汽出海新车硬核测评"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">发布平台</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="小红书">小红书</option>
                <option value="抖音">抖音</option>
                <option value="B站">B站</option>
                <option value="微博">微博</option>
                <option value="视频号">视频号</option>
                <option value="其他">其他</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">内容类型</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ContentCategory)}
                className="w-full px-3 py-2 text-xs font-bold text-indigo-900 bg-indigo-50/50 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="原创">原创内容</option>
                <option value="二创">二创衍生</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">初始 Stage 阶段</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as Stage)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Brief">Brief 阶段</option>
                <option value="Script">Script 脚本阶段</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">截止日期 Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">内容核心主题 / Topic</label>
            <input
              type="text"
              placeholder="例如：户外出行无惧烈日，清爽不粘腻防晒种草"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Brief 要求说明</label>
            <textarea
              rows={3}
              placeholder="填写给达人的核心Brief要求、重点卖点、禁忌词等..."
              value={briefText}
              onChange={(e) => setBriefText(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Brief 文档 / 素材链接 (URL)</label>
            <input
              type="url"
              placeholder="https://docs.google.com/..."
              value={briefUrl}
              onChange={(e) => setBriefUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
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
              创建 Content 任务
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
