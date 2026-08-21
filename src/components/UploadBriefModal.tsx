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
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { ContentItem, Platform, ContentCategory, BriefData } from '../types';
import { BriefExampleModal } from './BriefExampleModal';

interface UploadBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ContentItem | null;
  onSuccess?: () => void;
}

export const UploadBriefModal: React.FC<UploadBriefModalProps> = ({
  isOpen,
  onClose,
  content,
  onSuccess,
}) => {
  const currentRole = dataService.getCurrentRole();
  const kols = dataService.getKols();
  const campaigns = dataService.getCampaigns();
  const kol = content ? kols.find((k) => k.id === content.kolId) : null;
  const currentCampaign = content ? campaigns.find((c) => c.id === content.campaignId) : null;
  const campaignMaterials = dataService.getCampaignMaterials(content?.campaignId);

  // Form states
  const [platform, setPlatform] = useState<Platform>('Instagram');
  const [kolName, setKolName] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [followersCount, setFollowersCount] = useState('');
  const [tier, setTier] = useState('中腰部');
  const [region, setRegion] = useState('俄罗斯');
  const [accountCategory, setAccountCategory] = useState('汽车');
  const [category, setCategory] = useState<ContentCategory>('二创');
  const [avgViews, setAvgViews] = useState<string | number>('550000');
  const [avgEngagements, setAvgEngagements] = useState<string | number>('16000');
  const [collaborationCost, setCollaborationCost] = useState<string | number>('15000');
  const [adBoostCooperation, setAdBoostCooperation] = useState('愿意辅助投流');

  // Additional collaboration rights
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

  // Creative & Assets
  const [creativeDirection, setCreativeDirection] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [customAssetInput, setCustomAssetInput] = useState('');

  // Metrics & Docs
  const [estimatedViews, setEstimatedViews] = useState('25000+');
  const [estimatedEngagements, setEstimatedEngagements] = useState('500+');
  const [estimatedCpc, setEstimatedCpc] = useState('0.60');
  const [remarks, setRemarks] = useState('');
  const [briefDocUrl, setBriefDocUrl] = useState('');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'creative' | 'kol' | 'metrics'>('creative');
  const [showExampleModal, setShowExampleModal] = useState(false);

  useEffect(() => {
    if (content) {
      setPlatform(content.platform || 'Instagram');
      setKolName(kol?.name || '');
      setProfileUrl(kol?.profileUrl || content.briefUrl || '');
      setCategory(content.category || '二创');

      const bd = content.briefData || {};
      setFollowersCount(bd.followersCount || kol?.followers || '63,000');
      setTier(bd.tier || '中腰部');
      setRegion(bd.region || '俄罗斯');
      setAccountCategory(bd.accountCategory || '汽车');
      setAvgViews(bd.avgViews !== undefined ? bd.avgViews : '550000');
      setAvgEngagements(bd.avgEngagements !== undefined ? bd.avgEngagements : '16000');
      setCollaborationCost(bd.collaborationCost !== undefined ? bd.collaborationCost : '15000');
      setAdBoostCooperation(bd.adBoostCooperation || '愿意辅助投流');

      setResourceType(bd.resourceType || '1条Dedicated定制长视频');
      setVideoOrLive(bd.videoOrLive || '视频');
      setCanTeaserVideo(bd.canTeaserVideo || '是');
      setCanTestimonial(bd.canTestimonial || '是');
      setPortraitAuthDuration(bd.portraitAuthDuration || '1年');
      setCanSecondaryCreation(bd.canSecondaryCreation || '是');
      setCanProvideRawFootage(bd.canProvideRawFootage || '是');
      setCanPinLinkOrMention(bd.canPinLinkOrMention || '是');
      setCanProvideAdCode(bd.canProvideAdCode || '提供 Spark Code');
      setAudiencePersona(bd.audiencePersona || '');
      setFeedback(bd.feedback || '');

      setCreativeDirection(bd.creativeDirection || content.briefText || '');
      
      const defaultMats = dataService.getCampaignMaterials(content.campaignId);
      setSelectedAssets(
        Array.isArray(bd.providedAssets) && bd.providedAssets.length > 0
          ? bd.providedAssets
          : defaultMats.slice(0, 3)
      );

      setEstimatedViews(bd.estimatedViews !== undefined ? bd.estimatedViews.toString() : '25000+');
      setEstimatedEngagements(bd.estimatedEngagements !== undefined ? bd.estimatedEngagements.toString() : '500+');
      setEstimatedCpc(bd.estimatedCpc !== undefined ? bd.estimatedCpc.toString() : '0.60');
      setRemarks(bd.remarks || content.notes || '');
      setBriefDocUrl(bd.briefDocUrl || content.briefUrl || '');
    }
  }, [content, kol]);

  if (!isOpen || !content) return null;

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

  // Submit to GAC for review
  const handleAgencySubmit = () => {
    setFormError(null);
    if (!creativeDirection.trim()) {
      setFormError('请填写创作建议与核心诉求后再提交！');
      setActiveTab('creative');
      return;
    }

    const payload: BriefData = {
      followersCount,
      tier,
      region,
      accountCategory,
      category,
      avgViews,
      avgEngagements,
      collaborationCost,
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
      creativeDirection,
      providedAssets: selectedAssets,
      remarks,
      estimatedViews,
      estimatedEngagements,
      estimatedCpc,
      briefDocUrl,
    };

    if (content.category !== category) {
      dataService.updateContent({ ...content, category });
    }
    dataService.submitBrief(content.id, payload, 'Agency');
    if (onSuccess) onSuccess();
    onClose();
  };

  // Save changes without submitting
  const handleSaveOnly = () => {
    setFormError(null);
    const payload: BriefData = {
      followersCount,
      tier,
      region,
      accountCategory,
      category,
      avgViews,
      avgEngagements,
      collaborationCost,
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
      creativeDirection,
      providedAssets: selectedAssets,
      remarks,
      estimatedViews,
      estimatedEngagements,
      estimatedCpc,
      briefDocUrl,
    };

    if (content.category !== category) {
      dataService.updateContent({ ...content, category });
    }
    dataService.updateBriefData(content.id, payload);
    if (onSuccess) onSuccess();
    onClose();
  };

  // GAC Approve directly
  const handleGacApprove = () => {
    setFormError(null);
    dataService.approveBrief(content.id, feedbackNotes || '同意此 Brief 方案，请推进脚本撰写');
    if (onSuccess) onSuccess();
    onClose();
  };

  // GAC Request Revision
  const handleGacRequestRevision = () => {
    setFormError(null);
    if (!feedbackNotes.trim()) {
      setFormError('请在下方审核批注中填写修改意见后再退回！');
      return;
    }
    dataService.requestBriefRevision(content.id, feedbackNotes);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                省广上传 / 完善 Brief 提报表
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                {content.title}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              活动：{currentCampaign?.name || 'Campaign'} | 达人：{kol?.name || '达人'} ({platform}) | 当前状态：{content.status}
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
              <span>查看提报范例</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {formError && (
          <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Tab Nav */}
        <div className="px-6 pt-3 border-b border-slate-200/70 bg-white flex items-center gap-2">
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
            <span>1. 创作建议与素材清单 (核心诉求)</span>
          </button>
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
            <span>2. 达人指标与商务预算</span>
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
            <span>3. 预估指标与文档链接</span>
          </button>
        </div>

        {/* Modal Form */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'creative' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              {/* Creative Direction */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    创作建议与核心诉求 (Creative Direction) *
                  </label>
                </div>
                <textarea
                  rows={6}
                  value={creativeDirection}
                  onChange={(e) => setCreativeDirection(e.target.value)}
                  placeholder="重点以中国制造产业深度解析，汽车工厂便携溯源、区域市场产品力反差对比为切入视角，自然植入广汽国际全球化出海布局、智能制造硬核实力与全球市场产品竞争力..."
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans"
                />
              </div>

              {/* Provided Assets */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-600" />
                    素材提供清单 (Materials Provided to KOL)
                  </label>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    已选 {selectedAssets.length} 项素材
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  已匹配所属活动【<strong className="text-slate-700">{currentCampaign?.name || '当前活动'}</strong>】素材库，勾选提供给达人的物料：
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

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('kol')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <span>下一步：完善达人指标与商务预算 →</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'kol' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  达人账号指标与投放设置
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      合作内容类型
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ContentCategory)}
                      className="w-full px-2.5 py-1.5 text-xs font-bold text-indigo-950 border border-indigo-200 rounded-lg bg-indigo-50/50"
                    >
                      <option value="二创">二创 (素材剪辑+原声)</option>
                      <option value="原创">原创 (定制实拍)</option>
                      <option value="直发">直发 (官方素材直发/免脚本)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      粉丝量 (Followers)
                    </label>
                    <input
                      type="text"
                      value={followersCount}
                      onChange={(e) => setFollowersCount(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      量级 (Tier)
                    </label>
                    <select
                      value={tier}
                      onChange={(e) => setTier(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="头部">头部</option>
                      <option value="中腰部">中腰部</option>
                      <option value="尾部">尾部</option>
                      <option value="KOC">KOC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      地区 (Region)
                    </label>
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                {category === '直发' && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <span className="font-bold shrink-0">💡 直发提示：</span>
                    <span>该视频为直发类型，核准通过 Brief 后将自动跳过脚本审核，直接进入视频成片审核阶段。</span>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      账号类型 (Category)
                    </label>
                    <input
                      type="text"
                      value={accountCategory}
                      onChange={(e) => setAccountCategory(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      平均播放量 (Avg Views)
                    </label>
                    <input
                      type="text"
                      value={avgViews}
                      onChange={(e) => setAvgViews(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      平均互动量 (Avg Engagements)
                    </label>
                    <input
                      type="text"
                      value={avgEngagements}
                      onChange={(e) => setAvgEngagements(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      合作费用预算 (¥)
                    </label>
                    <input
                      type="text"
                      value={collaborationCost}
                      onChange={(e) => setCollaborationCost(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      投流合作 (Ad Boost)
                    </label>
                    <input
                      type="text"
                      value={adBoostCooperation}
                      onChange={(e) => setAdBoostCooperation(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                {/* Collapsible Add-on Rights & Collaboration Specs */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowAddonRights(!showAddonRights)}
                      className="text-xs font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1.5 py-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{showAddonRights ? '▼ 收起附加合作权益与细则 (选填项)' : '▶ 展开附加合作权益与交付细则 (选填项)'}</span>
                    </button>
                    <span className="text-[10px] text-slate-400">肖像授权 / 原片交付 / 投流Code / 二创授权等</span>
                  </div>

                  {showAddonRights && (
                    <div className="mt-3 p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200/80 space-y-3 animate-fadeIn">
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
              </div>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  效果预估指标 (Estimation)
                </span>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      预估播放量 (Views)
                    </label>
                    <input
                      type="text"
                      value={estimatedViews}
                      onChange={(e) => setEstimatedViews(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      预估互动量 (Engagements)
                    </label>
                    <input
                      type="text"
                      value={estimatedEngagements}
                      onChange={(e) => setEstimatedEngagements(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      预估 CPC (¥ / 次)
                    </label>
                    <input
                      type="text"
                      value={estimatedCpc}
                      onChange={(e) => setEstimatedCpc(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold text-emerald-700"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                    Brief 附件 / 在线提报文档链接 (URL)
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">支持 Google Sheets / 网盘链接</span>
                </label>
                <input
                  type="url"
                  value={briefDocUrl}
                  onChange={(e) => setBriefDocUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  备注说明 (Remarks / Notes)
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* GAC International Feedback Input if Me */}
          {currentRole === 'Me' && (
            <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200/80 space-y-2">
              <label className="block text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                广汽国际审核意见 / 批注说明
              </label>
              <textarea
                rows={2}
                placeholder="例如：同意通过此 Brief！切入点兼具传播热度与智造硬核实力，请省广按此 Brief 推进达人撰写详细分镜脚本。"
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                className="w-full p-2.5 text-xs border border-indigo-200 rounded-lg bg-white"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors"
          >
            取消
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveOnly}
              className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              保存修改
            </button>

            {currentRole === 'Agency' ? (
              <button
                type="button"
                onClick={handleAgencySubmit}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-900/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>提报 Brief 给广汽国际审核</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGacRequestRevision}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  要求修改 Brief
                </button>
                <button
                  type="button"
                  onClick={handleGacApprove}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>核准通过 Brief</span>
                </button>
              </div>
            )}
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
