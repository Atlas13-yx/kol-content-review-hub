import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Link as LinkIcon,
  UserCheck,
  FileSpreadsheet,
  Layers,
  DollarSign,
  TrendingUp,
  Package,
  Send,
  Building2,
  HelpCircle,
  Plus,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { Platform, Stage, Status, CurrentOwner, ContentCategory, BriefData } from '../types';
import { BriefExampleModal } from './BriefExampleModal';

interface NewContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newContentId: string) => void;
  defaultStage?: Stage;
}

export const NewContentModal: React.FC<NewContentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultStage = 'Brief',
}) => {
  const campaigns = dataService.getCampaigns();
  const kols = dataService.getKols();
  const currentRole = dataService.getCurrentRole();

  // Basic Info
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id || '');
  const [kolName, setKolName] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<Platform>('Instagram');
  const [category, setCategory] = useState<ContentCategory>('二创');
  const [stage, setStage] = useState<Stage>(defaultStage);
  const [deadline, setDeadline] = useState('2026-08-28');

  // Extended Brief Fields (对应用户上传的标准提报表格)
  const [followersCount, setFollowersCount] = useState('');
  const [tier, setTier] = useState('中腰部');
  const [region, setRegion] = useState('俄罗斯');
  const [accountCategory, setAccountCategory] = useState('汽车');
  const [avgViews, setAvgViews] = useState<string | number>('550000');
  const [avgEngagements, setAvgEngagements] = useState<string | number>('16000');
  const [collaborationCost, setCollaborationCost] = useState<string | number>('15000');
  const [adBoostCooperation, setAdBoostCooperation] = useState('愿意辅助投流');

  // Additional Collaboration Rights & Delivery Specs (附加项 / 选填项)
  const [resourceType, setResourceType] = useState('1条Dedicated定制长视频');
  const [videoOrLive, setVideoOrLive] = useState('视频');
  const [canTeaserVideo, setCanTeaserVideo] = useState('是');
  const [canTestimonial, setCanTestimonial] = useState('是');
  const [portraitAuthDuration, setPortraitAuthDuration] = useState('1年');
  const [canSecondaryCreation, setCanSecondaryCreation] = useState('是');
  const [canProvideRawFootage, setCanProvideRawFootage] = useState('是');
  const [canPinLinkOrMention, setCanPinLinkOrMention] = useState('是');
  const [canProvideAdCode, setCanProvideAdCode] = useState('提供 Spark Code');
  const [audiencePersona, setAudiencePersona] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showAddonRights, setShowAddonRights] = useState(false);

  // Creative & Requirements
  const [creativeDirection, setCreativeDirection] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [customAssetInput, setCustomAssetInput] = useState('');

  // Estimation & Docs
  const [estimatedViews, setEstimatedViews] = useState('25000+');
  const [estimatedEngagements, setEstimatedEngagements] = useState('500+');
  const [estimatedCpc, setEstimatedCpc] = useState('0.60');
  const [remarks, setRemarks] = useState('');
  const [briefDocUrl, setBriefDocUrl] = useState('');

  // Active Tab within modal for better UX
  const [activeTab, setActiveTab] = useState<'kol' | 'creative' | 'metrics'>('kol');
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Dynamic campaign materials
  const campaignMaterials = dataService.getCampaignMaterials(campaignId);

  // Update default selected assets when campaign changes if empty
  useEffect(() => {
    if (campaignMaterials.length > 0 && selectedAssets.length === 0) {
      setSelectedAssets(campaignMaterials.slice(0, 3));
    }
  }, [campaignId]);

  if (!isOpen) return null;

  // Real-time suggestions for existing KOLs
  const matchedExistingKol = kols.find(
    (k) => kolName.trim() && k.name.trim().toLowerCase() === kolName.trim().toLowerCase()
  );

  const handleSelectExistingKol = (k: (typeof kols)[0]) => {
    setKolName(k.name);
    setProfileUrl(k.profileUrl || '');
    setPlatform(k.platform);
    if (k.followers) setFollowersCount(k.followers);
    if (k.category) setAccountCategory(k.category);
  };

  const handleToggleAsset = (asset: string) => {
    if (selectedAssets.includes(asset)) {
      setSelectedAssets(selectedAssets.filter((a) => a !== asset));
    } else {
      setSelectedAssets([...selectedAssets, asset]);
    }
  };

  const handleAddCustomAsset = () => {
    if (customAssetInput.trim() && !selectedAssets.includes(customAssetInput.trim())) {
      setSelectedAssets([...selectedAssets, customAssetInput.trim()]);
      setCustomAssetInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent, submitDirectlyToGac: boolean = true) => {
    e.preventDefault();
    setFormError(null);
    if (!kolName.trim()) {
      setFormError('请填写合作达人名字 / 账号 ID (KOL Name)');
      setActiveTab('kol');
      return;
    }
    if (!profileUrl.trim()) {
      setFormError('请填写达人主页跳转链接 (Profile URL)');
      setActiveTab('kol');
      return;
    }
    if (!title.trim()) {
      setFormError('请填写 Content 任务标题');
      setActiveTab('creative');
      return;
    }

    // Auto-create or link KOL in database
    const kol = dataService.findOrCreateKolByName({
      name: kolName.trim(),
      profileUrl: profileUrl.trim(),
      platform,
      category: accountCategory || (category === '二创' ? '二创达人' : '出海创作者'),
      followers: followersCount || '10.0万',
      tags: region ? [region, tier, category] : [category],
    });

    let status: Status = 'Waiting for Brief Approval';
    let currentOwner: CurrentOwner = 'Me';

    if (stage === 'Brief') {
      if (currentRole === 'Agency') {
        status = submitDirectlyToGac ? 'Waiting for Brief Approval' : 'Brief Draft';
        currentOwner = submitDirectlyToGac ? 'Me' : 'Agency';
      } else {
        status = 'Waiting for Brief Approval';
        currentOwner = 'Me';
      }
    } else if (stage === 'Script') {
      status = 'Waiting for KOL Script';
      currentOwner = 'KOL';
    }

    const structuredBriefData: BriefData = {
      followersCount: followersCount || '未知',
      tier,
      region,
      accountCategory,
      avgViews: avgViews || 0,
      avgEngagements: avgEngagements || 0,
      collaborationCost: collaborationCost || 0,
      adBoostCooperation,
      resourceType,
      videoOrLive,
      canTeaserVideo,
      canTestimonial,
      portraitAuthDuration,
      canSecondaryCreation,
      canProvideRawFootage,
      canPinLinkOrMention,
      canProvideAdCode,
      audiencePersona,
      feedback,
      creativeDirection: creativeDirection || topic,
      providedAssets: selectedAssets,
      remarks,
      estimatedViews,
      estimatedEngagements,
      estimatedCpc,
      briefDocUrl,
      submittedBy: currentRole === 'Agency' ? '省广营销集团 GIMC' : '广汽国际 GAC International',
      submittedAt: new Date().toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const created = dataService.addContent({
      campaignId,
      kolId: kol.id,
      title: title.trim(),
      topic: topic.trim() || '广汽国际出海推广主题',
      platform,
      category,
      stage,
      status,
      currentOwner,
      owner: '广汽国际',
      deadline,
      briefText: creativeDirection || topic || '（详见 Brief 表格）',
      briefUrl: briefDocUrl || profileUrl,
      briefData: structuredBriefData,
      notes: `达人：${kol.name} (${region} | ${tier}) | 主页：${kol.profileUrl}`,
    });

    onSuccess(created.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                新建 Content 任务 & Brief 提报
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                包含完整 20 项 Brief 指标
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              支持省广代理商完整录入达人画像、核心诉求、提供素材清单与投产比预估，并提交广汽国际审核
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowExampleModal(true)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="查看省广标准提报格式与数据指标范例"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>查看提报范例 (Brief Example)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-200/70 bg-white flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('kol')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'kol'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>1. 达人画像与账号指标</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('creative')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'creative'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. 创作建议与素材清单</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'metrics'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>3. 投产比预估与附件</span>
          </button>
        </div>

        {/* Form Body */}
        <form className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Tab 1: KOL Profile & Account Metrics */}
          {activeTab === 'kol' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              {/* Campaign Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  所属 Campaign 项目 *
                </label>
                <select
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.brief ? c.brief.substring(0, 30) + '...' : ''})
                    </option>
                  ))}
                </select>
              </div>

              {/* KOL Basic Info Grid */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    达人基本信息（对应提报表列：平台 / 达人名称ID / 粉丝量 / 量级 / 地区 / 属性 / 类型）
                  </span>
                  {matchedExistingKol ? (
                    <span className="text-[11px] text-emerald-700 font-medium px-2 py-0.5 bg-emerald-50 rounded border border-emerald-200">
                      ✓ 已匹配库中档案
                    </span>
                  ) : kolName.trim() ? (
                    <span className="text-[11px] text-indigo-700 font-medium px-2 py-0.5 bg-indigo-50 rounded border border-indigo-200">
                      + 自动在达人库建档
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      达人名称 (ID) *
                    </label>
                    <input
                      type="text"
                      placeholder="例如：serjcraft / 极客老张"
                      value={kolName}
                      onChange={(e) => setKolName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      发布平台 (Platform) *
                    </label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value as Platform)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="Tiktok">Tiktok</option>
                      <option value="Youtube">Youtube</option>
                      <option value="Facebook">Facebook</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      达人主页链接 (Profile URL) *
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.instagram.com/serjcraft"
                      value={profileUrl}
                      onChange={(e) => setProfileUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-mono text-[11px]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      粉丝量 (Followers)
                    </label>
                    <input
                      type="text"
                      placeholder="例如：63,000 / 6.3万"
                      value={followersCount}
                      onChange={(e) => setFollowersCount(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      量级 (Tier)
                    </label>
                    <select
                      value={tier}
                      onChange={(e) => setTier(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="头部">头部 (100万+)</option>
                      <option value="中腰部">中腰部 (10万-100万)</option>
                      <option value="尾部">尾部 (1万-10万)</option>
                      <option value="KOC">KOC (1万以下)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      地区 (Region)
                    </label>
                    <input
                      type="text"
                      placeholder="例如：俄罗斯 / 欧洲 / 中东"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      账号类型 (Category)
                    </label>
                    <input
                      type="text"
                      placeholder="例如：汽车 / 科技 / 生活"
                      value={accountCategory}
                      onChange={(e) => setAccountCategory(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      平均播放量 (Avg Views)
                    </label>
                    <input
                      type="text"
                      placeholder="例如：550,000"
                      value={avgViews}
                      onChange={(e) => setAvgViews(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      平均互动量 (Avg Engagements)
                    </label>
                    <input
                      type="text"
                      placeholder="例如：16,000"
                      value={avgEngagements}
                      onChange={(e) => setAvgEngagements(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      投流合作 (Ad Boost)
                    </label>
                    <input
                      type="text"
                      placeholder="例如：愿意辅助投流 / 包含投流"
                      value={adBoostCooperation}
                      onChange={(e) => setAdBoostCooperation(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                {/* Collapsible Add-on Collaboration Rights & Specs */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowAddonRights(!showAddonRights)}
                      className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1.5 py-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{showAddonRights ? '▼ 收起附加合作权益与细则 (选填项)' : '▶ 展开附加合作权益与交付细则 (选填项)'}</span>
                    </button>
                    <span className="text-[10px] text-slate-400">肖像授权 / 原片交付 / 投流Code / 二创授权等</span>
                  </div>

                  {showAddonRights && (
                    <div className="mt-3 p-3.5 bg-purple-50/60 rounded-xl border border-purple-200/80 space-y-3 animate-fadeIn">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">合作资源形式</label>
                          <input
                            type="text"
                            value={resourceType}
                            onChange={(e) => setResourceType(e.target.value)}
                            placeholder="如: 1条长视频"
                            className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">形式 (视频/直播)</label>
                          <select
                            value={videoOrLive}
                            onChange={(e) => setVideoOrLive(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                          >
                            <option value="视频">视频</option>
                            <option value="直播">直播</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">肖像授权官方时间</label>
                          <input
                            type="text"
                            value={portraitAuthDuration}
                            onChange={(e) => setPortraitAuthDuration(e.target.value)}
                            placeholder="如: 1年 / 6个月"
                            className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">投流授权Code</label>
                          <input
                            type="text"
                            value={canProvideAdCode}
                            onChange={(e) => setCanProvideAdCode(e.target.value)}
                            placeholder="如: Spark Code / 是"
                            className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <label className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200">
                          <span className="text-slate-600 text-[11px]">可发预热视频:</span>
                          <select
                            value={canTeaserVideo}
                            onChange={(e) => setCanTeaserVideo(e.target.value)}
                            className="text-xs font-bold bg-slate-100 rounded px-1"
                          >
                            <option value="是">是</option>
                            <option value="否">否</option>
                          </select>
                        </label>
                        <label className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200">
                          <span className="text-slate-600 text-[11px]">可配合证言:</span>
                          <select
                            value={canTestimonial}
                            onChange={(e) => setCanTestimonial(e.target.value)}
                            className="text-xs font-bold bg-slate-100 rounded px-1"
                          >
                            <option value="是">是</option>
                            <option value="否">否</option>
                          </select>
                        </label>
                        <label className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200">
                          <span className="text-slate-600 text-[11px]">授权二剪二创:</span>
                          <select
                            value={canSecondaryCreation}
                            onChange={(e) => setCanSecondaryCreation(e.target.value)}
                            className="text-xs font-bold bg-slate-100 rounded px-1"
                          >
                            <option value="是">是</option>
                            <option value="否">否</option>
                          </select>
                        </label>
                        <label className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200">
                          <span className="text-slate-600 text-[11px]">网盘原片交付:</span>
                          <select
                            value={canProvideRawFootage}
                            onChange={(e) => setCanProvideRawFootage(e.target.value)}
                            className="text-xs font-bold bg-slate-100 rounded px-1"
                          >
                            <option value="是">是</option>
                            <option value="否">否</option>
                          </select>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">受众/粉丝画像 (Audience Demographics)</label>
                          <input
                            type="text"
                            value={audiencePersona}
                            onChange={(e) => setAudiencePersona(e.target.value)}
                            placeholder="如: 25-45岁男性/汽车发烧友/科技数码"
                            className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">沟通进展与反馈 (Feedback)</label>
                          <input
                            type="text"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="如: 已对接锁定排期"
                            className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Fill suggestions from existing KOLs */}
                {kols.length > 0 && (
                  <div className="pt-1 border-t border-slate-200/60">
                    <span className="text-[11px] text-slate-400 block mb-1">快捷选用已有达人：</span>
                    <div className="flex flex-wrap gap-1.5 max-h-14 overflow-y-auto">
                      {kols.slice(0, 8).map((k) => (
                        <button
                          key={k.id}
                          type="button"
                          onClick={() => handleSelectExistingKol(k)}
                          className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                            kolName === k.name
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                          }`}
                        >
                          {k.name} ({k.platform})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Task Title & Commercials */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Content 任务标题 *
                  </label>
                  <input
                    type="text"
                    placeholder="例如：serjcraft × 3000万台下线中国制造深度解析与全球出海"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    合作内容类型
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const newCat = e.target.value as ContentCategory;
                      setCategory(newCat);
                      if (newCat === '直发' && stage === 'Script') {
                        setStage('Video');
                      }
                    }}
                    className="w-full px-3 py-2 text-xs font-bold text-indigo-900 bg-indigo-50/60 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="二创">二创衍生 (素材剪辑+原声)</option>
                    <option value="原创">原创定制 (到店/探馆/实拍)</option>
                    <option value="直发">直发视频 (达人筛选+素材直发+免脚本直通视频审核)</option>
                  </select>
                </div>
              </div>

              {category === '直发' && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <span className="font-bold shrink-0">💡 直发模式说明：</span>
                  <span>该类型视频仅需【达人初筛/Brief】与【视频审核】阶段，无需分镜脚本审核，核准后将直接进入成片初审与终审。</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    合作费用预算 (Budget ¥)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400">¥</span>
                    <input
                      type="text"
                      placeholder="15000"
                      value={collaborationCost}
                      onChange={(e) => setCollaborationCost(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    初始流转阶段 (Stage)
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as Stage)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="Brief">Brief 审核阶段 (省广提报/下发素材)</option>
                    {category !== '直发' && (
                      <option value="Script">Script 脚本阶段 (直接进入脚本撰写)</option>
                    )}
                    <option value="Video">Video 视频阶段 (直接上传/审核成片)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    截止日期 (Deadline)
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('creative')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <span>下一步：填写创作建议与素材清单</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Creative Direction & Provided Assets */}
          {activeTab === 'creative' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  内容核心主题 / Topic
                </label>
                <input
                  type="text"
                  placeholder="例如：俄语区汽车博主看中国制造：3000万台汽车工业奇迹与智能智造"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Core Creative Direction (创作建议与核心诉求) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    创作建议与核心诉求 (Creative Direction) *
                  </label>
                </div>
                <textarea
                  rows={5}
                  placeholder="例如：明确视频核心切入视角、达人内容风格融合点、产品亮点植入节奏与关键传达诉求..."
                  value={creativeDirection}
                  onChange={(e) => setCreativeDirection(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans"
                />
              </div>

              {/* Provided Assets (素材提供清单) - Dynamically Linked to Campaign */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-600" />
                    素材提供清单 (Materials / Provided Assets)
                  </label>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    已选 {selectedAssets.length} 项素材
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  已匹配当前活动【<strong className="text-slate-700">{campaigns.find((c) => c.id === campaignId)?.name || '当前 Campaign'}</strong>】的素材清单，勾选提供给达人的物料：
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {campaignMaterials.map((asset) => {
                    const isChecked = selectedAssets.includes(asset);
                    return (
                      <button
                        key={asset}
                        type="button"
                        onClick={() => handleToggleAsset(asset)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                            isChecked ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                          }`}
                        >
                          {isChecked ? '✓' : ''}
                        </span>
                        <span>{asset}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Asset Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="输入其他定制素材名称..."
                    value={customAssetInput}
                    onChange={(e) => setCustomAssetInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomAsset();
                      }
                    }}
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white flex-1 focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAsset}
                    className="px-3 py-1.5 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    + 添加素材项
                  </button>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('kol')}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  ← 上一步：达人画像
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('metrics')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <span>下一步：预估指标与附件</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Estimation Metrics & Remarks & Document URL */}
          {activeTab === 'metrics' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              {/* Estimation Metrics Grid */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  效果预估指标 (Estimated Performance & CPC)
                </span>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      预估播放量 (Views)
                    </label>
                    <input
                      type="text"
                      placeholder="例如：25000+"
                      value={estimatedViews}
                      onChange={(e) => setEstimatedViews(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-mono font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      预估互动量 (Engagements)
                    </label>
                    <input
                      type="text"
                      placeholder="例如：500+"
                      value={estimatedEngagements}
                      onChange={(e) => setEstimatedEngagements(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-mono font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      预估 CPC (¥ / 次)
                    </label>
                    <input
                      type="text"
                      placeholder="例如：0.60"
                      value={estimatedCpc}
                      onChange={(e) => setEstimatedCpc(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-mono font-bold text-emerald-700"
                    />
                  </div>
                </div>
              </div>

              {/* Brief Cloud Doc URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                    Brief 附件 / 详细在线提报表格链接 (URL)
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">支持 Google Sheets / 腾讯文档 / 网盘链接</span>
                </label>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/... 或飞书文档"
                  value={briefDocUrl}
                  onChange={(e) => setBriefDocUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-[11px]"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  备注说明 (Remarks / Notes)
                </label>
                <textarea
                  rows={2}
                  placeholder="填写商务洽谈进度、排期锁定情况或广汽国际特别注意事项..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Submission Notice Banner */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <Building2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">省广与广汽国际协同说明：</span>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    提交后任务将即时同步至「Brief 审核」与「Contents 任务总表」。广汽国际收到待审提报后可一键进行【AI 智能质量诊断】与【核准流转】，通过后达人即可开展脚本创作。
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('creative')}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  ← 上一步：创作建议
                </button>
              </div>
            </div>
          )}
        </form>

        {formError && (
          <div className="mx-6 mb-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold animate-in fade-in duration-150">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors"
          >
            取消
          </button>

          <div className="flex items-center gap-2">
            {currentRole === 'Agency' && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                保存为省广草稿
              </button>
            )}

            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-900/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {currentRole === 'Agency'
                  ? '提交 Brief 给广汽国际审核'
                  : '创建 Content 任务并审定 Brief'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Brief Example Reference Modal */}
      <BriefExampleModal
        isOpen={showExampleModal}
        onClose={() => setShowExampleModal(false)}
      />
    </div>
  );
};
