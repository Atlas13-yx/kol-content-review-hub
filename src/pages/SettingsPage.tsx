import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Tag,
  KeyRound,
  FileSpreadsheet,
  Database,
  Layers,
  Bell,
  Sparkles,
  CheckCircle2,
  Sliders,
  Users,
  Download,
  Plus,
  X,
  ExternalLink,
  Shield,
  Activity,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { UserRole } from '../types';

interface SettingsPageProps {
  onNavigate: (page: string, params?: { id?: string }) => void;
  onOpenSecurityAuditModal: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onNavigate,
  onOpenSecurityAuditModal,
}) => {
  const [currentRole, setCurrentRole] = useState<UserRole>(dataService.getCurrentRole());
  const [customTags, setCustomTags] = useState<string[]>(dataService.getCustomTags());
  const [newTagInput, setNewTagInput] = useState('');
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'security' | 'workflow' | 'tags' | 'system' | 'version'>('security');

  // AI & Workflow Preference states
  const [aiAutoCompare, setAiAutoCompare] = useState(true);
  const [enableSoundAlert, setEnableSoundAlert] = useState(true);
  const [autoExportBackup, setAutoExportBackup] = useState(true);

  useEffect(() => {
    const update = () => {
      setCurrentRole(dataService.getCurrentRole());
      setCustomTags(dataService.getCustomTags());
    };
    return dataService.subscribe(update);
  }, []);

  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 3000);
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const added = dataService.addCustomTag(newTagInput.trim());
    if (added) {
      setCustomTags(dataService.getCustomTags());
      setNewTagInput('');
      showToast(`已新增达人全局标签: "${newTagInput.trim()}"`);
    } else {
      showToast('标签已存在');
    }
  };

  const handleDeleteTag = (tag: string) => {
    dataService.deleteCustomTag(tag);
    setCustomTags(dataService.getCustomTags());
    showToast(`已移除标签: "${tag}"`);
  };

  const handleExportSystemBackup = () => {
    const contents = dataService.getContents();
    const kols = dataService.getKols();
    const campaigns = dataService.getCampaigns();
    const auditLogs = dataService.getAuditLogs();

    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      operatorRole: currentRole,
      counts: {
        campaigns: campaigns.length,
        contents: contents.length,
        kols: kols.length,
        auditLogs: auditLogs.length,
      },
      campaigns,
      contents,
      kols,
      auditLogs,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `广汽国际_KOL审核系统全量数据备份_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    dataService.addAuditLog(
      '系统全量数据归档备份',
      'DATA_EXPORT_COMPLIANCE',
      'System / Backup',
      `操作人导出了系统全量结构化数据备份包（包含 ${contents.length} 条内容任务，${kols.length} 位达人档案，${auditLogs.length} 条审计日志）。`,
      'INFO'
    );
    showToast('全量数据快照备份包导出成功！');
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Toast Notification */}
      {notificationToast && (
        <div className="fixed top-20 right-8 z-50 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">系统设置与合规中心</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                管理企业安全合规基线、达人标签字典、AI 审核策略与系统数据归档
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={onOpenSecurityAuditModal}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>查看安全与合规审计看板</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>安全与合规管理</span>
        </button>

        <button
          onClick={() => setActiveTab('workflow')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'workflow'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI 审核与协同偏好</span>
        </button>

        <button
          onClick={() => setActiveTab('tags')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'tags'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>达人标签字典 ({customTags.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'system'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>数据备份与归档</span>
        </button>

        <button
          onClick={() => setActiveTab('version')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'version'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>版本说明 (Version 2.0)</span>
        </button>
      </div>

      {/* Tab 1: Security & Compliance */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Security Baseline Overview */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">企业安全基线合规对照</h3>
                  <p className="text-xs text-slate-500">11 大类 20 项技术规范全面对齐</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                100% 达标
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              严格遵循广汽集团《企业应用安全与合规基线规范》，覆盖防暴力破解、会话管理、防 XSS/SQL 注入、导出防公式注入（DDE）、双岗 RBAC 鉴权与 AI 提示词防注入。
            </p>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-2">
              <div className="flex justify-between items-center">
                <span>防暴力破解防护:</span>
                <span className="font-semibold text-emerald-600">连续5次错误锁定 15 分钟</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Excel 导出防注入:</span>
                <span className="font-semibold text-emerald-600">DDE 公式字符自动前置转义</span>
              </div>
              <div className="flex justify-between items-center">
                <span>AI 大模型安全护栏:</span>
                <span className="font-semibold text-emerald-600">Prompt 净化 + 100% 人类在环</span>
              </div>
            </div>

            <button
              onClick={onOpenSecurityAuditModal}
              className="w-full py-2.5 rounded-2xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              <span>打开完整基线对照表与审计看板</span>
            </button>
          </div>

          {/* Card 2: Role & Permission Matrix (RBAC) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">双岗权限隔离矩阵 (RBAC)</h3>
                <p className="text-xs text-slate-500">广汽国际（审核方）vs 省广代理商（执行方）</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/80">
                <div className="font-bold text-indigo-900 flex items-center justify-between mb-1">
                  <span>广汽国际 (Me 审核方):</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-mono">最高裁决权</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  拥有终审权：Brief 终审下发、达人定选确认、脚本修改通过/驳回、视频终审发布与全流程结案归档。
                </p>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/80">
                <div className="font-bold text-emerald-900 flex items-center justify-between mb-1">
                  <span>省广代理商 (Agency 执行方):</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono">执行与提审</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  拥有执行权：创建 Campaign、批量导入达人备选池、发起定选方案提审、上传达人脚本与成片视频。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Workflow & AI Preferences */}
      {activeTab === 'workflow' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">审核协同偏好与 AI 策略配置</h3>
            <p className="text-xs text-slate-500 mt-0.5">定制个性化内容审核流提醒与大模型智能比对参数</p>
          </div>

          <div className="space-y-4">
            {/* Setting 1: AI Auto Selling Points Compare */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">AI 脚本卖点自动交叉诊断</div>
                  <div className="text-[11px] text-slate-500">上传脚本时自动调用 Gemini 大模型比对 Brief 核心卖点覆盖率</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiAutoCompare}
                  onChange={(e) => {
                    setAiAutoCompare(e.target.checked);
                    showToast(e.target.checked ? '已开启 AI 自动诊断' : '已关闭 AI 自动诊断');
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Setting 2: Desktop / Toast Notifications */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">任务流转与驳回即时提示音</div>
                  <div className="text-[11px] text-slate-500">当收到广汽国际审核意见或代理商重新提审时弹出通知并提醒</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSoundAlert}
                  onChange={(e) => {
                    setEnableSoundAlert(e.target.checked);
                    showToast(e.target.checked ? '已开启即时提醒' : '已关闭即时提醒');
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Setting 3: Auto Backup */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">导出报表附带不可篡改版本快照</div>
                  <div className="text-[11px] text-slate-500">导出 Excel 结案报告时自动留存系统版本元数据以备审计</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoExportBackup}
                  onChange={(e) => {
                    setAutoExportBackup(e.target.checked);
                    showToast(e.target.checked ? '已开启自动快照' : '已关闭自动快照');
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Custom Tags Dictionary */}
      {activeTab === 'tags' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">达人全局标签字典库</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                在选人、达人画像与搜索筛选中共享的统一标签库
              </p>
            </div>

            {/* Add Tag Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="输入新标签名 (回车添加)..."
                className="px-3.5 py-2 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-52"
              />
              <button
                onClick={handleAddTag}
                className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>添加</span>
              </button>
            </div>
          </div>

          {/* Tag Cloud List */}
          <div className="flex flex-wrap gap-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-100 min-h-[120px]">
            {customTags.length === 0 ? (
              <div className="w-full text-center text-xs text-slate-400 py-6">
                暂无自定义标签，可在上方输入框添加
              </div>
            ) : (
              customTags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 transition-colors group"
                >
                  <Tag className="w-3 h-3 text-indigo-500" />
                  <span>{tag}</span>
                  <button
                    onClick={() => handleDeleteTag(tag)}
                    className="text-slate-400 hover:text-rose-500 p-0.5 rounded-md transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                    title={`删除标签 "${tag}"`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: System Data Backup & Archive */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Full JSON Backup */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">系统全量结构化备份导出</h3>
                <p className="text-xs text-slate-500">导出 Campaign、达人库与审核历史快照</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              一键将当前系统中的所有 Campaign、达人资料、脚本批注记录及安全审计流水打包导出为 JSON 备份文件，方便离线归档与跨端迁移。
            </p>

            <button
              onClick={handleExportSystemBackup}
              className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>立即导出全量数据备份包 (.json)</span>
            </button>
          </div>

          {/* Card 2: Security & Retention Notice */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">数据保留与防篡改策略</h3>
                <p className="text-xs text-slate-500">广汽国际企业级数据完整性基线</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              依据广汽国际应用安全基线与审计规范，所有业务审单、达人履约合作及审批日志均实行持久化归档与不可逆审计记录，杜绝未经授权的数据清空与违规物理删除。
            </p>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>全量数据操作与归档留痕已接入中央审计流水</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Version Notes (Version 2.0 - 2026/8/21) */}
      {activeTab === 'version' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900">系统版本说明</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono font-bold">
                    Version 2.0
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    PROD
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  发布日期：<span className="font-mono font-bold text-slate-700">2026/8/21</span> · 广汽国际海外营销 KOL 内容智能审核系统
                </p>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400 font-mono">
              Build: GAC-INTL-20260821-v2.0
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>1. Gemini 2.5 Pro 多模态</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                全流程接入多语言卖点提取与合规智能比对，支持大纲/脚本契合度秒级校验与多轮批注打标。
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>2. 广汽外网安全基线</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                全面落地双因子认证 (2FA)、TLS 1.3 传输加密、HSTS、防暴力破解与 DDE 电子表格防注入。
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <span>3. 广汽 × 省广 双岗协同</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                明确初筛提审与终审定选的最小特权隔离，全量操作与审批行为纳入不可篡改审计流水。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
