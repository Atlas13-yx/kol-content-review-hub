import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { KOL, KolTier, KolRosterStatus } from '../types';
import { formatMetricNumber } from '../utils/kolMetrics';
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
  Shield,
  Crown,
  Layers,
  TrendingUp,
  Link as LinkIcon,
  Eye,
  ThumbsUp,
  FileText,
  X,
  Star,
  Video,
  Award,
  BarChart3,
  Percent,
  SlidersHorizontal,
  ChevronRight,
  Flame,
  Trash2,
} from 'lucide-react';
import { NewKolModal } from '../components/NewKolModal';

interface KolsPageProps {
  onNavigate: (page: string, params?: { id?: string }) => void;
  onOpenNewKol: () => void;
}

export const KolsPage: React.FC<KolsPageProps> = ({ onNavigate, onOpenNewKol }) => {
  const [kols, setKols] = useState<KOL[]>([]);
  const [search, setSearch] = useState('');

  // 统一达人库标签过滤器状态
  const [rosterFilter, setRosterFilter] = useState<'ALL' | KolRosterStatus>('ALL');
  const [tierFilter, setTierFilter] = useState<'ALL' | KolTier>('ALL');
  const [outputTypeFilter, setOutputTypeFilter] = useState<string>('ALL');
  const [customTagFilter, setCustomTagFilter] = useState<string>('ALL');
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');

  // 自定义标签行内管理与修改状态
  const [inlineNewTag, setInlineNewTag] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingTagInput, setEditingTagInput] = useState('');
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  // Edit KOL Modal State
  const [editingKol, setEditingKol] = useState<KOL | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Quick Tag Popover State
  const [activeTagKolId, setActiveTagKolId] = useState<string | null>(null);
  const [customNewTagInput, setCustomNewTagInput] = useState('');

  useEffect(() => {
    const update = () => {
      setKols(dataService.getKols());
    };
    update();
    return dataService.subscribe(update);
  }, []);

  const contents = dataService.getContents();
  const allAvailableTags = dataService.getAllAvailableTags();
  const allCustomTags = dataService.getAllCustomTags();
  const standardOutputTypes = ['原创', '二创', '直发'];

  // Filtered KOLs Logic
  const filteredKols = kols.filter((kol) => {
    // 1. Search Query
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const nameMatch = kol.name.toLowerCase().includes(q);
      const tagMatch = (kol.tags || []).some((t) => t.toLowerCase().includes(q));
      const platformMatch = kol.platform.toLowerCase().includes(q);
      const categoryMatch = (kol.category || '').toLowerCase().includes(q);
      const worksMatch = (kol.pastWorks || []).some(
        (w) => w.title.toLowerCase().includes(q) || (w.highlights || '').toLowerCase().includes(q)
      );
      if (!nameMatch && !tagMatch && !platformMatch && !categoryMatch && !worksMatch) return false;
    }

    // 2. Roster Status Filter
    if (rosterFilter !== 'ALL') {
      const currentRoster = kol.rosterStatus || (kol.tags?.includes('黑名单') ? '黑名单' : '白名单');
      if (currentRoster !== rosterFilter) return false;
    }

    // 3. Tier Filter
    if (tierFilter !== 'ALL') {
      const currentTier = kol.tier || (kol.tags?.includes('头部') ? '头部' : kol.tags?.includes('尾部') ? '尾部' : '腰部');
      if (currentTier !== tierFilter) return false;
    }

    // 4. Output Type Filter
    if (outputTypeFilter !== 'ALL') {
      const outputTypes = kol.outputTypes || [];
      const tags = kol.tags || [];
      if (!outputTypes.includes(outputTypeFilter) && !tags.includes(outputTypeFilter)) return false;
    }

    // 5. Custom Tag Filter
    if (customTagFilter !== 'ALL') {
      const tags = kol.tags || [];
      const custom = kol.customTags || [];
      if (!tags.includes(customTagFilter) && !custom.includes(customTagFilter)) return false;
    }

    // 6. Platform Filter
    if (platformFilter !== 'ALL') {
      if (kol.platform !== platformFilter) return false;
    }

    return true;
  });

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

  // 添加自设标签
  const handleAddInlineTag = () => {
    const clean = inlineNewTag.trim();
    if (!clean) return;
    dataService.addGlobalCustomTag(clean);
    setInlineNewTag('');
    setCustomTagFilter(clean);
  };

  // 修改保存自设标签
  const handleSaveEditTag = (oldTag: string) => {
    const cleanNew = editingTagInput.trim();
    if (!cleanNew) {
      setEditingTag(null);
      return;
    }
    dataService.renameGlobalCustomTag(oldTag, cleanNew);
    if (customTagFilter === oldTag) {
      setCustomTagFilter(cleanNew);
    }
    setEditingTag(null);
    setEditingTagInput('');
  };

  // 删除自设标签
  const handleDeleteTag = (tag: string) => {
    setTagToDelete(tag);
  };

  const handleConfirmDeleteTag = (tag: string) => {
    dataService.removeGlobalCustomTag(tag);
    if (customTagFilter === tag) {
      setCustomTagFilter('ALL');
    }
    setTagToDelete(null);
  };

  const handleCreateAndAddCustomTag = (kolId: string) => {
    if (!customNewTagInput.trim()) return;
    dataService.addKolTag(kolId, customNewTagInput.trim());
    setCustomNewTagInput('');
  };

  const handleOpenEditModal = (kol: KOL) => {
    setEditingKol(kol);
    setIsEditModalOpen(true);
  };

  // Helper badge styles
  const getRosterBadge = (status?: KolRosterStatus, tags?: string[]) => {
    const finalStatus = status || (tags?.includes('黑名单') ? '黑名单' : '白名单');
    if (finalStatus === '白名单') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          白名单
        </span>
      );
    }
    if (finalStatus === '黑名单') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
          <ShieldAlert className="w-3 h-3 text-rose-600" />
          黑名单
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200">
        <Shield className="w-3 h-3 text-slate-500" />
        常规考察
      </span>
    );
  };

  const getTierBadge = (tier?: KolTier, tags?: string[]) => {
    const finalTier = tier || (tags?.includes('头部') ? '头部' : tags?.includes('尾部') ? '尾部' : '腰部');
    if (finalTier === '头部') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Crown className="w-3 h-3 text-amber-500" />
          头部大V
        </span>
      );
    }
    if (finalTier === '腰部') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Layers className="w-3 h-3 text-blue-500" />
          腰部中坚
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-teal-50 text-teal-700 border border-teal-200">
        <TrendingUp className="w-3 h-3 text-teal-500" />
        尾部/KOC
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 whitespace-nowrap flex items-center gap-2">
              达人库
              <span className="text-sm font-normal text-slate-500">
                ({filteredKols.length} / {kols.length} 位达人档案)
              </span>
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 whitespace-nowrap flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              统一标签体系 + 往期数据与作品直连
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            聚合黑白名单、达人定位（头部/腰部/尾部）、产出类型（原创/二创/直发）与自定义标签；支持录入与查看达人过往均播、爆款播放量、互动率及发布作品链接。
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenNewKol}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>录入新达人与往期数据</span>
          </button>
        </div>
      </div>

      {/* UNIFIED TAGS & MULTI-DIMENSIONAL FILTER SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-2xs">
        {/* Search and Platform row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索达人昵称、作品标题、分类标签、国家地区或主页链接..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-slate-500 shrink-0">平台:</span>
            {['ALL', 'Tiktok', 'Youtube', 'Instagram', 'Facebook'].map((plat) => (
              <button
                key={plat}
                onClick={() => setPlatformFilter(plat)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium whitespace-nowrap transition-colors ${
                  platformFilter === plat
                    ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {plat === 'ALL' ? '全部平台' : plat}
              </button>
            ))}
          </div>
        </div>

        {/* Unified Tag Filters Bar */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. 黑白名单分类 */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>黑白名单分类</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'ALL', label: '全部' },
                { id: '白名单', label: '🟢 白名单' },
                { id: '普通', label: '⚪ 常规' },
                { id: '黑名单', label: '🔴 黑名单' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setRosterFilter(item.id as any)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                    rosterFilter === item.id
                      ? item.id === '黑名单'
                        ? 'bg-rose-600 text-white border-rose-600 font-semibold shadow-2xs'
                        : item.id === '白名单'
                        ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-2xs'
                        : 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 定位梯队 */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>达人梯队定位</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'ALL', label: '全部' },
                { id: '头部', label: '👑 头部' },
                { id: '腰部', label: '⭐ 腰部' },
                { id: '尾部', label: '🌱 尾部' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTierFilter(item.id as any)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                    tierFilter === item.id
                      ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. 产出类型 */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>主要产出类型</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={outputTypeFilter}
                onChange={(e) => setOutputTypeFilter(e.target.value)}
                className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
              >
                <option value="ALL">全部产出类型 (不限)</option>
                {standardOutputTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 4. 自定义标签行：直接支持筛选、行内新增、点笔修改名称、点叉删除 */}
        <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 shrink-0 mr-1">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              自定义标签:
            </span>

            {/* 全部按钮 */}
            <button
              type="button"
              onClick={() => setCustomTagFilter('ALL')}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                customTagFilter === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              全部
            </button>

            {/* 自定义标签列表 */}
            {allCustomTags.map((tag) => {
              const isSelected = customTagFilter === tag;
              const isEditingThis = editingTag === tag;

              // 行内修改中
              if (isEditingThis) {
                return (
                  <div
                    key={tag}
                    className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-300 rounded-lg p-0.5 shadow-2xs"
                  >
                    <span className="text-xs text-indigo-500 pl-1.5 font-bold">#</span>
                    <input
                      type="text"
                      value={editingTagInput}
                      autoFocus
                      onChange={(e) => setEditingTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEditTag(tag);
                        if (e.key === 'Escape') setEditingTag(null);
                      }}
                      className="w-24 text-xs px-1.5 py-0.5 bg-white border border-indigo-200 rounded text-slate-800 font-medium focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEditTag(tag)}
                      className="p-1 text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      title="保存修改"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTag(null)}
                      className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="取消"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={tag}
                  className={`group inline-flex items-center rounded-lg text-xs transition-all border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-2xs'
                      : 'bg-indigo-50/70 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  {/* 点击标签筛选 */}
                  <button
                    type="button"
                    onClick={() => setCustomTagFilter(isSelected ? 'ALL' : tag)}
                    className="px-2.5 py-1 flex items-center gap-1 cursor-pointer"
                    title="点击按此标签筛选达人"
                  >
                    <span className="opacity-60 text-[11px]">#</span>
                    <span>{tag}</span>
                  </button>

                  {/* 就地修改名称 & 删除操作 */}
                  <div className="flex items-center pr-1 pl-0.5 border-l border-indigo-200/60">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTag(tag);
                        setEditingTagInput(tag);
                      }}
                      className={`p-0.5 rounded transition-colors cursor-pointer ${
                        isSelected
                          ? 'text-white/80 hover:text-white hover:bg-indigo-700'
                          : 'text-indigo-400 hover:text-indigo-700 hover:bg-indigo-200/50'
                      }`}
                      title="点击修改此标签名称"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTag(tag);
                      }}
                      className={`p-0.5 rounded transition-colors cursor-pointer ${
                        isSelected
                          ? 'text-white/80 hover:text-rose-200 hover:bg-rose-700'
                          : 'text-indigo-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                      title="删除此标签"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 快速新增标签输入框 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">#</span>
              <input
                type="text"
                placeholder="直接输入新标签..."
                value={inlineNewTag}
                onChange={(e) => setInlineNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddInlineTag();
                }}
                className="pl-6 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none w-36 sm:w-44 font-medium"
              />
            </div>
            <button
              type="button"
              onClick={handleAddInlineTag}
              disabled={!inlineNewTag.trim()}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>添加</span>
            </button>
          </div>
        </div>
      </div>

      {/* KOL Grid */}
      {filteredKols.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Tag className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">没有符合筛选条件的达人</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            未找到匹配的达人档案。您可以重置筛选条件，或点击右上角录入新达人并录入其往期数据与作品链接。
          </p>
          <button
            onClick={() => {
              setSearch('');
              setRosterFilter('ALL');
              setTierFilter('ALL');
              setOutputTypeFilter('ALL');
              setCustomTagFilter('ALL');
              setPlatformFilter('ALL');
            }}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
          >
            重置所有筛选条件
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredKols.map((kol) => {
            const isTagModalOpen = activeTagKolId === kol.id;
            const kolContents = contents.filter((c) => c.kolId === kol.id);
            const m = kol.historicalMetrics || {};
            const pastWorks = kol.pastWorks || [];

            return (
              <div
                key={kol.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Row: Badges & Edit Button */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {getRosterBadge(kol.rosterStatus, kol.tags)}
                      {getTierBadge(kol.tier, kol.tags)}
                      {kol.region && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
                          {kol.region}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenEditModal(kol)}
                      className="text-slate-400 hover:text-indigo-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                      title="编辑达人档案、统一标签及过往作品"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* KOL Header Profile */}
                  <div className="flex items-start gap-3 mb-4">
                    <img
                      src={kol.avatar}
                      alt={kol.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3
                          onClick={() => onNavigate('kol-detail', { id: kol.id })}
                          className="text-sm font-bold text-slate-900 truncate hover:text-indigo-600 cursor-pointer"
                          title={kol.name}
                        >
                          {kol.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {kol.platform}
                        </span>
                        <span>粉丝：{kol.followers}</span>
                        {m.cooperationRating && (
                          <span className="flex items-center gap-0.5 text-amber-600 font-bold text-[11px]">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {m.cooperationRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Main Profile URL Strip */}
                  <div className="mb-3 p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <LinkIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      {kol.profileUrl ? (
                        <a
                          href={kol.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-700 hover:text-indigo-600 truncate text-[11px] font-mono hover:underline"
                          title={kol.profileUrl}
                        >
                          {kol.profileUrl.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">未设置主页链接</span>
                      )}
                    </div>
                    {kol.profileUrl && (
                      <a
                        href={kol.profileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-indigo-600 shrink-0 p-1"
                        title="在新标签页中打开达人主页"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* HISTORICAL METRICS PANEL */}
                  <div className="mb-3 p-3 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <BarChart3 className="w-3 h-3 text-indigo-600" />
                        过往历史参考数据
                      </span>
                      <span className="text-[10px] text-indigo-600 font-semibold">
                        已收录作品: {pastWorks.length} 篇
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-200/60">
                      <div className="bg-white/80 p-1.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">历史均播</span>
                        <span className="text-xs font-bold text-slate-900 font-mono">
                          {m.avgViews ? formatMetricNumber(m.avgViews) : kol.followers}
                        </span>
                      </div>

                      <div className="bg-white/80 p-1.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">爆款最高播</span>
                        <span className="text-xs font-bold text-indigo-600 font-mono">
                          {m.highestViews ? formatMetricNumber(m.highestViews) : '—'}
                        </span>
                      </div>

                      <div className="bg-white/80 p-1.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">平均点赞/互动</span>
                        <span className="text-xs font-bold text-emerald-600 font-mono">
                          {m.avgLikes
                            ? formatMetricNumber(m.avgLikes)
                            : m.avgEngagementRate
                            ? `${m.avgEngagementRate}%`
                            : '6.8%'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PAST WORKS PREVIEW STRIP (NEW) */}
                  <div className="mb-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <Video className="w-3 h-3 text-purple-600" />
                        过往代表作链接 ({pastWorks.length})
                      </span>
                      <button
                        onClick={() => handleOpenEditModal(kol)}
                        className="text-[10px] text-indigo-600 hover:underline font-semibold"
                      >
                        + 录入作品
                      </button>
                    </div>

                    {pastWorks.length === 0 ? (
                      <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-50/60 rounded-lg border border-dashed border-slate-200">
                        暂未录入过往作品链接
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {pastWorks.slice(0, 2).map((work) => (
                          <div
                            key={work.id}
                            className="p-1.5 px-2 bg-slate-50 hover:bg-indigo-50/50 rounded-lg border border-slate-200/70 flex items-center justify-between gap-2 text-xs transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-[11px] font-semibold text-slate-800 truncate block">
                                {work.title}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {work.platform} · {work.category || '测评'} · 播: {work.views || '—'}
                              </span>
                            </div>
                            {work.url && (
                              <a
                                href={work.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 text-indigo-600 hover:text-indigo-800 bg-white rounded border border-slate-200 shadow-2xs shrink-0"
                                title="打开往期发布作品"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* UNIFIED TAGS DISPLAY ON CARD */}
                  <div className="mb-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        达人标签
                      </span>
                      <button
                        onClick={() => {
                          setActiveTagKolId(isTagModalOpen ? null : kol.id);
                          setCustomNewTagInput('');
                        }}
                        className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-100 transition-colors"
                      >
                        {isTagModalOpen ? '收起' : '+ 打标'}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1 min-h-[24px]">
                      {(kol.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                            tag === '白名单'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                              : tag === '黑名单'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
                              : tag === '头部' || tag === '腰部' || tag === '尾部'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                              : standardOutputTypes.includes(tag)
                              ? 'bg-purple-50 text-purple-700 border-purple-200 font-medium'
                              : 'bg-slate-100 text-slate-700 border-slate-200 font-medium'
                          }`}
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
                      ))}
                    </div>

                    {/* Inline Quick Tag Editor Popover */}
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

                        {/* Available Tags list */}
                        <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
                          {allAvailableTags.map((tag) => {
                            const isTagged = (kol.tags || []).includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleToggleTag(kol.id, tag)}
                                className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 transition-colors ${
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
                </div>

                {/* Card Footer Actions */}
                <div className="mt-2 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    任务: {kolContents.length} 个
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(kol)}
                      className="text-xs text-slate-600 hover:text-indigo-600 font-medium px-2 py-1 rounded hover:bg-slate-100"
                    >
                      编辑/录入
                    </button>
                    <button
                      onClick={() => onNavigate('kol-detail', { id: kol.id })}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors"
                    >
                      <span>详情档案</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit KOL Modal */}
      {isEditModalOpen && (
        <NewKolModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingKol(null);
          }}
          onSuccess={() => {
            setKols(dataService.getKols());
            setIsEditModalOpen(false);
            setEditingKol(null);
          }}
          initialKol={editingKol || undefined}
        />
      )}

      {/* Custom Delete Tag Confirmation Modal */}
      {tagToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  确认删除自设标签「#{tagToDelete}」？
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  删除后，相关达人档案中的该标签也将同步清理。
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTagToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteTag(tagToDelete)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DataService_STANDARD_OUTPUT_TYPES = [
  '试驾测评',
  '深度解析',
  '出海溯源',
  '家庭自驾',
  '趣味剧情',
  '开箱体验',
  '街头访谈',
  '技术拆解',
  '生活Vlog',
];
