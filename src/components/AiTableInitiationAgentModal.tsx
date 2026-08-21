import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Trash2,
  Plus,
  ArrowRight,
  RotateCcw,
  Check,
  X,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Sliders,
  ExternalLink,
  Shield,
  Video,
  Share2,
  Gift,
  Film
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { Campaign, KOL, Platform, ContentCategory, InitiationCandidate, UserRole } from '../types';
import {
  downloadExcelTemplate,
  downloadCsvTemplate,
  parseExcelOrCsvFile,
  parsePastedTableText,
  mapRawRowsToCandidates,
  INITIATION_TEMPLATE_COLUMNS,
  SAMPLE_INITIATION_DATA,
} from '../utils/excelTemplate';

interface AiTableInitiationAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdCount: number) => void;
}

export const AiTableInitiationAgentModal: React.FC<AiTableInitiationAgentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [kols, setKols] = useState<KOL[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>(dataService.getCurrentRole());

  // Input states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [showSpecs, setShowSpecs] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Review states (Candidate records)
  const [candidates, setCandidates] = useState<InitiationCandidate[]>([]);
  const [bulkCampaignId, setBulkCampaignId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeViewMode, setActiveViewMode] = useState<'core' | 'addons' | 'all'>('core');
  const [editingAddonCandidateId, setEditingAddonCandidateId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCampaigns(dataService.getCampaigns());
      setKols(dataService.getKols());
      setCurrentRole(dataService.getCurrentRole());
      setStep('input');
      setUploadedFile(null);
      setPastedText('');
      setParseError(null);
      setCandidates([]);
      setShowSpecs(false);
      setActiveViewMode('core');
      setEditingAddonCandidateId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle file drop/selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setParseError(null);
    }
  };

  // Load sample demo data
  const handleLoadDemoData = () => {
    const headers = Object.keys(SAMPLE_INITIATION_DATA[0]);
    const lines = [headers.join('\t')];
    SAMPLE_INITIATION_DATA.forEach((row) => {
      lines.push(headers.map((h) => (row as any)[h]).join('\t'));
    });
    setPastedText(lines.join('\n'));
    setUploadedFile(null);
    setParseError(null);
  };

  // Execute AI Parsing
  const handleRunAiAgent = async () => {
    setIsParsing(true);
    setParseError(null);

    try {
      let rawRows: any[] = [];

      if (uploadedFile) {
        rawRows = await parseExcelOrCsvFile(uploadedFile);
      } else if (pastedText.trim()) {
        rawRows = parsePastedTableText(pastedText);
      } else {
        setParseError('请先上传 Excel / CSV 表格文件，或在下方输入框粘贴表格文本');
        setIsParsing(false);
        return;
      }

      if (!rawRows || rawRows.length === 0) {
        setParseError('未能从文件中提取到有效数据行，请检查表格格式是否包含表头');
        setIsParsing(false);
        return;
      }

      // Map raw rows into candidates
      const parsedCandidates = mapRawRowsToCandidates(rawRows, campaigns, kols);

      if (parsedCandidates.length === 0) {
        setParseError('未能匹配到有效字段，请参考标准模板表头规范');
        setIsParsing(false);
        return;
      }

      // Small artificial delay for visual feedback of AI parsing
      setTimeout(() => {
        setCandidates(parsedCandidates);
        setStep('review');
        setIsParsing(false);
      }, 500);
    } catch (err: any) {
      console.error('Error parsing table data:', err);
      setParseError(err.message || '表格解析失败，请检查文件是否损坏或格式是否正确');
      setIsParsing(false);
    }
  };

  // Candidate field manipulation
  const handleToggleSelect = (tempId: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.tempId === tempId ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setCandidates((prev) => prev.map((c) => ({ ...c, selected: select })));
  };

  const handleUpdateCandidate = (tempId: string, field: keyof InitiationCandidate, val: any) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.tempId !== tempId) return c;
        const updated = { ...c, [field]: val };
        if (field === 'campaignId') {
          const camp = campaigns.find((campItem) => campItem.id === val);
          if (camp) updated.campaignName = camp.name;
        }
        if (field === 'kolName') {
          const matched = kols.find(
            (k) => k.name.toLowerCase() === String(val).toLowerCase()
          );
          updated.kolId = matched ? matched.id : '';
          updated.isNewKol = !matched;
        }
        return updated;
      })
    );
  };

  const handleDeleteCandidate = (tempId: string) => {
    setCandidates((prev) => prev.filter((c) => c.tempId !== tempId));
  };

  const handleAddNewCandidate = () => {
    const newRow: InitiationCandidate = {
      tempId: `candidate-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      selected: true,
      campaignId: bulkCampaignId || campaigns[0]?.id || 'camp-1',
      campaignName: campaigns.find((c) => c.id === (bulkCampaignId || campaigns[0]?.id))?.name || '营销活动',
      kolId: '',
      kolName: '新达人账号',
      isNewKol: true,
      title: '欧洲高光实测新任务',
      topic: '智造实力与出海实测',
      category: '原创',
      platform: 'Youtube',
      collaborationCost: '15000',
      avgViews: '500,000',
      deadline: new Date(Date.now() + 14 * 86400 * 1000).toISOString().split('T')[0],
      creativeDirection: '围绕广汽全球化品质与核心卖点进行本地化创作。',
      region: '欧洲',
      followers: '50.0万',
      tier: '中腰部',
      resourceType: '1条Dedicated定制长视频',
      videoOrLive: '视频',
      feedback: '已进入初选沟通',
      audiencePersona: '25-45岁男性/汽车发烧友',
      canTeaserVideo: '是',
      canTestimonial: '是',
      portraitAuthDuration: '1年',
      canSecondaryCreation: '是',
      canProvideRawFootage: '是',
      canPinLinkOrMention: '是',
      canProvideAdCode: '提供 Spark Code',
      warnings: [],
      status: 'valid',
    };
    setCandidates((prev) => [...prev, newRow]);
  };

  const handleApplyBulkCampaign = () => {
    if (!bulkCampaignId) return;
    const camp = campaigns.find((c) => c.id === bulkCampaignId);
    if (!camp) return;
    setCandidates((prev) =>
      prev.map((c) =>
        c.selected ? { ...c, campaignId: camp.id, campaignName: camp.name } : c
      )
    );
  };

  // Final Confirmation: Batch Create Contents
  const handleConfirmInitiation = () => {
    setParseError(null);
    const selectedItems = candidates.filter((c) => c.selected);
    if (selectedItems.length === 0) {
      setParseError('请至少勾选一条需要立项的任务！');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = dataService.batchAddContents(selectedItems, currentRole);
      setIsSubmitting(false);
      onSuccess(created.length);
      onClose();
    } catch (e: any) {
      setParseError('立项失败：' + (e.message || '未知错误'));
      setIsSubmitting(false);
    }
  };

  const selectedCount = candidates.filter((c) => c.selected).length;
  const originalCount = candidates.filter((c) => c.selected && c.category === '原创').length;
  const secondaryCount = candidates.filter((c) => c.selected && c.category === '二创').length;
  const directCount = candidates.filter((c) => c.selected && c.category === '直发').length;

  const editingCandidate = candidates.find((c) => c.tempId === editingAddonCandidateId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                  <span>AI 表格智能识别立项 Agent</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    Table Parser Agent
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                已同步支持完整 22 项海外采购表头（基础立项信息 + 附加合作权益与细则选填项）
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                立项人：<strong className="text-white">{currentRole === 'Me' ? '广汽国际 (Me)' : '省广代理商 (Agency)'}</strong>
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 'input' ? (
            /* STEP 1: Upload & Paste Table */
            <div className="space-y-6">
              {/* Template & Spec Action Bar */}
              <div className="bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-slate-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">下载立项标准 Excel 模板</h3>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    包含基础立项信息与附加合作权益细则（肖像授权、原片网盘、二创授权、投流code等），AI 自动匹配识别。
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={downloadExcelTemplate}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>下载 Excel 模板 (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadCsvTemplate}
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV 模板</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSpecs(!showSpecs)}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showSpecs ? '收起填写指南' : '字段填写规范'}</span>
                  </button>
                </div>
              </div>

              {/* Collapsible Column Specification Guide */}
              {showSpecs && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                      <span>📋 表格字段规范与支持格式（含附加权益与细则）</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      系统支持智能表头识别（支持中英文别名模糊映射）
                    </span>
                  </div>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-100/90 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="px-3 py-2">字段名称</th>
                          <th className="px-3 py-2">属性分类</th>
                          <th className="px-3 py-2">是否必填</th>
                          <th className="px-3 py-2">示例参考值</th>
                          <th className="px-3 py-2">规则与识别说明</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {INITIATION_TEMPLATE_COLUMNS.map((col) => (
                          <tr key={col.key} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-bold text-slate-900">{col.header}</td>
                            <td className="px-3 py-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  col.isAddon
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}
                              >
                                {col.isAddon ? '附加权益与细则' : '基础核心立项'}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  col.required
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {col.required ? '必填' : '选填'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-600 font-mono text-[11px]">{col.example}</td>
                            <td className="px-3 py-2 text-slate-500 text-[11px]">{col.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Upload or Paste Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Method A: File Upload */}
                <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30 rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center relative group">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">点击或拖拽上传表格文件</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    支持 <strong>.xlsx</strong>、<strong>.xls</strong>、<strong>.csv</strong> 格式
                  </p>

                  {uploadedFile && (
                    <div className="mt-4 px-3 py-2 rounded-xl bg-white border border-indigo-200 text-xs font-bold text-indigo-700 flex items-center gap-2 shadow-xs">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
                      <span>{uploadedFile.name}</span>
                      <span className="text-[10px] text-slate-400">
                        ({(uploadedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  )}
                </div>

                {/* Method B: Direct Paste */}
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span>或者直接在此粘贴表格文本 (TSV / CSV / Markdown)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleLoadDemoData}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>⚡ 载入示例数据（含全部附加权益）</span>
                    </button>
                  </div>

                  <textarea
                    rows={7}
                    placeholder="从 Excel、WPS 或飞书表格中复制整行并直接粘贴到这里..."
                    value={pastedText}
                    onChange={(e) => {
                      setPastedText(e.target.value);
                      if (e.target.value) setUploadedFile(null);
                      setParseError(null);
                    }}
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800 resize-none"
                  />
                  <span className="text-[11px] text-slate-400">
                    提示：在 Excel 中选中表头与多行数据按 Ctrl+C，然后在此处按 Ctrl+V 即可。
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {parseError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: Human-in-the-Loop Review & Confirmation Table */
            <div className="space-y-4">
              {parseError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Batch Summary & Controls Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs">
                    已勾选立项：<span className="text-indigo-600 font-black text-sm">{selectedCount}</span> / {candidates.length} 条
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                      原创 {originalCount} 条
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                      二创 {secondaryCount} 条
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      直发 {directCount} 条 (直通成片)
                    </span>
                  </div>
                </div>

                {/* View Mode & Bulk Controls */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setActiveViewMode('core')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        activeViewMode === 'core'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      基础立项信息
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveViewMode('addons')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        activeViewMode === 'addons'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      附加合作权益 (选填项)
                    </button>
                  </div>

                  <div className="h-4 w-[1px] bg-slate-300 mx-1" />

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium">批量活动:</span>
                    <select
                      value={bulkCampaignId}
                      onChange={(e) => setBulkCampaignId(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs text-slate-800 font-medium max-w-[130px] truncate"
                    >
                      <option value="">选择活动...</option>
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleApplyBulkCampaign}
                      disabled={!bulkCampaignId}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      应用
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddNewCandidate}
                    className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-600" />
                    <span>添加一行</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="px-2 py-1 text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    全选
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="px-2 py-1 text-xs font-semibold text-slate-500 hover:underline cursor-pointer"
                  >
                    取消
                  </button>
                </div>
              </div>

              {/* Editable Candidates Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                <div className="overflow-x-auto max-h-[48vh]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/90 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={candidates.length > 0 && selectedCount === candidates.length}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </th>

                        {activeViewMode === 'core' ? (
                          <>
                            <th className="px-3 py-3 min-w-[160px]">营销活动 (Campaign)</th>
                            <th className="px-3 py-3 min-w-[150px]">Name (达人名称)</th>
                            <th className="px-3 py-3 min-w-[125px]">category (合作类型)</th>
                            <th className="px-3 py-3 min-w-[180px]">内容标题 / 主题</th>
                            <th className="px-3 py-3 min-w-[100px]">Platfrom</th>
                            <th className="px-3 py-3 min-w-[100px]">费用（净价）</th>
                            <th className="px-3 py-3 min-w-[115px]">计划发布日期</th>
                            <th className="px-3 py-3 min-w-[150px]">附加权益概览</th>
                            <th className="px-3 py-3 min-w-[190px]">核心创作方向 / Brief</th>
                          </>
                        ) : (
                          <>
                            <th className="px-3 py-3 min-w-[130px]">达人 / 平台</th>
                            <th className="px-3 py-3 min-w-[100px]">量级 (Tier)</th>
                            <th className="px-3 py-3 min-w-[140px]">合作资源形式</th>
                            <th className="px-3 py-3 min-w-[110px]">肖像授权官方</th>
                            <th className="px-3 py-3 min-w-[110px]">官方二剪二创</th>
                            <th className="px-3 py-3 min-w-[110px]">原片提供网盘</th>
                            <th className="px-3 py-3 min-w-[110px]">置顶/Bio Link</th>
                            <th className="px-3 py-3 min-w-[130px]">投流授权Code</th>
                            <th className="px-3 py-3 min-w-[150px]">达人意向与反馈</th>
                          </>
                        )}

                        <th className="px-3 py-3 w-12 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {candidates.map((cand) => (
                        <tr
                          key={cand.tempId}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            !cand.selected ? 'opacity-40 bg-slate-50/30' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={cand.selected}
                              onChange={() => handleToggleSelect(cand.tempId)}
                              className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>

                          {activeViewMode === 'core' ? (
                            <>
                              {/* Campaign Selector */}
                              <td className="px-3 py-2.5">
                                <select
                                  value={cand.campaignId}
                                  onChange={(e) => handleUpdateCandidate(cand.tempId, 'campaignId', e.target.value)}
                                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                >
                                  {campaigns.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              {/* KOL Name & Tag */}
                              <td className="px-3 py-2.5">
                                <div className="space-y-1">
                                  <input
                                    type="text"
                                    value={cand.kolName}
                                    onChange={(e) => handleUpdateCandidate(cand.tempId, 'kolName', e.target.value)}
                                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                    placeholder="达人账号"
                                  />
                                  <div className="flex items-center gap-1">
                                    {cand.isNewKol ? (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                                        <UserPlus className="w-2.5 h-2.5" />
                                        新达人(自动建档)
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                        <Check className="w-2.5 h-2.5" />
                                        已在达人库
                                      </span>
                                    )}
                                    <span className="text-[10px] text-slate-400 font-mono">{cand.followers}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Category (原创 / 二创 / 直发) */}
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-1">
                                  {(['原创', '二创', '直发'] as ContentCategory[]).map((cat) => (
                                    <button
                                      key={cat}
                                      type="button"
                                      onClick={() => handleUpdateCandidate(cand.tempId, 'category', cat)}
                                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                        cand.category === cat
                                          ? cat === '原创'
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : cat === '二创'
                                            ? 'bg-purple-600 text-white shadow-xs'
                                            : 'bg-emerald-600 text-white shadow-xs'
                                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                      }`}
                                    >
                                      {cat}
                                    </button>
                                  ))}
                                </div>
                                {cand.category === '直发' && (
                                  <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                                    ⚡ 免分镜脚本，直通成片
                                  </div>
                                )}
                              </td>

                              {/* Title & Topic */}
                              <td className="px-3 py-2.5 space-y-1">
                                <input
                                  type="text"
                                  value={cand.title}
                                  onChange={(e) => handleUpdateCandidate(cand.tempId, 'title', e.target.value)}
                                  placeholder="视频标题"
                                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                />
                                <input
                                  type="text"
                                  value={cand.topic}
                                  onChange={(e) => handleUpdateCandidate(cand.tempId, 'topic', e.target.value)}
                                  placeholder="核心切入点"
                                  className="w-full px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                                />
                              </td>

                              {/* Platform */}
                              <td className="px-3 py-2.5">
                                <select
                                  value={cand.platform}
                                  onChange={(e) => handleUpdateCandidate(cand.tempId, 'platform', e.target.value as Platform)}
                                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                >
                                  <option value="Youtube">Youtube</option>
                                  <option value="Tiktok">Tiktok</option>
                                  <option value="Instagram">Instagram</option>
                                  <option value="Facebook">Facebook</option>
                                  <option value="其他">其他</option>
                                </select>
                              </td>

                              {/* Cost */}
                              <td className="px-3 py-2.5">
                                <input
                                  type="text"
                                  value={cand.collaborationCost}
                                  onChange={(e) => handleUpdateCandidate(cand.tempId, 'collaborationCost', e.target.value)}
                                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                  placeholder="15000"
                                />
                              </td>

                              {/* Deadline */}
                              <td className="px-3 py-2.5">
                                <input
                                  type="date"
                                  value={cand.deadline}
                                  onChange={(e) => handleUpdateCandidate(cand.tempId, 'deadline', e.target.value)}
                                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                />
                              </td>

                              {/* Add-on Rights Quick Badge & Action */}
                              <td className="px-3 py-2.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingAddonCandidateId(cand.tempId)}
                                  className="w-full px-2 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-[11px] font-bold flex items-center justify-between gap-1 transition-colors cursor-pointer"
                                >
                                  <span className="truncate">
                                    {cand.tier || '中腰部'} · {cand.portraitAuthDuration || '1年授权'}
                                  </span>
                                  <Sliders className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                </button>
                              </td>

                              {/* Brief Creative Direction */}
                              <td className="px-3 py-2.5">
                                <textarea
                                  rows={2}
                                  value={cand.creativeDirection}
                                  onChange={(e) => handleUpdateCandidate(cand.tempId, 'creativeDirection', e.target.value)}
                                  placeholder="创作要求与卖点口播..."
                                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 resize-none"
                                />
                              </td>
                            </>
                          ) : (
                            /* Addon Rights View Columns */
                            <>
                              <td className="px-3 py-2.5 font-bold text-slate-900">
                                <div>{cand.kolName}</div>
                                <div className="text-[10px] text-slate-400">{cand.platform} · {cand.category}</div>
                              </td>

                              <td className="px-3 py-2.5">
                                <input
                                  type="text"
                                  value={cand.tier || ''}
                                  onChange={(e) => handleUpdateCandidate(cand.tempId, 'tier', e.target.value)}
                                  placeholder="头部/腰部/KOC"
                                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                />
                              </td>

                              <td className="px-3 py-2.5">
                                <input
                                  type="text"
                                  value={cand.resourceType || ''}
                                  onChange={(e) => handleUpdateCandidate(cand.tempId, 'resourceType', e.target.value)}
                                  placeholder="如: 1条长视频"
                                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                />
                              </td>

                              <td className="px-3 py-2.5">
                                <input
                                  type="text"
                                  value={cand.portraitAuthDuration || ''}
                                  onChange={(e) => handleUpdateCandidate(cand.tempId, 'portraitAuthDuration', e.target.value)}
                                  placeholder="如: 1年 / 6个月"
                                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                />
                              </td>

                              <td className="px-3 py-2.5">
                                <select
                                  value={cand.canSecondaryCreation || '是'}
                                  onChange={(e) => handleUpdateCandidate(cand.tempId, 'canSecondaryCreation', e.target.value)}
                                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                >
                                  <option value="是">是 (允许二创)</option>
                                  <option value="否">否</option>
                                </select>
                              </td>

                              <td className="px-3 py-2.5">
                                <select
                                  value={cand.canProvideRawFootage || '是'}
                                  onChange={(e) => handleUpdateCandidate(cand.tempId, 'canProvideRawFootage', e.target.value)}
                                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                >
                                  <option value="是">是 (提供原片)</option>
                                  <option value="否">否</option>
                                </select>
                              </td>

                              <td className="px-3 py-2.5">
                                <select
                                  value={cand.canPinLinkOrMention || '是'}
                                  onChange={(e) => handleUpdateCandidate(cand.tempId, 'canPinLinkOrMention', e.target.value)}
                                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                >
                                  <option value="是">是 (挂链接/@)</option>
                                  <option value="否">否</option>
                                </select>
                              </td>

                              <td className="px-3 py-2.5">
                                <input
                                  type="text"
                                  value={cand.canProvideAdCode || ''}
                                  onChange={(e) => handleUpdateCandidate(cand.tempId, 'canProvideAdCode', e.target.value)}
                                  placeholder="提供 Spark Code"
                                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                />
                              </td>

                              <td className="px-3 py-2.5">
                                <input
                                  type="text"
                                  value={cand.feedback || ''}
                                  onChange={(e) => handleUpdateCandidate(cand.tempId, 'feedback', e.target.value)}
                                  placeholder="达人意向反馈"
                                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
                                />
                              </td>
                            </>
                          )}

                          {/* Actions */}
                          <td className="px-3 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteCandidate(cand.tempId)}
                              title="删除此行"
                              className="w-7 h-7 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          {step === 'input' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                取消
              </button>

              <button
                type="button"
                onClick={handleRunAiAgent}
                disabled={isParsing || (!uploadedFile && !pastedText.trim())}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-900/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                {isParsing ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>AI Agent 正在识别并结构化解析表格...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>启动 AI Agent 识别与映射</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('input')}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重新上传 / 粘贴表格</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  取消
                </button>

                <button
                  type="button"
                  onClick={handleConfirmInitiation}
                  disabled={isSubmitting || selectedCount === 0}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-900/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>正在批量立项下发任务...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>确认立项并生成 Content 任务 ({selectedCount} 条)</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pop-up Drawer for editing Add-on Rights of a candidate */}
      {editingCandidate && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 border-b border-slate-200 bg-purple-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    附加合作权益与交付细则：{editingCandidate.kolName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    配置该达人的肖像授权、网盘原片交付、投流码及二创权益
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAddonCandidateId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">达人量级 (Tier)</label>
                  <input
                    type="text"
                    value={editingCandidate.tier || ''}
                    onChange={(e) => handleUpdateCandidate(editingCandidate.tempId, 'tier', e.target.value)}
                    placeholder="头部 / 中腰部 / KOC"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">形式 (视频/直播)</label>
                  <select
                    value={editingCandidate.videoOrLive || '视频'}
                    onChange={(e) => handleUpdateCandidate(editingCandidate.tempId, 'videoOrLive', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="视频">视频 (长视频 / 短视频)</option>
                    <option value="直播">直播</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">合作资源形态</label>
                  <input
                    type="text"
                    value={editingCandidate.resourceType || ''}
                    onChange={(e) => handleUpdateCandidate(editingCandidate.tempId, 'resourceType', e.target.value)}
                    placeholder="如: 1条Dedicated定制长视频"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">肖像授权官方（授权时间）</label>
                  <input
                    type="text"
                    value={editingCandidate.portraitAuthDuration || ''}
                    onChange={(e) => handleUpdateCandidate(editingCandidate.tempId, 'portraitAuthDuration', e.target.value)}
                    placeholder="如: 1年 / 6个月 / 永久 / 否"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Social Media (主页链接)</label>
                  <input
                    type="text"
                    value={editingCandidate.socialMediaUrl || ''}
                    onChange={(e) => handleUpdateCandidate(editingCandidate.tempId, 'socialMediaUrl', e.target.value)}
                    placeholder="https://youtube.com/@xxx"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">如官方能投流是否可以提供投流code</label>
                  <input
                    type="text"
                    value={editingCandidate.canProvideAdCode || ''}
                    onChange={(e) => handleUpdateCandidate(editingCandidate.tempId, 'canProvideAdCode', e.target.value)}
                    placeholder="如: 提供 TikTok Spark Code / 是 / 否"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Rights switches */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
                <h4 className="text-xs font-bold text-slate-900">核心合作授权与交付权限</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                    <span className="text-slate-700">是否可以发预热视频</span>
                    <select
                      value={editingCandidate.canTeaserVideo || '是'}
                      onChange={(e) => handleUpdateCandidate(editingCandidate.tempId, 'canTeaserVideo', e.target.value)}
                      className="text-xs font-bold bg-slate-100 rounded px-1.5 py-0.5"
                    >
                      <option value="是">是</option>
                      <option value="否">否</option>
                    </select>
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                    <span className="text-slate-700">是否可以配合证言</span>
                    <select
                      value={editingCandidate.canTestimonial || '是'}
                      onChange={(e) => handleUpdateCandidate(editingCandidate.tempId, 'canTestimonial', e.target.value)}
                      className="text-xs font-bold bg-slate-100 rounded px-1.5 py-0.5"
                    >
                      <option value="是">是</option>
                      <option value="否">否</option>
                    </select>
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                    <span className="text-slate-700">视频授权官方二剪二创</span>
                    <select
                      value={editingCandidate.canSecondaryCreation || '是'}
                      onChange={(e) => handleUpdateCandidate(editingCandidate.tempId, 'canSecondaryCreation', e.target.value)}
                      className="text-xs font-bold bg-slate-100 rounded px-1.5 py-0.5"
                    >
                      <option value="是">是</option>
                      <option value="否">否</option>
                    </select>
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                    <span className="text-slate-700">原视频提供网盘交付</span>
                    <select
                      value={editingCandidate.canProvideRawFootage || '是'}
                      onChange={(e) => handleUpdateCandidate(editingCandidate.tempId, 'canProvideRawFootage', e.target.value)}
                      className="text-xs font-bold bg-slate-100 rounded px-1.5 py-0.5"
                    >
                      <option value="是">是</option>
                      <option value="否">否</option>
                    </select>
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer col-span-2">
                    <span className="text-slate-700">评论区圈官方账号 / 挂官网车型link / 挂bio link</span>
                    <select
                      value={editingCandidate.canPinLinkOrMention || '是'}
                      onChange={(e) => handleUpdateCandidate(editingCandidate.tempId, 'canPinLinkOrMention', e.target.value)}
                      className="text-xs font-bold bg-slate-100 rounded px-1.5 py-0.5"
                    >
                      <option value="是">是</option>
                      <option value="否">否</option>
                    </select>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">粉丝画像</label>
                <input
                  type="text"
                  value={editingCandidate.audiencePersona || ''}
                  onChange={(e) => handleUpdateCandidate(editingCandidate.tempId, 'audiencePersona', e.target.value)}
                  placeholder="如: 25-45岁男性/汽车发烧友/科技数码"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">沟通意向与反馈</label>
                <textarea
                  rows={2}
                  value={editingCandidate.feedback || ''}
                  onChange={(e) => handleUpdateCandidate(editingCandidate.tempId, 'feedback', e.target.value)}
                  placeholder="达人沟通反馈与排期进展..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setEditingAddonCandidateId(null)}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                保存附加权益设置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
