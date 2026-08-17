import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  FileText,
  Video,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Link,
  ArrowRight,
  UserCheck,
  FolderSync,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { ContentItem, KOL, Campaign, AssetType } from '../types';

interface SmartUploadVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (contentId: string) => void;
  initialContentId?: string;
  initialAssetType?: AssetType;
  content?: ContentItem;
}

export const SmartUploadVersionModal: React.FC<SmartUploadVersionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialContentId,
  initialAssetType,
  content: propContent,
}) => {
  const [assetType, setAssetType] = useState<AssetType>('Script');
  const [kolQuery, setKolQuery] = useState('');
  const [selectedContentId, setSelectedContentId] = useState<string>('');
  const [versionTitle, setVersionTitle] = useState('');
  const [scriptText, setScriptText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [archiveSuccessInfo, setArchiveSuccessInfo] = useState<{
    content: ContentItem;
    kol: KOL;
    versionNumber: number;
  } | null>(null);

  const contents = dataService.getContents();
  const kols = dataService.getKols();
  const campaigns = dataService.getCampaigns();

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setArchiveSuccessInfo(null);
      const targetContentId = initialContentId || propContent?.id || '';
      const targetType =
        initialAssetType || (propContent?.stage === 'Video' ? 'Video' : 'Script');
      setAssetType(targetType);
      setSelectedContentId(targetContentId);

      if (targetContentId) {
        const found = dataService.getContentById(targetContentId);
        if (found) {
          const kol = kols.find((k) => k.id === found.kolId);
          setKolQuery(kol ? kol.name : '');
          autoFillVersionTitle(found, kol, targetType);
        }
      } else {
        setKolQuery('');
        setVersionTitle('');
      }

      setScriptText('');
      setFileUrl('');
      setVideoUrl('');
      setFileName('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialContentId, initialAssetType, propContent]);

  if (!isOpen) return null;

  // Filter matched contents based on kolQuery (matching KOL name, KOL ID, Content title)
  const matchedContents = contents.filter((c) => {
    if (!kolQuery.trim()) return true;
    const q = kolQuery.trim().toLowerCase();
    const kol = kols.find((k) => k.id === c.kolId);
    const kolNameMatch = kol ? kol.name.toLowerCase().includes(q) : false;
    const kolIdMatch = c.kolId.toLowerCase().includes(q);
    const contentTitleMatch = c.title.toLowerCase().includes(q);
    return kolNameMatch || kolIdMatch || contentTitleMatch;
  });

  // Automatically select the first match if exactly 1 matches or if user typed exact KOL name
  const handleKolQueryChange = (val: string) => {
    setKolQuery(val);
    const q = val.trim().toLowerCase();
    if (!q) {
      setSelectedContentId('');
      return;
    }
    const exactKol = kols.find((k) => k.name.toLowerCase() === q || k.id.toLowerCase() === q);
    if (exactKol) {
      const relatedContent = contents.find((c) => c.kolId === exactKol.id);
      if (relatedContent) {
        setSelectedContentId(relatedContent.id);
        autoFillVersionTitle(relatedContent, exactKol, assetType);
      }
    }
  };

  const autoFillVersionTitle = (c: ContentItem, kol: KOL | undefined, type: AssetType) => {
    const existingVerCount =
      type === 'Script'
        ? dataService.getScriptVersions(c.id).length
        : dataService.getVideoVersions(c.id).length;
    const nextVer = existingVerCount + 1;
    const prefix = kol ? kol.name : 'KOL';
    setVersionTitle(`${prefix}_${c.platform}_${type === 'Script' ? '脚本' : '视频'}_V${nextVer}`);
  };

  const handleSelectContent = (content: ContentItem) => {
    setSelectedContentId(content.id);
    const kol = kols.find((k) => k.id === content.kolId);
    autoFillVersionTitle(content, kol, assetType);
  };

  // Simulate file selection & extract KOL name from filename
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const generatedUrl = `https://storage.gac-international.com/uploads/${Date.now()}_${file.name}`;
      setFileUrl(generatedUrl);

      // Smart parse KOL name from file name (e.g. "极客老张_V2脚本.docx" or "美妆小A_巴黎车展.mp4")
      const matchedKol = kols.find((k) => file.name.includes(k.name));
      if (matchedKol) {
        setKolQuery(matchedKol.name);
        const relatedContent = contents.find((c) => c.kolId === matchedKol.id);
        if (relatedContent) {
          setSelectedContentId(relatedContent.id);
          autoFillVersionTitle(relatedContent, matchedKol, assetType);
        }
      } else {
        if (!versionTitle) {
          setVersionTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }

      // If text or doc mock, fill a default script template if script
      if (assetType === 'Script' && !scriptText) {
        setScriptText(
          `【画面/镜头】00:00-00:15 巴黎车展广汽展台全景，镜头切入出海主力车型。\n【口播台词】“大家好，这里是车展现场！今天带大家深度体验广汽全球累计下线突破3000万台的高品质车型，全系搭载 GAC ADAS 2.0 智驾系统与欧洲五星安全标准认证……”\n【音效/BGM】动感科技电子乐\n【字幕】巴黎车展首秀 / Euro-NCAP 5星品质 / GAC ADAS 2.0 智驾辅助`
        );
      }
    }
  };

  const handleQuickSelectKol = (k: KOL) => {
    setKolQuery(k.name);
    const related = contents.find((c) => c.kolId === k.id);
    if (related) {
      setSelectedContentId(related.id);
      autoFillVersionTitle(related, k, assetType);
    } else {
      setSelectedContentId('');
    }
  };

  const handleAutoCreateAndArchive = () => {
    if (!kolQuery.trim()) {
      alert('请先输入达人名称');
      return;
    }
    const kol = dataService.findOrCreateKolByName({
      name: kolQuery.trim(),
      platform: 'Tiktok',
      tags: ['白名单'],
    });

    const primaryCamp = campaigns[0] || { id: 'camp-1' };
    const newContent = dataService.addContent({
      campaignId: primaryCamp.id,
      kolId: kol.id,
      title: `${kol.name} × 广汽出海营销专项`,
      topic: '智能品质与全球首秀',
      platform: kol.platform,
      category: '原创',
      stage: assetType === 'Script' ? 'Script' : 'Video',
      status: 'Waiting for Agency Review',
      currentOwner: 'Agency',
      owner: '广汽国际',
      deadline: '2026-08-30',
      briefText: '重点覆盖3000万台品质背书、GAC ADAS 2.0与欧洲五星安全。',
      briefUrl: '',
      notes: `达人：${kol.name} | 自动建档归档`,
    });

    setSelectedContentId(newContent.id);
    autoFillVersionTitle(newContent, kol, assetType);
  };

  const handleArchiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContentId) {
      alert('请在下方匹配列表中选择要归档的目标 Content 任务！');
      return;
    }

    const targetContent = contents.find((c) => c.id === selectedContentId);
    if (!targetContent) return;

    const targetKol = kols.find((k) => k.id === targetContent.kolId) || {
      id: targetContent.kolId,
      name: '合作达人',
      platform: targetContent.platform,
      profileUrl: '',
      avatar: '',
      createdAt: '',
      updatedAt: '',
    };

    setIsSubmitting(true);

    setTimeout(() => {
      let createdVerNum = 1;
      if (assetType === 'Script') {
        const text =
          scriptText.trim() ||
          `【脚本版本】${versionTitle || '最新脚本'}\n【口播】广汽全球累计下线突破3000万台，搭载 GAC ADAS 2.0 与欧洲五星安全标准。\n【素材链接】${fileUrl || 'https://storage.gac-international.com/script/v2.docx'}`;
        const newSv = dataService.addScriptVersion(
          targetContent.id,
          versionTitle || `Script V${Date.now().toString().slice(-2)}`,
          text,
          fileUrl || 'https://storage.gac-international.com/script/v2.docx'
        );
        createdVerNum = newSv.versionNumber;
      } else {
        const url =
          videoUrl.trim() ||
          fileUrl ||
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
        const newVv = dataService.addVideoVersion(
          targetContent.id,
          url,
          fileUrl || 'https://storage.gac-international.com/videos/v2_preview.mp4'
        );
        createdVerNum = newVv.versionNumber;
      }

      setIsSubmitting(false);
      setArchiveSuccessInfo({
        content: targetContent,
        kol: targetKol,
        versionNumber: createdVerNum,
      });
    }, 400);
  };

  const selectedContent = contents.find((c) => c.id === selectedContentId);
  const selectedKol = selectedContent ? kols.find((k) => k.id === selectedContent.kolId) : null;
  const selectedCampaign = selectedContent ? campaigns.find((cp) => cp.id === selectedContent.campaignId) : null;

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  一键智能上传与自动归档
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-300" />
                  省广极速归档
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                通过输入达人 ID / 姓名自动识别 Content 任务，一键递增版本并归档至审核流
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {archiveSuccessInfo ? (
          /* Success Screen */
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                🎉 脚本/视频版本已成功归档！
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                已自动识别并归档到达人【{archiveSuccessInfo.kol.name}】的《{archiveSuccessInfo.content.title}》任务，生成了{' '}
                <span className="font-bold text-indigo-600">
                  {assetType === 'Script' ? 'Script' : 'Video'} V{archiveSuccessInfo.versionNumber}
                </span>
                ，并自动触发省广审核流程。
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-lg mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">关联达人：</span>
                <span className="font-semibold text-slate-800">{archiveSuccessInfo.kol.name} ({archiveSuccessInfo.kol.platform})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">归档任务：</span>
                <span className="font-semibold text-slate-800">{archiveSuccessInfo.content.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">当前阶段与状态：</span>
                <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Waiting for Agency Review (等待省广初审)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setArchiveSuccessInfo(null);
                  setSelectedContentId('');
                  setScriptText('');
                  setVideoUrl('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                继续归档其他达人素材
              </button>
              <button
                onClick={() => {
                  onSuccess(archiveSuccessInfo.content.id);
                  onClose();
                }}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5"
              >
                前往查看 Content 审核详情
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Archive Upload Form */
          <form onSubmit={handleArchiveSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
            {/* Step 1: Choose Asset Type */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                1. 选择归档资产类型
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAssetType('Script');
                    if (selectedContent) {
                      const kol = kols.find((k) => k.id === selectedContent.kolId);
                      autoFillVersionTitle(selectedContent, kol, 'Script');
                    }
                  }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    assetType === 'Script'
                      ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      assetType === 'Script' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">脚本文件 / 台词 (Script)</div>
                    <div className="text-[11px] text-slate-500">上传 Docx/PDF 或在线贴入台词正文</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAssetType('Video');
                    if (selectedContent) {
                      const kol = kols.find((k) => k.id === selectedContent.kolId);
                      autoFillVersionTitle(selectedContent, kol, 'Video');
                    }
                  }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    assetType === 'Video'
                      ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      assetType === 'Video' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">成片视频 / 样片 (Video)</div>
                    <div className="text-[11px] text-slate-500">输入视频预览 URL 或上传视频源文件</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 2: Auto KOL Identification */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  2. 识别达人并自动匹配 Content
                </label>
                <span className="text-[11px] text-slate-500 font-normal">
                  输入达人姓名/ID或点击下方达人标签快速定位
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="输入达人名字（如：极客老张、美妆小A、季季）或任务关键词..."
                  value={kolQuery}
                  onChange={(e) => handleKolQueryChange(e.target.value)}
                  className="w-full pl-3 pr-24 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
                />
                {kolQuery && (
                  <button
                    type="button"
                    onClick={() => handleKolQueryChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
                  >
                    清除
                  </button>
                )}
              </div>

              {/* Quick KOL chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-medium mr-1">快捷点选达人：</span>
                {kols.slice(0, 6).map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => handleQuickSelectKol(k)}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all ${
                      kolQuery.toLowerCase() === k.name.toLowerCase()
                        ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {k.name}
                  </button>
                ))}
              </div>

              {/* Matched Content Items List */}
              <div className="mt-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                  <span>匹配到的 Content 审核任务（点击单选归档目标）：</span>
                  <span>共找到 {matchedContents.length} 个任务</span>
                </div>

                {matchedContents.length > 0 ? (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {matchedContents.map((c) => {
                      const kol = kols.find((k) => k.id === c.kolId);
                      const isSelected = selectedContentId === c.id;
                      const scriptVers = dataService.getScriptVersions(c.id);
                      const videoVers = dataService.getVideoVersions(c.id);
                      const currentVerCount = assetType === 'Script' ? scriptVers.length : videoVers.length;

                      return (
                        <div
                          key={c.id}
                          onClick={() => handleSelectContent(c)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-500 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-indigo-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-600 text-white'
                                  : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                {c.title}
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                                  {c.platform}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>达人: <strong className="text-slate-700">{kol?.name || '未知达人'}</strong></span>
                                <span>•</span>
                                <span>已有版本: {assetType === 'Script' ? `Script V${currentVerCount}` : `Video V${currentVerCount}`}</span>
                                <span>•</span>
                                <span className="text-indigo-600 font-semibold">
                                  将归档为 V{currentVerCount + 1}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-md font-semibold ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isSelected ? '✓ 已选中归档' : '选择归档'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center space-y-2">
                    <p className="text-xs text-slate-500">
                      未检索到与【{kolQuery}】匹配的 Content 任务
                    </p>
                    {kolQuery && (
                      <button
                        type="button"
                        onClick={handleAutoCreateAndArchive}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs hover:bg-indigo-100 flex items-center gap-1 mx-auto"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        直接为此达人新建任务并归档
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Material & Content Input */}
            <div className="space-y-3 pt-1">
              <label className="block text-xs font-bold text-slate-800">
                3. 上传或录入版本素材
              </label>

              {/* Version Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  版本标题 / 标识 *
                </label>
                <input
                  type="text"
                  placeholder="例如：极客老张_Youtube_脚本_V2"
                  value={versionTitle}
                  onChange={(e) => setVersionTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              {/* File Upload / Drag Simulation */}
              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 bg-slate-50/60 transition-colors text-center relative cursor-pointer">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept={
                    assetType === 'Script'
                      ? '.docx,.doc,.pdf,.txt'
                      : '.mp4,.mov,.avi,.mkv'
                  }
                />
                <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-1" />
                <div className="text-xs font-semibold text-slate-800">
                  {fileName ? `已选择文件: ${fileName}` : `点击或拖拽上传达人 ${assetType === 'Script' ? '脚本' : '视频'} 文件`}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {assetType === 'Script' ? '支持 .docx / .pdf / .txt' : '支持 .mp4 / .mov / 高清样片'}（系统将自动识别文件名并匹配达人）
                </div>
              </div>

              {/* Content Specific Inputs */}
              {assetType === 'Script' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>脚本台词正文 (Script Text)</span>
                    <span className="text-[11px] text-indigo-600 font-normal">
                      提交后 AI Agent 将自动比对 Brief 123 点并生成省广初审草稿
                    </span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="可在此直接粘贴达人分镜台词/画面脚本描述..."
                    value={scriptText}
                    onChange={(e) => setScriptText(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Link className="w-3.5 h-3.5 text-slate-400" />
                    视频在线播放 / 审片网盘链接 (Video URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/... 或 腾讯微云/网盘链接/MP4直链"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Submit Action Bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                {selectedContent ? (
                  <span className="flex items-center gap-1.5 text-indigo-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    就绪：归档至【{selectedKol?.name || '达人'}】《{selectedContent.title}》
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="w-3.5 h-3.5" />
                    请在上方选择或创建归档目标 Content
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!selectedContentId || isSubmitting}
                  className={`px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 ${
                    !selectedContentId || isSubmitting
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {isSubmitting ? (
                    '正在自动识别并归档...'
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      立即识别并自动归档
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
