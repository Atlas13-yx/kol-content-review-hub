import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { ContentItem, Platform, Stage, Status, CurrentOwner } from '../types';
import { isOverdue, formatRelativeTime } from '../utils/dateUtils';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { OwnerBadge } from '../components/OwnerBadge';
import { ContentInlineProgressBar } from '../components/ContentProgressBar';
import { SmartUploadVersionModal } from '../components/SmartUploadVersionModal';
import { Search, Plus, RotateCcw, Sparkles, UploadCloud } from 'lucide-react';

interface ContentsPageProps {
  onNavigate: (page: string, params?: { id?: string }) => void;
  onOpenNewContent: () => void;
}

export const ContentsPage: React.FC<ContentsPageProps> = ({ onNavigate, onOpenNewContent }) => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [isSmartUploadOpen, setIsSmartUploadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [kolFilter, setKolFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');

  useEffect(() => {
    const update = () => {
      setContents(dataService.getContents());
    };
    update();
    return dataService.subscribe(update);
  }, []);

  const campaigns = dataService.getCampaigns();
  const kols = dataService.getKols();

  const getCampaignName = (id: string) => campaigns.find((c) => c.id === id)?.name || id;
  const getKolName = (id: string) => kols.find((k) => k.id === id)?.name || id;

  const filteredContents = contents.filter((c) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const kolName = getKolName(c.kolId).toLowerCase();
      const campName = getCampaignName(c.campaignId).toLowerCase();
      const titleMatch = c.title.toLowerCase().includes(q);
      const topicMatch = c.topic.toLowerCase().includes(q);

      if (!titleMatch && !topicMatch && !kolName.includes(q) && !campName.includes(q)) {
        return false;
      }
    }

    if (campaignFilter && c.campaignId !== campaignFilter) return false;
    if (stageFilter && c.stage !== stageFilter) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    if (ownerFilter && c.currentOwner !== ownerFilter) return false;
    if (kolFilter && c.kolId !== kolFilter) return false;
    if (platformFilter && c.platform !== platformFilter) return false;

    return true;
  });

  const clearFilters = () => {
    setSearch('');
    setCampaignFilter('');
    setStageFilter('');
    setStatusFilter('');
    setOwnerFilter('');
    setKolFilter('');
    setPlatformFilter('');
  };

  const getCurrentVersionLabel = (c: ContentItem) => {
    if (c.stage === 'Brief') {
      return c.status === 'Waiting for Brief Approval' ? 'Brief 待广汽审核' : 'Brief 待完善';
    }
    if (c.stage === 'Script') {
      const versions = dataService.getScriptVersions(c.id);
      if (versions.length === 0) return '等待脚本V1';
      return `Script V${versions[versions.length - 1].versionNumber}`;
    } else {
      const versions = dataService.getVideoVersions(c.id);
      if (versions.length === 0) return '等待视频V1';
      return `Video V${versions[versions.length - 1].versionNumber}`;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Content 内容任务大盘 ({filteredContents.length})</h1>
          <p className="text-xs text-slate-500 mt-1">
            每一个 Content 代表一位 KOL 在某个 Campaign 下创作的一条具体内容
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
          {/* 省广一键智能识别上传归档按钮 */}
          <button
            onClick={() => setIsSmartUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-700 to-indigo-600 hover:from-indigo-800 hover:to-indigo-700 text-white font-semibold text-xs shadow-sm transition-all border border-indigo-500/30 whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
            <UploadCloud className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">智能上传脚本/视频 (省广自动归档)</span>
          </button>

          <button
            onClick={onOpenNewContent}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="whitespace-nowrap">新建 Content 任务</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索达人、Campaign、内容主题关键词..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Campaign */}
          <div>
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">所有 Campaign</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stage */}
          <div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">所有 Stage 阶段</option>
              <option value="Brief">Brief</option>
              <option value="Script">Script 脚本</option>
              <option value="Video">Video 视频</option>
              <option value="Completed">Completed 已完成</option>
            </select>
          </div>

          {/* Current Owner */}
          <div>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">所有 Current Owner (责任方)</option>
              <option value="Me">Me (我)</option>
              <option value="Agency">Agency (省广公司)</option>
              <option value="KOL">KOL (达人)</option>
              <option value="None">None (无)</option>
            </select>
          </div>

          {/* KOL */}
          <div>
            <select
              value={kolFilter}
              onChange={(e) => setKolFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">所有 KOL 达人</option>
              {kols.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
          </div>

          {/* Platform */}
          <div>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">所有 Platform 平台</option>
              <option value="Tiktok">Tiktok</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="Youtube">Youtube</option>
              <option value="其他">其他</option>
            </select>
          </div>
        </div>

        {(search || campaignFilter || stageFilter || statusFilter || ownerFilter || kolFilter || platformFilter) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">已显示 {filteredContents.length} / {contents.length} 条记录</span>
            <button
              onClick={clearFilters}
              className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置筛选 Clear Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">KOL 达人</th>
                <th className="px-4 py-3.5">Campaign</th>
                <th className="px-4 py-3.5 min-w-[240px]">履约进度 (4阶段流程)</th>
                <th className="px-4 py-3.5">平台</th>
                <th className="px-4 py-3.5">Stage 阶段</th>
                <th className="px-4 py-3.5">当前版本</th>
                <th className="px-4 py-3.5">Status 状态</th>
                <th className="px-4 py-3.5">Current Owner</th>
                <th className="px-4 py-3.5">Deadline</th>
                <th className="px-4 py-3.5 text-right">更新时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContents.map((item) => {
                const overdue = isOverdue(item.deadline, item.stage);
                const verLabel = getCurrentVersionLabel(item);

                return (
                  <tr
                    key={item.id}
                    onClick={() => onNavigate('content-detail', { id: item.id })}
                    className={`hover:bg-indigo-50/40 transition-colors cursor-pointer ${
                      overdue ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                      {getKolName(item.kolId)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-[140px] truncate" title={getCampaignName(item.campaignId)}>
                      {getCampaignName(item.campaignId)}
                    </td>
                    <td className="px-4 py-3.5">
                      <ContentInlineProgressBar content={item} />
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-600 whitespace-nowrap">{item.platform}</td>
                    <td className="px-4 py-3.5">
                      <StageBadge stage={item.stage} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px]">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {verLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="px-4 py-3.5">
                      <OwnerBadge owner={item.currentOwner} />
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono">
                      <span className={overdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                        {item.deadline}
                      </span>
                      {overdue && (
                        <span className="ml-1 px-1 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          逾期
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-400 text-[11px]">
                      {formatRelativeTime(item.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Smart Upload Version Modal */}
      <SmartUploadVersionModal
        isOpen={isSmartUploadOpen}
        onClose={() => setIsSmartUploadOpen(false)}
        onSuccess={(contentId) => {
          onNavigate('content-detail', { id: contentId });
        }}
      />
    </div>
  );
};
