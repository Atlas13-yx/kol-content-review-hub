import React, { useState } from 'react';
import { KolSelectionBatch, Campaign } from '../types';
import { dataService } from '../services/dataService';
import {
  ShieldCheck,
  X,
  FileSpreadsheet,
  Download,
  ExternalLink,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Sparkles,
  Link,
  MessageSquareQuote,
  Building2,
  ArrowRight
} from 'lucide-react';

interface ReviewKolSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: KolSelectionBatch;
  campaign?: Campaign;
  onSuccess?: () => void;
}

export const ReviewKolSelectionModal: React.FC<ReviewKolSelectionModalProps> = ({
  isOpen,
  onClose,
  batch,
  campaign,
  onSuccess,
}) => {
  const [outcome, setOutcome] = useState<'Approved' | 'Revision Required'>('Approved');
  const [gacFileName, setGacFileName] = useState(batch.gacFileName || '');
  const [gacFileSize, setGacFileSize] = useState(batch.gacFileSize || '');
  const [gacFileUrl, setGacFileUrl] = useState(batch.gacFileUrl || '');
  const [gacSheetUrl, setGacSheetUrl] = useState(batch.gacSheetUrl || '');
  const [gacNotes, setGacNotes] = useState(
    batch.gacNotes ||
      `广汽国际审核意见：同意定选本批次达人。达人画像与海外受众契合度高，报价合理。请省广尽快对接达人档期并进入 Brief 制定流程。`
  );
  const [approvedKolCount, setApprovedKolCount] = useState<number | ''>(
    batch.approvedKolCount !== undefined ? batch.approvedKolCount : (batch.candidateCount ? Math.ceil(batch.candidateCount * 0.6) : 4)
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGacFileName(file.name);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setGacFileSize(`${sizeMb} MB`);
      setGacFileUrl(URL.createObjectURL(file));
    }
  };

  const handleQuickAttachDefaultFeedback = () => {
    const campName = campaign?.name || '营销活动';
    if (outcome === 'Approved') {
      setGacFileName(`2026_${campName}_达人定选确认与批注表_GAC_Approved.xlsx`);
      setGacFileSize('2.5 MB');
      setGacFileUrl('https://example.com/files/gac_kol_approved_final.xlsx');
      setGacSheetUrl('https://docs.google.com/spreadsheets/d/1_gac_kol_final_selection');
      setGacNotes(
        '广汽国际审核意见：同意通过定选名单！核心汽车测评博主已完成确认，请省广推进各达人签订合作排期，并进入 Brief 审核阶段。'
      );
      setApprovedKolCount(batch.candidateCount ? Math.max(1, batch.candidateCount - 2) : 4);
    } else {
      setGacFileName(`2026_${campName}_达人初选修改与调整要求_GAC_Feedback.xlsx`);
      setGacFileSize('1.9 MB');
      setGacFileUrl('https://example.com/files/gac_kol_feedback_revision.xlsx');
      setGacSheetUrl('');
      setGacNotes(
        '广汽国际审核意见：本批次中腰部达人整体报价偏高，且部分达人近期互动率有所下滑。请省广根据附件批注表格重新筛选并补充 2-3 位高互动评测博主后重新提报。'
      );
      setApprovedKolCount(0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gacFileName && !gacSheetUrl) {
      setErrorMsg('请在反馈通道中上传广汽国际定选/反馈 Excel 表格，或填入在线表格链接');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      dataService.reviewKolSelectionBatch(batch.id, {
        status: outcome,
        gacFileName: gacFileName || (outcome === 'Approved' ? '广汽达人定选确认表.xlsx' : '广汽达人修改意见表.xlsx'),
        gacFileSize: gacFileSize || '2.0 MB',
        gacFileUrl: gacFileUrl || 'https://example.com/files/gac_feedback.xlsx',
        gacSheetUrl,
        gacNotes,
        gacReviewedBy: '广汽国际 GAC 海外营销部',
        approvedKolCount: typeof approvedKolCount === 'number' ? approvedKolCount : undefined,
      });

      setIsSubmitting(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || '审核提交失败，请重试');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>广汽国际审核：达人筛选与反馈提交通道</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  我的审核通道
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                查阅省广提报文件，完成筛选定选并上传新的反馈表格回传给省广
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Agency Submitted Table (省广提报文件展示区) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <h3 className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                  1. 省广提报信息与候选表格 (Agency Submission)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>提报时间：{new Date(batch.agencySubmittedAt).toLocaleString('zh-CN')}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                <div className="text-[11px] text-slate-400">所属 Campaign 活动</div>
                <div className="font-bold text-slate-800">{campaign?.name || batch.campaignId}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                <div className="text-[11px] text-slate-400">提报方 / 批次</div>
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <span>{batch.agencySubmittedBy}</span>
                  <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[10px]">
                    第 {batch.batchNumber} 批 (候选 {batch.candidateCount || 0} 位)
                  </span>
                </div>
              </div>
            </div>

            {/* Agency File Download Card */}
            <div className="bg-white border-2 border-indigo-100 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {batch.agencyFileName}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>文件大小: {batch.agencyFileSize || '2.0 MB'}</span>
                    <span className="text-indigo-600 font-medium">省广原始筛选表</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {batch.agencySheetUrl && (
                  <a
                    href={batch.agencySheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>在线表格</span>
                  </a>
                )}
                <a
                  href={batch.agencyFileUrl || '#'}
                  download={batch.agencyFileName}
                  onClick={(e) => {
                    if (!batch.agencyFileUrl || batch.agencyFileUrl.startsWith('http')) {
                      // Simulated download notification
                      alert(`正在下载省广提报表格：${batch.agencyFileName}`);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下载表格进行筛选</span>
                </a>
              </div>
            </div>

            {batch.agencyNotes && (
              <div className="text-xs text-slate-600 bg-white/80 border border-slate-200/60 rounded-xl p-3">
                <span className="font-bold text-slate-800">省广初选说明：</span> {batch.agencyNotes}
              </div>
            )}
          </div>

          {/* Section 2: GAC Review & Feedback Upload Channel (广汽国际反馈提交通道) */}
          <div className="bg-amber-50/50 border-2 border-amber-200/80 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h3 className="text-xs font-bold text-amber-950 tracking-wide uppercase">
                  广汽国际反馈表格提交通道 (Feedback Upload Channel)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleQuickAttachDefaultFeedback}
                className="px-2.5 py-1 bg-white border border-amber-300 hover:border-amber-400 text-amber-800 font-bold rounded-lg transition-colors text-[11px] shadow-2xs self-start sm:self-auto cursor-pointer"
              >
                一键生成广汽批复范例与表格
              </button>
            </div>

            <p className="text-xs text-amber-800/80">
              请在此处上传您完成定选/批注后的新表格文件，并填写批复意见。提交后将即时推送给省广代理商。
            </p>

            {/* Audit Decision Outcome Toggle */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">审核裁决结果：</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOutcome('Approved');
                    if (gacNotes.includes('需调整') || gacNotes.includes('重新筛选')) {
                      setGacNotes('广汽国际审核意见：同意通过定选名单！请省广尽快推进达人 Brief 制定与排期。');
                    }
                  }}
                  className={`p-3 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    outcome === 'Approved'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>✅ 审核通过 · 定选确认并下发反馈表格</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOutcome('Revision Required');
                    if (!gacNotes.includes('需调整') && !gacNotes.includes('重新筛选')) {
                      setGacNotes('广汽国际审核意见：达人报价偏高或画像不符，请省广参考反馈表格调整并补充达人重新提报。');
                    }
                  }}
                  className={`p-3 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    outcome === 'Revision Required'
                      ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>🔄 要求修改 · 退回并下发调整要求表格</span>
                </button>
              </div>
            </div>

            {/* Approved Count (if approved) */}
            {outcome === 'Approved' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  最终确认定选达人数量 (Approved KOL Count):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={batch.candidateCount || 20}
                    value={approvedKolCount}
                    onChange={(e) => setApprovedKolCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-32 text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                  <span className="text-xs text-slate-500">
                    （原候选达人共 {batch.candidateCount || 0} 位）
                  </span>
                </div>
              </div>
            )}

            {/* GAC File Upload Zone */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>上传广汽国际反馈/定选确认表格 (.xlsx / .xls) <span className="text-rose-500">*</span></span>
                <span className="text-[11px] font-normal text-slate-500">回传给省广的批注文件</span>
              </label>

              <div
                className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
                  gacFileName
                    ? 'border-emerald-400 bg-emerald-50/50'
                    : 'border-amber-300 bg-white/80 hover:border-amber-500'
                }`}
              >
                {gacFileName ? (
                  <div className="flex items-center justify-between bg-white border border-emerald-200 rounded-xl p-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 truncate max-w-sm">
                          {gacFileName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>大小: {gacFileSize || '2.2 MB'}</span>
                          <span className="text-emerald-600 font-medium">✓ 广汽国际反馈表格已附加</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setGacFileName('');
                        setGacFileSize('');
                        setGacFileUrl('');
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div className="text-xs text-slate-700 font-medium">
                      选择广汽国际筛选反馈表格，或{' '}
                      <label className="text-amber-700 hover:text-amber-800 font-bold cursor-pointer underline underline-offset-2">
                        点击上传本地文件
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      支持 Excel .xlsx / .xls 格式表格
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Online Sheet URL (Optional) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-amber-600" />
                <span>广汽在线批注表格链接 (选填)</span>
              </label>
              <input
                type="url"
                value={gacSheetUrl}
                onChange={(e) => setGacSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/... 或 飞书在线批注链接"
                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Review Comments / Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MessageSquareQuote className="w-3.5 h-3.5 text-amber-600" />
                <span>广汽国际定选批复意见 (将推送给省广):</span>
              </label>
              <textarea
                rows={3}
                value={gacNotes}
                onChange={(e) => setGacNotes(e.target.value)}
                placeholder="输入定选达人说明、传播策略重点、修改要求或排期指示..."
                className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-800"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                outcome === 'Approved'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/20'
              }`}
            >
              {outcome === 'Approved' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? '提交中...' : '提交定选结果并下发反馈表格'}</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>{isSubmitting ? '提交中...' : '退回修改并下发调整表格'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
