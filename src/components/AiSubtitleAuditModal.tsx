import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Globe2,
  Languages,
  Copy,
  ArrowRight,
  ShieldCheck,
  Zap,
  ListChecks,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { AssetType, ContentItem, Campaign } from '../types';

interface AiSubtitleAuditModalProps {
  isOpen: boolean;
  content: ContentItem;
  campaign?: Campaign;
  assetType: AssetType;
  versionNumber: number;
  initialSubtitles?: string;
  onClose: () => void;
  onApplyReviewDraft?: (draftText: string) => void;
}

// Preset multilingual transcripts for demo/quick test
const MOCK_PRESET_SUBTITLES = [
  {
    title: '巴黎车展 GAC AION V 试驾视频字幕 (法/英/中)',
    language: '法/英/中多语种',
    text: `[00:00 - 00:08] (EN) Welcome to the Paris Motor Show! Today we are taking a closer look at the brand-new GAC AION V.
[00:09 - 00:20] (FR) La nouvelle GAC AION V fait sa première apparition européenne avec un design élégant et une autonomie remarquable.
[00:21 - 00:38] (CN) 咱们来看一下这款车的智驾表现，搭载了 GAC ADAS 2.0 智能驾驶辅助系统，在巴黎狭窄路段表现非常平稳！
[00:39 - 00:55] (EN) Safety is paramount. It achieved the Euro-NCAP 5-Star safety rating, giving drivers absolute peace of mind.
[00:56 - 01:10] (CN) 广汽国际全球累计下线已突破3000万台，品质保障毋庸置疑！Go For More!`,
  },
  {
    title: '泰国曼谷试驾 Vlog 视频字幕 (泰/英)',
    language: '泰/英双语',
    text: `[00:00 - 00:10] (TH) สวัสดีครับทุกคน! วันนี้เรามารีวิว รถยนต์ไฟฟ้า GAC AION Y Plus ในกรุงเทพฯ
[00:11 - 00:25] (EN) The cabin space is amazingly spacious, perfect for family road trips across Thailand.
[00:26 - 00:45] (TH) ระบบขับขี่อัจฉริยะและแบตเตอรี่ทรงพลัง ปลอดภัยมาตรฐาน 5 ดาว
[00:46 - 01:00] (EN) GAC International brings world-class engineering to Southeast Asia!`,
  },
  {
    title: '中东沙特 智驾与品质体验字幕 (阿/英)',
    language: '阿/英双语',
    text: `[00:00 - 00:12] (AR) أهلاً بكم في تجربة قيادة سيارات GAC في الرياض.
[00:13 - 00:30] (EN) Testing the extreme heat performance and smart ADAS features of GAC SUV in Saudi Arabia.
[00:31 - 00:50] (AR) الأمان والتكنولوجيا المتطورة متوفرة بأسعار تنافسية للغاية.`,
  },
];

