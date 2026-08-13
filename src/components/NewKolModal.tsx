import React, { useState } from 'react';
import { X } from 'lucide-react';
import { dataService } from '../services/dataService';
import { Platform } from '../types';

interface NewKolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (kolId: string) => void;
}

export const NewKolModal: React.FC<NewKolModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<Platform>('小红书');
  const [followers, setFollowers] = useState('50.0万');
  const [profileUrl, setProfileUrl] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('请填写 KOL 名字');
      return;
    }

    const created = dataService.addKol({
      name: name.trim(),
      platform,
      followers: followers.trim() || '10.0万',
      profileUrl: profileUrl.trim() || `https://${platform.toLowerCase()}.com/user/${Date.now()}`,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      contact: contact.trim(),
      notes: notes.trim(),
    });

    onSuccess(created.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-base font-bold text-slate-900">录入新 KOL 达人</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">达人名称 / 昵称 *</label>
            <input
              type="text"
              placeholder="例如：时尚美妆小K"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">主发平台</label>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">主页链接 Profile URL</label>
            <input
              type="url"
              placeholder="https://..."
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">商务联系方式</label>
            <input
              type="text"
              placeholder="微信 / 电话 / MCN机构名称..."
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">合作备注 / 风格特点</label>
            <textarea
              rows={2}
              placeholder="例如：履约好，擅长人像成分种草，改稿意愿强..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              保存 KOL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
