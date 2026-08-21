import React, { useState, useEffect } from 'react';
import {
  X,
  Tag,
  Plus,
  Check,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Crown,
  Sparkles,
  Layers,
  BarChart3,
  Video,
  Link as LinkIcon,
  ExternalLink,
  Trash2,
  AlertCircle,
  Star,
  Globe,
  Mail,
  FileText,
  TrendingUp,
  MessageSquare,
  Flame,
  ThumbsUp,
  Eye,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import {
  KOL,
  Platform,
  KolTier,
  KolRosterStatus,
  KolPastWork,
  KolHistoricalMetrics,
} from '../types';
import { computeMetricsFromPastWorks, formatMetricNumber } from '../utils/kolMetrics';

interface NewKolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (kolId: string) => void;
  initialKol?: KOL; // 若传入则为编辑模式，否则为新建录入
}

export const NewKolModal: React.FC<NewKolModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialKol,
}) => {
  const isEditMode = Boolean(initialKol);

  // Tab State: 仅两个清晰步骤（1. 基础与标签，2. 过往数据逐条录入）
  const [activeTab, setActiveTab] = useState<'profile' | 'works'>('profile');

  // Basic Info
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<Platform>('Tiktok');
  const [followers, setFollowers] = useState('50.0万');
  const [profileUrl, setProfileUrl] = useState('');
  const [avatar, setAvatar] = useState('');
  const [region, setRegion] = useState('');
  const [category, setCategory] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');

  // 统一达人库标签体系
  const [rosterStatus, setRosterStatus] = useState<KolRosterStatus>('白名单');
  const [tier, setTier] = useState<KolTier>('腰部');
  const [selectedOutputTypes, setSelectedOutputTypes] = useState<string[]>(['原创']);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');

  // 全局可用自定义标签库
  const globalCustomTags = dataService.getAllCustomTags();

  // 合作属性与履约评分
  const [cooperationRating, setCooperationRating] = useState<number>(5.0);
  const [historicalCooperationNotes, setHistoricalCooperationNotes] = useState<string>('');

  // 过往作品明细列表（一条条录入）
  const [pastWorks, setPastWorks] = useState<KolPastWork[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // 主要产出类型：原创 / 二创 / 直发
  const standardOutputTypes = ['原创', '二创', '直发'];

  // Initialize or Reset Form when modal opens or initialKol changes
  useEffect(() => {
    if (isOpen) {
      if (initialKol) {
        setName(initialKol.name || '');
        setPlatform(initialKol.platform || 'Tiktok');
        setFollowers(initialKol.followers || '10.0万');
        setProfileUrl(initialKol.profileUrl || '');
        setAvatar(initialKol.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
        setRegion(initialKol.region || '');
        setCategory(initialKol.category || '汽车出海');
        setContact(initialKol.contact || '');
        setNotes(initialKol.notes || '');

        setRosterStatus(initialKol.rosterStatus || (initialKol.tags?.includes('黑名单') ? '黑名单' : '白名单'));
        setTier(initialKol.tier || (initialKol.tags?.includes('头部') ? '头部' : initialKol.tags?.includes('尾部') ? '尾部' : '腰部'));
        setSelectedOutputTypes(
          initialKol.outputTypes && initialKol.outputTypes.length > 0
            ? initialKol.outputTypes
            : (initialKol.tags || []).filter((t) => standardOutputTypes.includes(t))
        );
        setCustomTags(
          initialKol.customTags ||
            (initialKol.tags || []).filter(
              (t) =>
                !['白名单', '黑名单', '普通', '头部', '腰部', '尾部', ...standardOutputTypes].includes(t)
            )
        );

        const m = initialKol.historicalMetrics || {};
        setCooperationRating(m.cooperationRating || 5.0);
        setHistoricalCooperationNotes(m.historicalCooperationNotes || '');

        // Past Works
        setPastWorks(initialKol.pastWorks || []);
      } else {
        // Reset defaults
        setName('');
        setPlatform('Tiktok');
        setFollowers('10.0万');
        setProfileUrl('');
        setAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
        setRegion('欧洲');
        setCategory('汽车科技');
        setContact('');
        setNotes('');
        setRosterStatus('白名单');
        setTier('腰部');
        setSelectedOutputTypes(['原创']);
        setCustomTags([]);
        setCustomTagInput('');
        setCooperationRating(5.0);
        setHistoricalCooperationNotes('');
        setPastWorks([]);
      }
      setActiveTab('profile');
    }
  }, [isOpen, initialKol]);

  if (!isOpen) return null;

  // Toggle Output Type Tag
  const handleToggleOutputType = (type: string) => {
    if (selectedOutputTypes.includes(type)) {
      if (selectedOutputTypes.length > 1) {
        setSelectedOutputTypes(selectedOutputTypes.filter((t) => t !== type));
      }
    } else {
      setSelectedOutputTypes([...selectedOutputTypes, type]);
    }
  };

  // Add Custom Tag
  const handleAddCustomTag = (tagToAdd?: string) => {
    const clean = (tagToAdd || customTagInput).trim();
    if (!clean) return;
    if (!customTags.includes(clean)) {
      setCustomTags([...customTags, clean]);
    }
    dataService.addGlobalCustomTag(clean);
    if (!tagToAdd) {
      setCustomTagInput('');
    }
  };

  // Toggle Custom Tag from Global Pool
  const handleToggleGlobalCustomTag = (tag: string) => {
    if (customTags.includes(tag)) {
      setCustomTags(customTags.filter((t) => t !== tag));
    } else {
      setCustomTags([...customTags, tag]);
    }
  };

  // Remove Custom Tag
  const handleRemoveCustomTag = (tagToRemove: string) => {
    setCustomTags(customTags.filter((t) => t !== tagToRemove));
  };

  // Add New Past Work Row (一条条录入)
  const handleAddPastWork = () => {
    const newWork: KolPastWork = {
      id: `pw-temp-${Date.now()}`,
      title: '',
      url: '',
      platform: platform,
      publishDate: new Date().toISOString().split('T')[0],
      views: '',
      likes: '',
      comments: '',
      category: selectedOutputTypes[0] || '原创',
      highlights: '',
      cooperatedBrand: '广汽国际',
    };
    setPastWorks([newWork, ...pastWorks]);
  };

  // Update Past Work Field
  const handleUpdatePastWork = (id: string, field: keyof KolPastWork, value: any) => {
    setPastWorks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Remove Past Work Row
  const handleRemovePastWork = (id: string) => {
    setPastWorks((prev) => prev.filter((item) => item.id !== id));
  };

  // 动态自动计算当前已录入数据的统计指标
  const liveComputedMetrics = computeMetricsFromPastWorks(pastWorks, {
    cooperationRating,
    historicalCooperationNotes,
  });

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError('请填写达人名称/昵称后再保存！');
      setActiveTab('profile');
      return;
    }

    // Filter valid past works (having at least title or url or views)
    const validPastWorks = pastWorks
      .filter((w) => w.title?.trim() || w.url?.trim() || w.views)
      .map((w) => ({
        ...w,
        title: w.title?.trim() || '未命名过往作品',
        url: w.url?.trim() || '',
      }));

    // 基于一条条真实录入的作品自动计算均播、峰值等指标
    const finalMetrics = computeMetricsFromPastWorks(validPastWorks, {
      cooperationRating,
      historicalCooperationNotes: historicalCooperationNotes.trim() || undefined,
    });

    // Synthesize all tags
    const allTags = Array.from(
      new Set([rosterStatus, tier, ...selectedOutputTypes, ...customTags])
    ).filter(Boolean);

    let savedKolId = initialKol?.id || '';

    if (isEditMode && initialKol) {
      dataService.updateKol({
        ...initialKol,
        name: name.trim(),
        platform,
        followers: followers.trim() || '10.0万',
        profileUrl: profileUrl.trim(),
        avatar: avatar.trim() || initialKol.avatar,
        rosterStatus,
        tier,
        outputTypes: selectedOutputTypes,
        customTags,
        tags: allTags,
        category: category.trim() || '汽车出海',
        region: region.trim() || undefined,
        contact: contact.trim() || undefined,
        notes: notes.trim() || undefined,
        historicalMetrics: finalMetrics,
        pastWorks: validPastWorks,
      });
    } else {
      const created = dataService.addKol({
        name: name.trim(),
        platform,
        followers: followers.trim() || '10.0万',
        profileUrl: profileUrl.trim() || `https://${platform.toLowerCase()}.com/@${name.trim()}`,
        avatar: avatar.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        rosterStatus,
        tier,
        outputTypes: selectedOutputTypes,
        customTags,
        tags: allTags,
        category: category.trim() || '汽车出海',
        region: region.trim() || undefined,
        contact: contact.trim() || undefined,
        notes: notes.trim() || undefined,
        historicalMetrics: finalMetrics,
        pastWorks: validPastWorks,
      });
      savedKolId = created.id;
    }

    onSuccess(savedKolId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              {isEditMode ? '改' : '录'}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditMode ? `编辑达人档案【${initialKol?.name}】` : '录入新达人与过往数据明细'}
              </h2>
              <p className="text-xs text-slate-500">
                达人基础信息、标签管理与过往作品数据逐条录入（系统将自动聚合计算均值）
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation: 仅两步 */}
        <div className="px-6 border-b border-slate-200 flex items-center gap-2 bg-white shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>1. 基础信息 & 标签体系</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('works')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'works'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>2. 过往数据与作品明细 (一条条录入)</span>
            {pastWorks.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                {pastWorks.length} 条
              </span>
            )}
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* TAB 1: Profile & Unified Tags System */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Basic Fields */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  达人账号基础信息
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      达人名称 / 昵称 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="例如：Alex Auto Paris"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      主要运营平台
                    </label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value as Platform)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="Tiktok">Tiktok</option>
                      <option value="Youtube">Youtube</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Facebook">Facebook</option>
                      <option value="其他">其他海外社媒</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      粉丝量 (含单位)
                    </label>
                    <input
                      type="text"
                      placeholder="例如：45.0万 或 1.2M"
                      value={followers}
                      onChange={(e) => setFollowers(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      达人主页 URL
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        placeholder="https://..."
                        value={profileUrl}
                        onChange={(e) => setProfileUrl(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                      />
                      <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      国家 / 地区
                    </label>
                    <input
                      type="text"
                      placeholder="例如：法国巴黎、中东迪拜、德国"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 🏷️ 统一达人库标签体系 */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  达人标签与梯队分类
                </h3>

                {/* 1. 黑白名单分类 */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      1. 黑白名单状态
                    </span>
                    <span className="text-[11px] text-slate-400">单选</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[
                      {
                        value: '白名单',
                        label: '🟢 白名单 (推荐合作 / 优质信誉)',
                        color: 'border-emerald-500 bg-emerald-50 text-emerald-800',
                      },
                      {
                        value: '普通',
                        label: '⚪ 常规达人 (待观察 / 储备)',
                        color: 'border-slate-300 bg-white text-slate-700',
                      },
                      {
                        value: '黑名单',
                        label: '🔴 黑名单 (风险达人 / 禁选)',
                        color: 'border-rose-500 bg-rose-50 text-rose-800',
                      },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setRosterStatus(item.value as KolRosterStatus)}
                        className={`flex-1 py-2 px-2.5 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer ${
                          rosterStatus === item.value
                            ? `${item.color} ring-2 ring-indigo-500 ring-offset-1`
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. 定位梯队 */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-500" />
                      2. 定位梯队 (头部 / 腰部 / 尾部)
                    </span>
                    <span className="text-[11px] text-slate-400">单选</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        value: '头部',
                        label: '👑 头部达人',
                        desc: '百万级大号 / 品牌声量主爆破',
                        activeClass: 'border-amber-400 bg-amber-50 text-amber-900',
                      },
                      {
                        value: '腰部',
                        label: '⭐ 腰部达人',
                        desc: '垂直硬核领域 / 高性价比转化',
                        activeClass: 'border-indigo-400 bg-indigo-50 text-indigo-900',
                      },
                      {
                        value: '尾部',
                        label: '🌱 尾部/KOC',
                        desc: '真实车主种草 / 大量铺量扩散',
                        activeClass: 'border-teal-400 bg-teal-50 text-teal-900',
                      },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setTier(item.value as KolTier)}
                        className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                          tier === item.value
                            ? `${item.activeClass} ring-2 ring-indigo-500 ring-offset-1 font-bold`
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-xs font-bold">{item.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. 主要产出类型：原创 / 二创 / 直发 */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      3. 主要产出类型 (原创 / 二创 / 直发)
                    </span>
                    <span className="text-[11px] text-slate-400">可多选</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {standardOutputTypes.map((type) => {
                      const isSelected = selectedOutputTypes.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleToggleOutputType(type)}
                          className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'border-purple-500 bg-purple-50 text-purple-800 font-bold ring-2 ring-purple-400 ring-offset-1'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <div className="text-xs">{type}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. 自定义自设标签 */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-indigo-600" />
                      4. 自设业务标签
                    </span>
                    <span className="text-[11px] text-slate-400">可直接输入或点击快速选用</span>
                  </div>

                  {/* Current Selected Custom Tags */}
                  <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-white rounded-lg border border-slate-200">
                    {customTags.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">暂无自设标签，可在下方添加</span>
                    ) : (
                      customTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium"
                        >
                          <span>#{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomTag(tag)}
                            className="text-indigo-400 hover:text-rose-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Add New Custom Tag Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="输入自建新标签（如：中东首选、高转化ROI、原片配合度高）..."
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomTag();
                        }
                      }}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCustomTag()}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>添加</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Contact & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    商务联系方式
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="例如：contact@kol.com / WhatsApp"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    达人头像图片 URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  达人合作属性与禁忌备注说明
                </label>
                <textarea
                  rows={2}
                  placeholder="例如：擅长法式精致质感拍摄，需提前3周沟通排期，支持原片提供与二创授权等..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Past Published Works & Individual Data Entry (一条条录入，自动计算均值) */}
          {activeTab === 'works' && (
            <div className="space-y-5">
              {/* 实时聚合看板：自动根据逐条录入的数据计算统计 */}
              <div className="p-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        过往数据智能聚合看板（基于下方一条条真实录入数据自动计算）
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        无需手动输入或推算平均数，录入单条作品后系统实时自动计算平均播放、最高爆款与平均点赞
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPastWork}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ 录入一条过往作品</span>
                  </button>
                </div>

                {/* 4 个自动计算核心指标 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] font-medium text-slate-500 block">已录入作品数</span>
                    <div className="text-sm font-bold text-slate-900 font-mono mt-0.5 flex items-center gap-1">
                      <Video className="w-3.5 h-3.5 text-purple-600" />
                      <span>{pastWorks.length} 条</span>
                    </div>
                    <span className="text-[10px] text-slate-400">明细条目</span>
                  </div>

                  <div className="bg-white/90 p-2.5 rounded-xl border border-indigo-100 shadow-2xs">
                    <span className="text-[10px] font-medium text-indigo-900 block">自动计算·均播量</span>
                    <div className="text-sm font-bold text-indigo-600 font-mono mt-0.5 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      <span>
                        {liveComputedMetrics.avgViews
                          ? formatMetricNumber(liveComputedMetrics.avgViews)
                          : '—'}
                      </span>
                    </div>
                    <span className="text-[10px] text-indigo-500">自动均值</span>
                  </div>

                  <div className="bg-white/90 p-2.5 rounded-xl border border-amber-100 shadow-2xs">
                    <span className="text-[10px] font-medium text-amber-900 block">自动计算·最高爆款</span>
                    <div className="text-sm font-bold text-amber-600 font-mono mt-0.5 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        {liveComputedMetrics.highestViews
                          ? formatMetricNumber(liveComputedMetrics.highestViews)
                          : '—'}
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-600">单篇峰值</span>
                  </div>

                  <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="text-[10px] font-medium text-emerald-900 block">自动计算·平均点赞</span>
                    <div className="text-sm font-bold text-emerald-700 font-mono mt-0.5 flex items-center gap-1">
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {liveComputedMetrics.avgLikes
                          ? formatMetricNumber(liveComputedMetrics.avgLikes)
                          : '—'}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-600">互动深度</span>
                  </div>
                </div>
              </div>

              {/* 过往作品列表（一条条录入） */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-indigo-600" />
                    过往作品与真实数据条目清单 ({pastWorks.length} 篇)
                  </h4>

                  <button
                    type="button"
                    onClick={handleAddPastWork}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>添加一条</span>
                  </button>
                </div>

                {pastWorks.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2.5 bg-slate-50">
                    <Video className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-600 font-bold">暂无过往作品数据</p>
                    <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                      点击下方按钮，逐条录入该达人的过往代表作、播放量、点赞量与发布链接。系统会自动汇总计算达人的历史平均播放量与最高播放量。
                    </p>
                    <button
                      type="button"
                      onClick={handleAddPastWork}
                      className="mt-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>录入第一条过往作品与数据</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {pastWorks.map((work, index) => (
                      <div
                        key={work.id}
                        className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 relative group hover:border-indigo-200 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 pb-2">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                              {index + 1}
                            </span>
                            第 {index + 1} 条过往作品数据
                          </span>

                          <div className="flex items-center gap-2">
                            {work.url && (
                              <a
                                href={work.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-200/60 rounded-md font-medium"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>测试打开链接</span>
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemovePastWork(work.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                              title="删除该作品条目"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title & URL */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                              作品标题 / 视频主题 *
                            </label>
                            <input
                              type="text"
                              placeholder="例如：巴黎街头优雅自驾 Vlog、3000公里极限实测"
                              value={work.title || ''}
                              onChange={(e) =>
                                handleUpdatePastWork(work.id, 'title', e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                              作品发布链接 (URL) *
                            </label>
                            <input
                              type="url"
                              placeholder="https://youtube.com/watch?v=... 或 TikTok/Instagram 链接"
                              value={work.url || ''}
                              onChange={(e) =>
                                handleUpdatePastWork(work.id, 'url', e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-mono text-slate-800"
                              required
                            />
                          </div>
                        </div>

                        {/* Platform, Date, Views, Likes, Comments, Category */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                              发布平台
                            </label>
                            <select
                              value={work.platform || 'Youtube'}
                              onChange={(e) =>
                                handleUpdatePastWork(work.id, 'platform', e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                            >
                              <option value="Youtube">Youtube</option>
                              <option value="Tiktok">Tiktok</option>
                              <option value="Instagram">Instagram</option>
                              <option value="Facebook">Facebook</option>
                              <option value="其他">其他平台</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                              产出类型
                            </label>
                            <select
                              value={work.category || '原创'}
                              onChange={(e) =>
                                handleUpdatePastWork(work.id, 'category', e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-slate-800"
                            >
                              <option value="原创">原创</option>
                              <option value="二创">二创</option>
                              <option value="直发">直发</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                              发布日期
                            </label>
                            <input
                              type="date"
                              value={work.publishDate || ''}
                              onChange={(e) =>
                                handleUpdatePastWork(work.id, 'publishDate', e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-indigo-700 mb-0.5">
                              实际播放量 (Views)
                            </label>
                            <input
                              type="text"
                              placeholder="如：450,000"
                              value={work.views || ''}
                              onChange={(e) =>
                                handleUpdatePastWork(work.id, 'views', e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-xs border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-mono font-bold text-indigo-700"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-emerald-700 mb-0.5">
                              实际点赞数 (Likes)
                            </label>
                            <input
                              type="text"
                              placeholder="如：32,000"
                              value={work.likes || ''}
                              onChange={(e) =>
                                handleUpdatePastWork(work.id, 'likes', e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-xs border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-mono font-bold text-emerald-700"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                              实际评论/互动数
                            </label>
                            <input
                              type="text"
                              placeholder="如：1,800"
                              value={work.comments || ''}
                              onChange={(e) =>
                                handleUpdatePastWork(work.id, 'comments', e.target.value)
                              }
                              className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-mono"
                            />
                          </div>
                        </div>

                        {/* Highlights & Cooperated Brand */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                              合作车型 / 品牌
                            </label>
                            <input
                              type="text"
                              placeholder="例如：广汽传祺 GS8、埃安 Hyper HT、昊铂等"
                              value={work.cooperatedBrand || ''}
                              onChange={(e) =>
                                handleUpdatePastWork(work.id, 'cooperatedBrand', e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                              作品亮点 / 爆款要点
                            </label>
                            <input
                              type="text"
                              placeholder="例如：以塞纳河畔为背景，突出车辆优雅线条与高级座舱氛围，女性车主占比超60%"
                              value={work.highlights || ''}
                              onChange={(e) =>
                                handleUpdatePastWork(work.id, 'highlights', e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 合作属性备忘说明（可选） */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      达人综合履约合作评级 (1.0 - 5.0 星)
                    </label>
                    <div className="flex items-center gap-3">
                      <select
                        value={cooperationRating}
                        onChange={(e) => setCooperationRating(Number(e.target.value))}
                        className="w-32 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium bg-white"
                      >
                        <option value={5.0}>5.0 星 (极高)</option>
                        <option value={4.8}>4.8 星 (优秀)</option>
                        <option value={4.5}>4.5 星 (良好)</option>
                        <option value={4.0}>4.0 星 (常规)</option>
                        <option value={3.0}>3.0 星 (及格)</option>
                        <option value={1.8}>1.8 星 (黑名单/预警)</option>
                      </select>
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Math.round(cooperationRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      过往合作备忘评价
                    </label>
                    <input
                      type="text"
                      placeholder="例如：按时交付分镜脚本，对三电技术理解深刻，可配合官方账号圈定..."
                      value={historicalCooperationNotes}
                      onChange={(e) => setHistoricalCooperationNotes(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-400">
              {activeTab === 'profile' && '第 1 步 / 共 2 步：基础与标签体系'}
              {activeTab === 'works' && '第 2 步 / 共 2 步：过往数据与作品明细（一条条录入）'}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                取消
              </button>

              {activeTab === 'profile' ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('works')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-black text-white shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <span>下一步：录入过往作品数据 →</span>
                </button>
              ) : null}

              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isEditMode ? '保存达人档案与数据' : '完成录入并建档'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
