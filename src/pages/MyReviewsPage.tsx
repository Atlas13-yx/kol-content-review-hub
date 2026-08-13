import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { ContentItem, Platform, Stage } from '../types';
import { isOverdue, calculateWaitingTime } from '../utils/dateUtils';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { Search, Filter, RotateCcw, Clock, ArrowUpDown } from 'lucide-react';

interface MyReviewsPageProps {
  onNavigate: (page: string, params?: { id?: string }) => void;
}

export const MyReviewsPage: React.FC<MyReviewsPageProps> = ({ onNavigate }) => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [search, setSearch] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [kolFilter, setKolFilter] = useState('');
  const [sortBy, setSortBy] = useState<'deadline' | 'waitingTime'>('deadline');

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

  // Filter ONLY currentOwner === 'Me'
  const myReviews = contents.filter((c) => {
    if (c.currentOwner !== 'Me') return false;

    // Search filter
    if (search.trim()) {
      const query = search.toLowerCase();
      const kolName = getKolName(c.kolId).toLowerCase();
      const campName = getCampaignName(c.campaignId).toLowerCase();
      const titleMatch = c.title.toLowerCase().includes(query);
      const topicMatch = c.topic.toLowerCase().includes(query);

      if (!titleMatch && !topicMatch && !kolName.includes(query) && !campName.includes(query)) {
        return false;
      }
    }

    if (campaignFilter && c.campaignId !== campaignFilter) return false;
    if (stageFilter && c.stage !== stageFilter) return false;
    if (platformFilter && c.platform !== platformFilter) return false;
    if (kolFilter && c.kolId !== kolFilter) return false;

    return true;
  });

  // Sort: default closest deadline or longest waiting time
  myReviews.sort((a, b) => {
    if (sortBy === 'deadline') {
      return a.deadline.localeCompare(b.deadline);
    } else {
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
  });

  const clearFilters = () => {
    setSearch('');
    setCampaignFilter('');
    setStageFilter('');
    setPlatformFilter('');
    setKolFilter('');
  };

  const getCurrentVersionLabel = (c: ContentItem) => {
    if (c.stage === 'Script' || c.stage === 'Brief') {
      const versions = dataService.getScriptVersions(c.id);
      if (versions.length === 0) return '未提交';
      return `Script V${versions[versions.length - 1].versionNumber}`;
    } else {
      const versions = dataService.getVideoVersions(c.id);
      if (versions.length === 0) return '等待视频V1';
      return `Video V${versions[versions.length - 1].versionNumber}`;
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">待我审核 (My Reviews)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">
              {myReviews.length} 项需处理
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            只列出责任方为“广汽国际”的稿件，按紧急度和等待时长排序，优先解决临近/已逾期任务。
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setSortBy(sortBy === 'deadline' ? 'waitingTime' : 'deadline')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
            <span>排序: {sortBy === 'deadline' ? '按截止日期最紧急' : '按等待时长最久'}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Search bar */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索达人、Campaign、标题或主题..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Campaign Filter */}
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

          {/* Stage Filter */}
          <div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">所有 Stage 阶段</option>
              <option value="Script">Script 脚本</option>
              <option value="Video">Video 视频</option>
            </select>
          </div>

          {/* KOL Filter */}
          <div>
            <select
              value={kolFilter}
              onChange={(e) => setKolFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">所有 KOL 达人</option>
              {kols.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} ({k.platform})
                </option>
              ))}
            </select>
          </div>
        </div>

        {(search || campaignFilter || stageFilter || platformFilter || kolFilter) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">已筛选出 {myReviews.length} 条待审核内容</span>
            <button
              onClick={clearFilters}
              className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>清空筛选条件 Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {myReviews.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Filter className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">没有查找到符合条件的待审核任务</p>
            <p className="text-xs text-slate-400">尝试清空搜索框或调整筛选选项。</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">KOL 达人</th>
                  <th className="px-5 py-3.5">所属 Campaign</th>
                  <th className="px-5 py-3.5">Content 任务标题</th>
                  <th className="px-5 py-3.5">Stage 阶段</th>
                  <th className="px-5 py-3.5">最新版本</th>
                  <th className="px-5 py-3.5">Status 状态</th>
                  <th className="px-5 py-3.5">Deadline 截止</th>
                  <th className="px-5 py-3.5">等待时长</th>
                  <th className="px-5 py-3.5 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myReviews.map((item) => {
                  const overdue = isOverdue(item.deadline, item.stage);
                  const verLabel = getCurrentVersionLabel(item);
                  const waitingTime = calculateWaitingTime(item.updatedAt);

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onNavigate('content-detail', { id: item.id })}
                      className={`hover:bg-indigo-50/40 transition-colors cursor-pointer ${
                        overdue ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="px-5 py-4 font-bold text-slate-900 whitespace-nowrap">
                        {getKolName(item.kolId)}
                        <span className="ml-1.5 text-[10px] text-slate-400 font-normal">({item.platform})</span>
                      </td>
                      <td className="px-5 py-4 text-slate-600 max-w-[160px] truncate" title={getCampaignName(item.campaignId)}>
                        {getCampaignName(item.campaignId)}
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-900 max-w-[240px]">
                        <div className="truncate font-semibold text-slate-800" title={item.title}>
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{item.topic}</div>
                      </td>
                      <td className="px-5 py-4">
                        <StageBadge stage={item.stage} />
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {verLabel}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono font-medium">
                          <span className={overdue ? 'text-rose-600 font-bold' : ''}>{item.deadline}</span>
                          {overdue && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                              逾期
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-500 font-mono">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{waitingTime}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('content-detail', { id: item.id });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-colors"
                        >
                          Review 审核
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