export const AiSubtitleAuditModal: React.FC<AiSubtitleAuditModalProps> = ({
  isOpen,
  content,
  campaign,
  assetType,
  versionNumber,
  initialSubtitles = '',
  onClose,
  onApplyReviewDraft,
}) => {
  const [subtitlesText, setSubtitlesText] = useState(initialSubtitles);
  const [selectedLanguage, setSelectedLanguage] = useState('多语种 (中/英/法/泰/阿)');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  useEffect(() => {
    if (initialSubtitles) {
      setSubtitlesText(initialSubtitles);
    } else if (MOCK_PRESET_SUBTITLES[0]) {
      setSubtitlesText(MOCK_PRESET_SUBTITLES[0].text);
    }
  }, [initialSubtitles, isOpen]);

  if (!isOpen) return null;

  const handleRunAudit = async () => {
    if (!subtitlesText.trim()) {
      alert('请选择或输入字幕/台词文本后再运行 AI 审核');
      return;
    }

    setIsLoading(true);
    setAuditResult(null);

    try {
      const res = await dataService.auditBriefWithAi({
        contentTitle: content.title,
        campaignName: campaign?.name || '广汽国际出海营销',
        campaignBrief: campaign?.brief || '重点突出巴黎车展首秀、欧洲五星安全、智驾系统与3000万下线品质背书。',
        contentBrief: content.briefText || '多语种本地化测评视频，要求融入车展镜头与品牌 Tagline。',
        subtitlesText: subtitlesText.trim(),
        language: selectedLanguage,
        assetType,
      });

      if (res.success && res.result) {
        setAuditResult(res.result);
      } else {
        alert('AI 审核服务未返回有效数据，请重试');
      }
    } catch (err: any) {
      console.error('AI Audit Error:', err);
      alert('运行 AI 审核失败，请检查后端网络连接');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyDraft = () => {
    if (auditResult?.agencyReviewDraft && onApplyReviewDraft) {
      onApplyReviewDraft(auditResult.agencyReviewDraft);
      onClose();
    }
  };

  const handleCopyDraft = () => {
    if (auditResult?.agencyReviewDraft) {
      navigator.clipboard.writeText(auditResult.agencyReviewDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 border border-blue-400/30 rounded-xl">
              <Sparkles className="w-6 h-6 text-cyan-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">省广多语种字幕识别与 Brief 智能初审插件</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-400/20 text-cyan-200 border border-cyan-400/30">
                  Gemini AI Powered
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                审核目标: 《{content.title}》 ({assetType === 'Script' ? '脚本' : '视频'} V{versionNumber})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Brief Reference Banner */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Campaign 总体 Brief 要求
              </span>
              <p className="text-xs text-slate-700 font-medium line-clamp-3">
                {campaign?.brief || '包含巴黎车展首秀宣传、广汽国际全球3000万下线品质背书、5星安全标准及智能座舱描述。'}
              </p>
            </div>
            <div className="space-y-1 md:border-l md:border-slate-100 md:pl-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <ListChecks className="w-3.5 h-3.5 text-indigo-600" />
                本篇 Content 专项 Brief
              </span>
              <p className="text-xs text-slate-700 font-medium line-clamp-3">
                {content.briefText || '本地化 KOL 试驾测评，字幕需包含中/英/法/泰等多语种对齐，突出 ADAS 智驾和空间舒适度。'}
              </p>
            </div>
          </div>

          {/* Subtitle / Script Input Area */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-blue-600" />
                <label className="text-xs font-bold text-slate-800">
                  视频字幕 / 语音转写文本 (ASR / OCR 插件识别)
                </label>
              </div>

              {/* Preset Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">载入预置示例:</span>
                <select
                  className="text-xs bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    if (MOCK_PRESET_SUBTITLES[idx]) {
                      setSubtitlesText(MOCK_PRESET_SUBTITLES[idx].text);
                      setSelectedLanguage(MOCK_PRESET_SUBTITLES[idx].language);
                    }
                  }}
                >
                  {MOCK_PRESET_SUBTITLES.map((item, index) => (
                    <option key={index} value={index}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <textarea
              rows={5}
              value={subtitlesText}
              onChange={(e) => setSubtitlesText(e.target.value)}
              placeholder="在此粘贴视频识别出来的多语种字幕、SRT 文本或口播脚本..."
              className="w-full px-3 py-2.5 text-xs font-mono bg-slate-900 text-cyan-200 rounded-xl border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <Globe2 className="w-3.5 h-3.5 text-slate-400" />
                <span>目标识别语种: {selectedLanguage}</span>
              </div>
              <button
                type="button"
                onClick={handleRunAudit}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>AI 正在对齐 Brief 进行初审中...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-cyan-300" />
                    <span>运行 Gemini 智能初审插件</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Audit Result Display */}
          {auditResult && (
            <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-lg space-y-5 animate-in fade-in duration-200">
              {/* Score Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-md ${
                      auditResult.overallPass
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                        : 'bg-gradient-to-br from-amber-500 to-orange-600'
                    }`}
                  >
                    {auditResult.score}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">Brief 匹配度智能综合诊断</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          auditResult.overallPass
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {auditResult.overallPass ? '✅ 建议省广提交终审' : '⚠️ 建议要求达人修改'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{auditResult.summary}</p>
                  </div>
                </div>
              </div>

              {/* Selling Points Compliance Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  1. Brief 核心卖点覆盖核查
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {auditResult.sellingPointsCheck?.map((sp: any, i: number) => (
                    <div key={i} className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-xs">
                      <div className="flex items-center justify-between font-semibold mb-1">
                        <span className="text-slate-800">{sp.point}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            sp.status?.includes('已') || sp.status?.includes('符合')
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {sp.status}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px]">{sp.comment}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Multilingual Subtitle & Brand Quality */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 space-y-1">
                  <span className="font-bold text-blue-900 flex items-center gap-1">
                    <Globe2 className="w-3.5 h-3.5 text-blue-600" />
                    2. 多语种字幕精准度诊断
                  </span>
                  <p className="text-blue-800 text-[11px] leading-relaxed">{auditResult.subtitleQualityComment}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                    3. 广汽国际品牌规范与合规排查
                  </span>
                  <p className="text-slate-700 text-[11px] leading-relaxed">{auditResult.brandToneComment}</p>
                </div>
              </div>

              {/* Revision Suggestions */}
              {auditResult.revisionPoints?.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    4. 建议修改意见清单
                  </h4>
                  <ul className="space-y-1 pl-1">
                    {auditResult.revisionPoints.map((pt: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 bg-amber-50/50 p-2 rounded-lg border border-amber-100/60">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Generated Agency Review Draft */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    生成的一版“省广初审意见”草稿
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyDraft}
                    className="text-[11px] text-amber-700 hover:text-amber-900 flex items-center gap-1 font-semibold"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copied ? '已复制' : '复制草稿'}</span>
                  </button>
                </div>
                <p className="text-xs text-amber-950 font-medium leading-relaxed bg-white/80 p-3 rounded-lg border border-amber-200/60">
                  {auditResult.agencyReviewDraft}
                </p>

                {onApplyReviewDraft && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleApplyDraft}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5"
                    >
                      <span>自动填入省广审核意见框</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>省广审核智能插件 v2.0 • 支持中/英/法/泰/阿多语种字幕精准比对</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-medium text-slate-600 hover:bg-slate-200/70"
          >
            关闭插件
          </button>
        </div>
      </div>
    </div>
  );
};
