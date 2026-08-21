import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  X,
  RefreshCw,
  Sliders,
  Sparkles,
  Server,
  Layers,
  Database,
  Globe,
  Terminal,
  Activity,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { AuditLogEntry, AuditSecurityLevel, AuditActionType } from '../types';
import { SECURITY_BASELINE_DATA } from '../data/securityBaselineData';
import { sanitizeForSpreadsheet } from '../utils/security';
import * as XLSX from 'xlsx';

interface SecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'baseline' | 'logs' | 'policies'>('baseline');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | AuditSecurityLevel>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [isDataMasking, setIsDataMasking] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<number | 'ALL'>('ALL');
  const [exportToast, setExportToast] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAuditLogs(dataService.getAuditLogs());
      setIsDataMasking(dataService.isDataMasking());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const refreshLogs = () => {
    setAuditLogs(dataService.getAuditLogs());
  };

  const handleToggleMasking = () => {
    const nextVal = !isDataMasking;
    setIsDataMasking(nextVal);
    dataService.setDataMasking(nextVal);
    setAuditLogs(dataService.getAuditLogs());
  };

  // Filtered Baseline Items
  const filteredBaseline = SECURITY_BASELINE_DATA.filter((item) => {
    if (categoryFilter !== 'ALL' && item.categoryNo !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchName = item.categoryName.toLowerCase().includes(q);
      const matchReq = item.requirement.toLowerCase().includes(q);
      const matchSub = item.subName.toLowerCase().includes(q);
      const matchNotes = item.implementationNotes.toLowerCase().includes(q);
      if (!matchName && !matchReq && !matchSub && !matchNotes) return false;
    }
    return true;
  });

  // Filtered Audit Logs
  const filteredLogs = auditLogs.filter((log) => {
    if (levelFilter !== 'ALL' && log.securityLevel !== levelFilter) return false;
    if (actionFilter !== 'ALL' && log.actionType !== actionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchOp = log.operatorName.toLowerCase().includes(q);
      const matchTarget = log.targetResource.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      if (!matchAction && !matchOp && !matchTarget && !matchDetails) return false;
    }
    return true;
  });

  // Export Audit Logs with Formula Injection Prevention (2.4.2)
  const handleExportAuditLogs = () => {
    const rows = filteredLogs.map((log, idx) => ({
      序号: idx + 1,
      时间戳: log.timestamp,
      安全等级: log.securityLevel,
      操作类型: sanitizeForSpreadsheet(log.actionType),
      操作摘要: sanitizeForSpreadsheet(log.action),
      操作人员: sanitizeForSpreadsheet(log.operatorName),
      操作视角: sanitizeForSpreadsheet(log.operatorRole),
      客户端IP: sanitizeForSpreadsheet(log.operatorIp || '127.0.0.1'),
      目标资源: sanitizeForSpreadsheet(log.targetResource),
      审计详情: sanitizeForSpreadsheet(log.details),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '系统安全审计流水');
    XLSX.writeFile(wb, `广汽国际_KOL系统不可篡改审计日志_${new Date().toISOString().split('T')[0]}.xlsx`);

    dataService.logExportCompliance('系统安全审计日志.xlsx', rows.length, false);
    setExportToast('审计日志导出成功（已应用防公式注入清洗）');
    setTimeout(() => setExportToast(null), 3500);
  };

  const categories = Array.from(new Set(SECURITY_BASELINE_DATA.map((item) => item.categoryNo))).map((no) => {
    const found = SECURITY_BASELINE_DATA.find((item) => item.categoryNo === no);
    return { no, name: found?.categoryName || `类别 ${no}` };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">企业安全与合规审计看板</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  100% 达标合规基线
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                严格遵循《企业应用安全与合规基线规范》11大类安全要求 · 全流程责任溯源与防注入防护
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('baseline')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'baseline'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>合规基线对照表 ({SECURITY_BASELINE_DATA.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>实时审计日志流水 ({auditLogs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('policies')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'policies'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>安全策略与脱敏防护</span>
            </button>
          </div>

          {/* Quick Masking Status Indicator */}
          <div className="flex items-center gap-3">
            <div
              onClick={handleToggleMasking}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                isDataMasking
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
              }`}
              title="点击切换脱敏模式"
            >
              {isDataMasking ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{isDataMasking ? '敏感数据脱敏: 已开启' : '敏感数据脱敏: 明文查看中'}</span>
            </div>
          </div>
        </div>

        {/* Notification Toast */}
        {exportToast && (
          <div className="mx-6 mt-3 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{exportToast}</span>
          </div>
        )}

        {/* Tab 1: Baseline Checklist Matrix */}
        {activeTab === 'baseline' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索基线条目、要求或实施方案..."
                  className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-xs text-slate-400 whitespace-nowrap">分类筛选:</span>
                <button
                  onClick={() => setCategoryFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    categoryFilter === 'ALL'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  全部 (11大类)
                </button>
                {categories.map((c) => (
                  <button
                    key={c.no}
                    onClick={() => setCategoryFilter(c.no)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      categoryFilter === c.no
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {c.no}. {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Baseline Grid Table */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800/80 text-slate-300 font-bold border-b border-slate-700">
                      <th className="py-3 px-3.5 w-16">编号</th>
                      <th className="py-3 px-3.5 w-28">一级分类</th>
                      <th className="py-3 px-3.5 w-32">二级子项</th>
                      <th className="py-3 px-4 min-w-[280px]">基线安全规范要求</th>
                      <th className="py-3 px-3.5 w-24 text-center">达标状态</th>
                      <th className="py-3 px-4 min-w-[260px]">系统落地实施方案与技术对齐</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredBaseline.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3.5 font-mono font-bold text-indigo-300">{item.threeNo}</td>
                        <td className="py-3 px-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700/60">
                            {item.categoryName}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-300 font-medium">{item.subName}</td>
                        <td className="py-3 px-4 text-slate-300 leading-relaxed">{item.requirement}</td>
                        <td className="py-3 px-3.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            {item.satisfaction}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px] leading-relaxed">
                          {item.implementationNotes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Real-time Audit Logs */}
        {activeTab === 'logs' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索操作人、目标资源或详情..."
                  className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value as any)}
                  className="bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none"
                >
                  <option value="ALL">全部安全等级</option>
                  <option value="INFO">INFO 正常业务</option>
                  <option value="WARNING">WARNING 敏感操作</option>
                  <option value="CRITICAL">CRITICAL 核心风控</option>
                </select>

                <button
                  onClick={refreshLogs}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="刷新审计流水"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  onClick={handleExportAuditLogs}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>导出不可篡改审计日志 (防公式注入)</span>
                </button>
              </div>
            </div>

            {/* Audit Log Stream */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800/80 text-slate-300 font-bold border-b border-slate-700">
                      <th className="py-3 px-3.5 w-36">时间戳</th>
                      <th className="py-3 px-3 w-20 text-center">级别</th>
                      <th className="py-3 px-3.5 w-32">操作类型</th>
                      <th className="py-3 px-4 w-44">操作人 / 视角</th>
                      <th className="py-3 px-4 w-40">目标资源</th>
                      <th className="py-3 px-4 min-w-[240px]">操作记录与安全审计详情</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                          暂无符合条件的审计流水
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-3.5 font-mono text-[11px] text-slate-400">
                            {new Date(log.timestamp).toLocaleString('zh-CN', { hour12: false })}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                log.securityLevel === 'CRITICAL'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : log.securityLevel === 'WARNING'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                              }`}
                            >
                              {log.securityLevel}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 font-semibold text-slate-200">{log.action}</td>
                          <td className="py-3 px-4">
                            <div className="text-slate-200 font-semibold">{log.operatorName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {log.operatorRole === 'Me' ? '广汽国际 (Me)' : log.operatorRole === 'Agency' ? '省广代理商 (Agency)' : 'System'} · {log.operatorIp}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-indigo-300">{log.targetResource}</td>
                          <td className="py-3 px-4 text-slate-300 leading-relaxed text-[11px]">{log.details}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Security Policies & Data Protection */}
        {activeTab === 'policies' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Policy 1: Data Masking */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <EyeOff className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">全局敏感数据脱敏防护 (8.1 / 9.2)</h4>
                      <p className="text-xs text-slate-400">针对达人联系电话、邮箱与核心商业报价打码保护</p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleMasking}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isDataMasking
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isDataMasking ? '已开启脱敏保护' : '已解除 (明文模式)'}
                  </button>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-xl text-xs text-slate-300 space-y-1.5 border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">达人邮箱脱敏:</span>
                    <span className="font-mono text-emerald-400">{isDataMasking ? 'j***@domain.com' : 'john.smith@agency.eu'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">联系电话/WhatsApp:</span>
                    <span className="font-mono text-emerald-400">{isDataMasking ? '+33 6****12' : '+33 612345612'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">商业合作报价:</span>
                    <span className="font-mono text-emerald-400">{isDataMasking ? '€1*,000' : '€15,000'}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  * 任何单次解除脱敏或明文导出均会触发系统自动审计流水，明确记录操作人员与具体时间。
                </p>
              </div>

              {/* Policy 2: Brute Force & Session Guard */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">防暴力破解与账号安全 (1.1.1 / 1.3.1)</h4>
                    <p className="text-xs text-slate-400">服务端密码错误限流与会话安全防护</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>连续密码错误 5 次自动锁定 15 分钟</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>密码复杂度实时评估（大小写、数字与特殊字符）</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>登出彻底销毁浏览器会话凭证 (1.2.4)</span>
                  </div>
                </div>
              </div>

              {/* Policy 3: Excel Anti-Formula Injection */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">导出防公式与 DDE 注入清洗 (2.4.2)</h4>
                    <p className="text-xs text-slate-400">Excel / CSV 导出单元格安全转义</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  所有导出功能部署了 sanitizeForSpreadsheet 规则，自动转义以 =, +, -, @ 等开头的单元格内容，有效杜绝 WPS / Excel 打开时执行恶意宏或动态数据交换命令。
                </p>
              </div>

              {/* Policy 4: AI Guardrails & Human in the Loop */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">AI 安全护栏与人类在环 (11.2)</h4>
                    <p className="text-xs text-slate-400">Prompt 提示词注入清洗与最终人工裁决</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  大模型（Gemini）仅作为多语种字幕卖点比对与初审草稿辅助建议，最终定选确认、脚本修改意见与视频终审发布 100% 由广汽国际与省广项目组人工审核确认。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>安全审计保护实时生效中 · 全量操作记录不可篡改入库</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            完成查看并关闭
          </button>
        </div>
      </div>
    </div>
  );
};
