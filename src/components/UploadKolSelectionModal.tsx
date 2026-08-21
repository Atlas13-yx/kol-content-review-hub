import React, { useState } from 'react';
import { Campaign } from '../types';
import { dataService } from '../services/dataService';
import {
  Upload,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Link,
  Layers,
  Users,
  FileText,
  Sparkles,
  Paperclip
} from 'lucide-react';

interface UploadKolSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: Campaign[];
  defaultCampaignId?: string;
  onSuccess?: () => void;
}

export const UploadKolSelectionModal: React.FC<UploadKolSelectionModalProps> = ({
  isOpen,
  onClose,
  campaigns,
  defaultCampaignId,
  onSuccess,
}) => {
  const [campaignId, setCampaignId] = useState<string>(
    defaultCampaignId || (campaigns.length > 0 ? campaigns[0].id : '')
  );
  const [title, setTitle] = useState('');
  const [candidateCount, setCandidateCount] = useState<number | ''>(8);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setFileSize(`${sizeMb} MB`);
      setFileUrl(URL.createObjectURL(file));
      if (!title) {
        const selectedCamp = campaigns.find((c) => c.id === campaignId);
        setTitle(`【${selectedCamp?.name || '达人初选'}】候选达人提名与报价表`);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileName(file.name);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setFileSize(`${sizeMb} MB`);
      setFileUrl(URL.createObjectURL(file));
      if (!title) {
        const selectedCamp = campaigns.find((c) => c.id === campaignId);
        setTitle(`【${selectedCamp?.name || '达人初选'}】候选达人提名与报价表`);
      }
    }
  };

  const handleQuickFillSample = () => {
    const selectedCamp = campaigns.find((c) => c.id === campaignId);
    const campName = selectedCamp?.name || '巴黎车展海外传播';
    setTitle(`【${campName}】海外核心汽车达人提名与报价初筛表 (第1批)`);
    setCandidateCount(8);
    setFileName(`2026_${campName}_达人候选初筛清单_省广提报.xlsx`);
    setFileSize('2.3 MB');
    setFileUrl('https://example.com/files/gac_kol_screening_sample.xlsx');
    setSheetUrl('https://docs.google.com/spreadsheets/d/1_gac_sample_kol_screening');
    setNotes('已完成首轮 8 位海外达人（涵盖俄罗斯、中东与欧洲）档期排查、报价核算及完播率评估，附历史合作品质评价，请广汽国际领导审阅定选。');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignId) {
      setErrorMsg('请选择所属 Campaign 活动');
      return;
    }
    if (!fileName && !sheetUrl) {
      setErrorMsg('请上传达人筛选 Excel 表格文件或填入在线表格链接');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const selectedCamp = campaigns.find((c) => c.id === campaignId);
      dataService.submitKolSelectionBatch({
        campaignId,
        title: title || `【${selectedCamp?.name || '营销活动'}】达人候选提名表`,
        candidateCount: typeof candidateCount === 'number' ? candidateCount : 0,
        agencyFileName: fileName || '达人初选提报表.xlsx',
        agencyFileSize: fileSize || '1.8 MB',
        agencyFileUrl: fileUrl || 'https://example.com/files/kol_selection.xlsx',
        agencySheetUrl: sheetUrl,
        agencyNotes: notes,
        agencySubmittedBy: '省广集团 GIMC 海外媒介组',
      });

      setIsSubmitting(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || '提报失败，请重试');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/50 flex items-center justify-center text-white border border-indigo-400/30 shadow-inner">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>省广提报：上传达人筛选表格</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  省广提交通道
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                上传候选达人初筛表格并指定所属 Campaign，提交至广汽国际进行定选审核
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Fill Toolbar */}
          <div className="flex items-center justify-between bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-xs">
            <div className="flex items-center gap-2 text-indigo-900 font-medium">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>省广提报标准模版：包含达人画像、各平台粉丝、报价与均播数据</span>
            </div>
            <button
              type="button"
              onClick={handleQuickFillSample}
              className="px-2.5 py-1 bg-white border border-indigo-200 hover:border-indigo-300 text-indigo-700 font-bold rounded-lg transition-colors shadow-2xs cursor-pointer text-[11px]"
            >
              一键填入提报范例
            </button>
          </div>

          {/* Campaign Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>所属营销活动 (Campaign) <span className="text-rose-500">*</span></span>
              </span>
              <span className="text-[11px] font-normal text-slate-400">选择该批次达人归属的活动项目</span>
            </label>
            <select
              value={campaignId}
              onChange={(e) => {
                setCampaignId(e.target.value);
                const selected = campaigns.find((c) => c.id === e.target.value);
                if (selected && !title) {
                  setTitle(`【${selected.name}】达人候选提名初选表`);
                }
              }}
              required
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
            >
              {campaigns.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.name} ({camp.status})
                </option>
              ))}
            </select>
          </div>

          {/* Batch Title & Candidate Count */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>提报批次标题 <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：【巴黎车展】欧洲本土汽车评测达人初选提案表 (第1批)"
                required
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>候选达人总数</span>
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={candidateCount}
                onChange={(e) => setCandidateCount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="如: 8"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* File Upload Zone (Drag and drop or select) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                <span>上传达人初筛表格文件 (.xlsx / .xls / .csv) <span className="text-rose-500">*</span></span>
              </span>
              <span className="text-[11px] font-normal text-slate-400">支持拖拽或本地选取</span>
            </label>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : fileName
                  ? 'border-emerald-300 bg-emerald-50/30'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
              }`}
            >
              {fileName ? (
                <div className="flex items-center justify-between bg-white border border-emerald-200 rounded-xl p-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 truncate max-w-sm">{fileName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>大小: {fileSize || '2.1 MB'}</span>
                        <span className="text-emerald-600 font-medium">✓ 已准备就绪</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFileName('');
                      setFileSize('');
                      setFileUrl('');
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-slate-700 font-medium">
                    拖拽 Excel 表格至此处，或{' '}
                    <label className="text-indigo-600 hover:text-indigo-700 font-bold cursor-pointer underline underline-offset-2">
                      点击浏览本地文件
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    支持 Excel 2007+ (.xlsx)、.xls 或 .csv 格式表格文件（最大 20MB）
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Online Sheet Link (Optional backup) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-indigo-600" />
                <span>在线协作表格链接 (飞书 / 腾讯文档 / Google Sheets / 语雀) (选填)</span>
              </span>
            </label>
            <input
              type="url"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/... 或 飞书在线表格链接"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Notes & Screening Context */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              提报说明与初选考量 (省广备注):
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="说明达人地区覆盖、垂类分布、预算范围、议价空间或档期排查情况..."
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-900/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isSubmitting ? '正在提交...' : '提交表格至广汽国际审核'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
