import React, { useState } from 'react';
import { X, Tag, Plus, Check } from 'lucide-react';
import { dataService } from '../services/dataService';
import { Platform } from '../types';

interface NewKolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (kolId: string) => void;
}

export const NewKolModal: React.FC<NewKolModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<Platform>('Tiktok');
  const [followers, setFollowers] = useState('50.0万');
  const [profileUrl, setProfileUrl] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');

  const allAvailableTags = dataService.getAllAvailableTags();

  if (!isOpen) return null;

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    if (!customTagInput.trim()) return;
    const tag = customTagInput.trim();
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setCustomTagInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('请填写达人姓名');
      return;
    }

    const created = dataService.addKol({
      name: name.trim(),
      platform,
      followers: followers.trim() || '10.0万',
      profileUrl: profileUrl.trim(),
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      tags: selectedTags,
    });

    onSuccess(created.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-base font-bold text-slate-900">录入新合作达人</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              达人名称 / 昵称 *
            </label>
            <input
              type="text"
              placeholder="例如：极客老张、时尚美妆小K"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">合作发布平台</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Tiktok">Tiktok</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="Youtube">Youtube</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">粉丝量</label>
              <input
                type="text"
                placeholder="例如：85.2万"
                value={followers}
                onChange={(e) => setFollowers(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              达人主页跳转链接 (Profile URL)
            </label>
            <input
              type="url"
              placeholder="https://tiktok.com/@... 或 Instagram/Youtube主页"
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              手动填写达人主页链接后，可在达人库与详情中一键点击跳转访问。
            </p>
          </div>

          {/* Tags & Categories */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              达人标签（可选择白名单、黑名单或自建新标签）
            </label>

            {/* Quick Available Tags */}
            <div className="flex flex-wrap gap-1.5">
              {allAvailableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1 transition-all ${
                      isSelected
                        ? tag === '黑名单'
                          ? 'bg-rose-600 text-white border-rose-600 font-semibold'
                          : tag === '白名单'
                          ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                          : 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Custom Tag Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="输入自建标签名称（例如：欧洲重点达人、高互动）..."
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 shrink-0"
              >
                + 自建标签
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              录入并建档达人
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
