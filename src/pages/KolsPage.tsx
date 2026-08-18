import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { KOL } from '../types';
import {
  Plus,
  ExternalLink,
  Tag,
  Search,
  Check,
  Edit2,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Link,
  Eye,
  ThumbsUp,
  FileText,
  X,
} from 'lucide-react';

interface KolsPageProps {
  onNavigate: (page: string, params?: { id?: string }) => void;
  onOpenNewKol: () => void;
}

export const KolsPage: React.FC<KolsPageProps> = ({ onNavigate, onOpenNewKol }) => {
  const [kols, setKols] = useState<KOL[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('ALL');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');

  // Inline Tag Add & Edit Popover State
  const [activeTagKolId, setActiveTagKolId] = useState<string | null>(null);
  const [customNewTagInput, setCustomNewTagInput] = useState('');

  // Inline Profile URL Edit Modal / State
  const [editingUrlKolId, setEditingUrlKolId] = useState<string | null>(null);
  const [tempProfileUrl, setTempProfileUrl] = useState('');

  useEffect(() => {
    const update = () => {
      setKols(dataService.getKols());
    };
    update();
    return dataService.subscribe(update);
  }, []);

  const contents = dataService.getContents();
  const allAvailableTags = dataService.getAllAvailableTags();

  // Filtered KOLs
  const filteredKols = kols.filter((kol) => {
    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const nameMatch = kol.name.toLowerCase().includes(q);
      const tagMatch = (kol.tags || []).some((t) => t.toLowerCase().includes(q));
      const platformMatch = kol.platform.toLowerCase().includes(q);
      const urlMatch = (kol.profileUrl || '').toLowerCase().includes(q);
      if (!nameMatch && !tagMatch && !platformMatch && !urlMatch) return false;
    }

    // Tag Filter
    if (selectedTagFilter !== 'ALL') {
      const tags = kol.tags || [];
      if (!tags.includes(selectedTagFilter)) return false;
    }

    // Platform Filter
    if (selectedPlatform !== 'ALL') {
      if (kol.platform !== selectedPlatform) return false;
    }

    return true;
  });

  const getTagBadgeStyle = (tag: string) => {
    if (tag === '白名单') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
    }
    if (tag === '黑名单') {
      return 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
    }
    if (tag.includes('S级') || tag.includes('核心')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold';
    }
    if (tag.includes('汽车') || tag.includes('垂类')) {
      return 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
    }
    if (tag.includes('二创')) {
      return 'bg-purple-50 text-purple-700 border-purple-200 font-medium';
    }
    if (tag.includes('直发')) {
      return 'bg-teal-50 text-teal-700 border-teal-200 font-medium';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
  };

  const handleToggleTag = (kolId: string, tag: string) => {
    const kol = kols.find((k) => k.id === kolId);
    if (!kol) return;
    const currentTags = kol.tags || [];
    if (currentTags.includes(tag)) {
      dataService.removeKolTag(kolId, tag);
    } else {
      dataService.addKolTag(kolId, tag);
    }
  };

  const handleCreateAndAddCustomTag = (kolId: string) => {
    if (!customNewTagInput.trim()) return;
    dataService.addKolTag(kolId, customNewTagInput.trim());
    setCustomNewTagInput('');
  };

  const handleSaveProfileUrl = (kolId: string) => {
    if (!tempProfileUrl.trim()) return;
    dataService.updateKolProfileUrl(kolId, tempProfileUrl.trim());
    setEditingUrlKolId(null);
    setTempProfileUrl('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 whitespace-nowrap">
              达人库 ({filteredKols.length} / {kols.length})
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200 whitespace-nowrap">
              支持自建标签分类 & 主页跳转链接管理
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            支持白名单、黑名单及自定义添加专属标签；新建 Content 时无需选择标签，可在达人库中随时灵活管理与分类。
          </p>
        </div>

        <button
          onClick={onOpenNewKol}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-colors self-start md:self-auto whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">录入新达人</span>
        </button>
      </div>

      {/* Filter & Tag Category Selection Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3.5">
        {/* Search & Platform */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索达人姓名、主页链接、自建标签关键词..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">全部平台 (All Platforms)</option>
              <option value="Tiktok">Tiktok</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="Youtube">Youtube</option>
              <option value="其他">其他</option>
            </select>
          </div>
        </div>

        {/* Tag Category Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mr-1">
            <Tag className="w-3.5 h-3.5 text-indigo-600" />
            达人标签筛选：
          </span>

          <button
            onClick={() => setSelectedTagFilter('ALL')}
            className={`text-xs px-3 py-1 rounded-lg border transition-all ${
              selectedTagFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            全部 ({kols.length})
          </button>

          {allAvailableTags.map((t) => {
            const count = kols.filter((k) => (k.tags || []).includes(t)).length;
            const isSelected = selectedTagFilter === t;
            let activeClass = 'bg-indigo-600 text-white border-indigo-600 font-semibold';
            if (t === '白名单') activeClass = 'bg-emerald-700 text-white border-emerald-700 font-semibold';
            if (t === '黑名单') activeClass = 'bg-rose-700 text-white border-rose-700 font-semibold';

            return (
              <button
                key={t}
                onClick={() => setSelectedTagFilter(t)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? activeClass
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {t === '白名单' && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                {t === '黑名单' && <ShieldAlert className="w-3 h-3 text-rose-500" />}
                <span>{t}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KOL Grid */}
      {filteredKols.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          <p>未找到符合筛选条件的达人</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedTagFilter('ALL');
              setSelectedPlatform('ALL');
            }}
            className="mt-3 text-indigo-600 font-semibold hover:underline"
          >
            重置所有筛选
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredKols.map((kol) => {
            const kolContents = contents.filter((c) => c.kolId === kol.id);
            const tags = kol.tags || [];

            // Performance sum
            let totalViews = 0;
            let totalLikes = 0;
            kolContents.forEach((c) => {
              if (c.performanceData) {
                totalViews += c.performanceData.views || 0;
                totalLikes += c.performanceData.likes || 0;
              }
            });

            const isTagModalOpen = activeTagKolId === kol.id;

            return (
              <div
                key={kol.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between relative"
              >
                <div>
                  {/* KOL Top Info */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div
                      onClick={() => onNavigate('kol-detail', { id: kol.id })}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <img
                        src={kol.avatar}
                        alt={kol.name}
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-xs"
                      />
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                          {kol.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {kol.platform}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {kol.followers || '10万+'} 粉丝
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile URL Link & Manual Edit Entry */}
                  <div className="mb-3 p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                        <Link className="w-3 h-3 text-slate-400" />
                        主页链接:
                      </span>
                      <button
                        onClick={() => {
                          setEditingUrlKolId(kol.id);
                          setTempProfileUrl(kol.profileUrl || '');
                        }}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-0.5"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                        {kol.profileUrl ? '修改' : '添加链接'}
                      </button>
                    </div>

                    <div className="mt-1 flex items-center justify-between">
                      {kol.profileUrl ? (
                        <a
                          href={kol.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-800 hover:text-indigo-600 font-mono text-[11px] truncate max-w-[170px] inline-block underline decoration-slate-300 hover:decoration-indigo-500"
                          title={kol.profileUrl}
                        >
                          {kol.profileUrl.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">未设置主页链接</span>
                      )}

                      {kol.profileUrl && (
                        <a
                          href={kol.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 shadow-2xs"
                          title="在新窗口打开达人主页"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Tag Management Section on Card */}
                  <div className="mb-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        达人标签 ({tags.length})
                      </span>
                      <button
                        onClick={() => {
                          setActiveTagKolId(isTagModalOpen ? null : kol.id);
                          setCustomNewTagInput('');
                        }}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-100 transition-colors"
                      >
                        {isTagModalOpen ? '收起' : '+ 添加/管理标签'}
                      </button>
                    </div>

                    {/* Tag list */}
                    <div className="flex flex-wrap gap-1 min-h-[26px]">
                      {tags.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">暂无标签</span>
                      ) : (
                        tags.map((tag) => (
                          <span
                            key={tag}
                            className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 ${getTagBadgeStyle(
                              tag
                            )}`}
                          >
                            {tag}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dataService.removeKolTag(kol.id, tag);
                              }}
                              className="text-slate-400 hover:text-rose-600 ml-0.5"
                              title="移除此标签"
                            >
                              ×
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    {/* Dropdown Tag Editor Popup */}
                    {isTagModalOpen && (
                      <div className="mt-2 p-3 bg-white rounded-xl border border-indigo-200 shadow-lg space-y-2.5 z-20 animate-in fade-in zoom-in-95 duration-100">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                          <span>为【{kol.name}】打标签：</span>
                          <button
                            onClick={() => setActiveTagKolId(null)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Existing available tags toggle */}
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                          {allAvailableTags.map((tag) => {
                            const isTagged = tags.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleToggleTag(kol.id, tag)}
                                className={`text-[11px] px-2 py-0.5 rounded-md border flex items-center gap-1 transition-colors ${
                                  isTagged
                                    ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {isTagged && <Check className="w-2.5 h-2.5" />}
                                {tag}
                              </button>
                            );
                          })}
                        </div>

                        {/* Custom New Tag Input */}
                        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="自建新标签..."
                            value={customNewTagInput}
                            onChange={(e) => setCustomNewTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCreateAndAddCustomTag(kol.id);
                              }
                            }}
                            className="w-full px-2 py-1 text-[11px] border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleCreateAndAddCustomTag(kol.id)}
                            className="px-2 py-1 text-[11px] bg-slate-900 text-white rounded font-medium hover:bg-slate-800 shrink-0"
                          >
                            + 添加
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Aggregate Performance metrics */}
                  <div className="text-xs text-slate-500 space-y-1.5 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Eye className="w-3.5 h-3.5 text-blue-500" />
                        累计播放量
                      </span>
                      <span className="font-bold text-slate-900 font-mono">
                        {totalViews > 0 ? totalViews.toLocaleString() : '未录入'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 text-slate-500">
                        <ThumbsUp className="w-3.5 h-3.5 text-rose-500" />
                        累计互动/点赞
                      </span>
                      <span className="font-bold text-slate-900 font-mono">
                        {totalLikes > 0 ? totalLikes.toLocaleString() : '未录入'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    合作任务 ({kolContents.length})
                  </span>
                  <button
                    onClick={() => onNavigate('kol-detail', { id: kol.id })}
                    className="text-indigo-600 font-semibold hover:underline flex items-center gap-0.5"
                  >
                    查看达人档案 →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Profile URL Edit Modal */}
      {editingUrlKolId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Link className="w-4 h-4 text-indigo-600" />
                编辑达人主页跳转链接
              </h3>
              <button
                onClick={() => setEditingUrlKolId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                主页链接 URL (Profile URL)
              </label>
              <input
                type="url"
                placeholder="https://xiaohongshu.com/user/profile/... 或 https://douyin.com/..."
                value={tempProfileUrl}
                onChange={(e) => setTempProfileUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingUrlKolId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleSaveProfileUrl(editingUrlKolId)}
                className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
              >
                保存主页链接
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
