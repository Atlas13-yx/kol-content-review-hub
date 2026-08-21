import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Send,
  Building2,
  TrendingUp,
  FileSpreadsheet,
  Award,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { ContentItem } from '../types';

interface AiBriefAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ContentItem | null;
  onApproveSuccess?: () => void;
}

export const AiBriefAuditModal: React.FC<AiBriefAuditModalProps> = ({
  isOpen,
  onClose,
  content,
  onApproveSuccess,
}) => {
  const currentRole = dataService.getCurrentRole();
  const kols = dataService.getKols();
  const campaigns = dataService.getCampaigns();

  const kol = content ? kols.find((k) => k.id === content.kolId) : null;
  const campaign = content ? campaigns.find((c) => c.id === content.campaignId) : null;

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [customComment, setCustomComment] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const runAudit = async () => {
    if (!content) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/audit-brief-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentTitle: content.title,
          campaignName: campaign?.name || '广汽国际出海营销',
          campaignBrief: campaign?.brief || '',
          kolName: kol?.name || '',
          platform: content.platform,
          briefData: content.briefData || {
            creativeDirection: content.briefText,
            providedAssets: ['下线仪式高光', 'M8 PHEV 车型快剪', '工厂自动化'],
            followersCount: kol?.followers,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDiagnosticResult(data.result);
        if (data.result?.suggestedReviewComments) {
          setCustomComment(data.result.suggestedReviewComments);
        }
      }
    } catch (e) {
      console.error('Failed to run AI Brief audit', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && content) {
      runAudit();
    } else {
      setDiagnosticResult(null);
      setCustomComment('');
    }
  }, [isOpen, content?.id]);

  if (!isOpen || !content) return null;

  const handleCopyComment = () => {
    if (customComment) {
      navigator.clipboard.writeText(customComment);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApproveWithAi = () => {
    setFormError(null);
    dataService.approveBrief(
      content.id,
      customComment || diagnosticResult?.suggestedReviewComments || '广汽国际已审核通过该 Brief 方案'
    );
    if (onApproveSuccess) onApproveSuccess();
    onClose();
  };

  const handleRequestRevisionWithAi = () => {
    setFormError(null);
    if (!customComment.trim()) {
      setFormError('请在下方文本框填写修改意见后再退回！');
      return;
    }
    dataService.requestBriefRevision(content.id, customComment);
    if (onApproveSuccess) onApproveSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                AI 智能 Brief 战略质量诊断
                <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-mono">
                  Gemini 3.7 Flash
                </span>
              </h2>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                深度评判达人提报方案的话题反差度、品牌价值植入、素材包支撑力与投产比 ROI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={runAudit}
              disabled={loading}
              className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
              title="重新诊断"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Content Brief Summary Banner */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <span>{content.title}</span>
                <span className="px-2 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                  {content.category || '二创'}
                </span>
              </div>
              <p className="text-slate-500 text-[11px]">
                达人：{kol?.name || '达人'} ({content.platform}) | 地区：{content.briefData?.region || '海外'} | 预算：¥{content.briefData?.collaborationCost || 0}
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                预估播放: {content.briefData?.estimatedViews || '25000+'}
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                预估CPC: ¥{content.briefData?.estimatedCpc || '0.60'}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block p-4 rounded-2xl bg-indigo-50 text-indigo-600 animate-pulse">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
              <div className="text-sm font-bold text-slate-700">Gemini 正在全方位审读 Brief 提报方案...</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                正在比对 3000 万台下线背书、切入反差视角、海外受众痛点与素材包匹配度
              </p>
            </div>
          ) : diagnosticResult ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Score & Main Verdict Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white shadow-md flex items-center justify-between gap-4 border border-emerald-500/30">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      诊断结论: {diagnosticResult.recommendation || '推荐通过'}
                    </span>
                    <span className="text-xs text-slate-300">AI 综合质量指数</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed max-w-lg">
                    {diagnosticResult.summary}
                  </p>
                </div>

                <div className="text-center shrink-0 p-3 rounded-xl bg-white/10 border border-white/10">
                  <div className="text-3xl font-extrabold font-mono text-emerald-400">
                    {diagnosticResult.score || 93}
                  </div>
                  <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider mt-0.5">
                    Brief Score
                  </div>
                </div>
              </div>

              {/* 4 Dimension Cards */}
              {diagnosticResult.dimensionScores && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500 font-medium block">话题切入反差</span>
                    <div className="text-lg font-bold font-mono text-indigo-700 mt-0.5">
                      {diagnosticResult.dimensionScores.topicHook || 95}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500 font-medium block">品牌价值植入</span>
                    <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                      {diagnosticResult.dimensionScores.brandIntegration || 92}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500 font-medium block">素材包支撑力</span>
                    <div className="text-lg font-bold font-mono text-purple-700 mt-0.5">
                      {diagnosticResult.dimensionScores.assetSupport || 94}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500 font-medium block">投产比 ROI</span>
                    <div className="text-lg font-bold font-mono text-cyan-700 mt-0.5">
                      {diagnosticResult.dimensionScores.roiFeasibility || 90}
                    </div>
                  </div>
                </div>
              )}

              {/* Strengths & Optimization Suggestions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-2">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Brief 核心亮点 (Strengths)
                  </span>
                  <ul className="space-y-1.5 text-xs text-emerald-800">
                    {Array.isArray(diagnosticResult.strengths) &&
                      diagnosticResult.strengths.map((str: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                  </ul>
                </div>

                {/* Suggestions */}
                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    优化建议与风险点 (Suggestions)
                  </span>
                  <ul className="space-y-1.5 text-xs text-amber-800">
                    {Array.isArray(diagnosticResult.risksAndSuggestions) &&
                      diagnosticResult.risksAndSuggestions.map((sug: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{sug}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>

              {/* Editable Suggested Review Feedback */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                {formError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700 font-medium">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    广汽国际审核批注草稿 (可编辑后直接核准)
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyComment}
                    className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? '已复制' : '复制意见'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={customComment}
                  onChange={(e) => setCustomComment(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors"
          >
            关闭
          </button>

          <div className="flex items-center gap-2">
            {currentRole === 'Me' ? (
              <>
                <button
                  type="button"
                  onClick={handleRequestRevisionWithAi}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  按此意见退回修改
                </button>
                <button
                  type="button"
                  onClick={handleApproveWithAi}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>一键核准通过 Brief</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleCopyComment}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer"
              >
                复制 AI 优化建议
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
