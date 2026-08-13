import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { Campaign } from '../types';
import { FolderKanban, Plus, Calendar, Users, FileText, Clock, Edit3 } from 'lucide-react';
import { EditCampaignModal } from '../components/EditCampaignModal';

interface CampaignsPageProps {
  onNavigate: (page: string, params?: { id?: string }) => void;
  onOpenNewCampaign: () => void;
}

export const CampaignsPage: React.FC<CampaignsPageProps> = ({ onNavigate, onOpenNewCampaign }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | undefined>(undefined);

  useEffect(() => {
    const update = () => {
      setCampaigns(dataService.getCampaigns());
    };
    update();
    return dataService.subscribe(update);
  }, []);

  const contents = dataService.getContents();

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Campaign 项目管理 ({campaigns.length})</h1>
          <p className="text-xs text-slate-500 mt-1">
            按营销节点或产品发布维度划分 Campaign，集中管理多位达人的联合投放任务
          </p>
        </div>

        <button
          onClick={onOpenNewCampaign}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>新建 Campaign</span>
        </button>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((camp) => {
          const campContents = contents.filter((c) => c.campaignId === camp.id);
          const uniqueKolIds = new Set(campContents.map((c) => c.kolId));
          const inReviewCount = campContents.filter(
            (c) => c.status === 'Waiting for Agency Review' || c.status === 'Waiting for My Review'
          ).length;

          // Category stats
          const targetOriginal = camp.targetOriginal ?? 3;
          const targetSecondary = camp.targetSecondary ?? 5;

          const completedOriginal = campContents.filter(
            (c) => (c.category === '原创' || (!c.category && c.id.endsWith('1'))) && c.stage === 'Completed'
          ).length;
          const completedSecondary = campContents.filter(
            (c) => c.category === '二创' && c.stage === 'Completed'
          ).length;

          const pctOriginal = Math.min(100, Math.round((completedOriginal / (targetOriginal || 1)) * 100));
          const pctSecondary = Math.min(100, Math.round((completedSecondary / (targetSecondary || 1)) * 100));

          return (
            <div
              key={camp.id}
              onClick={() => onNavigate('campaign-detail', { id: camp.id })}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {camp.status}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{camp.startDate} ~ {camp.endDate}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCampaign(camp);
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                      title="调整 Campaign 时间与设置"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {camp.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {camp.description || camp.brief || '暂无详细描述'}
                </p>

                {/* Completion Breakdown Banner: 原创 1/3, 二创 3/5 */}
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span>Campaign 完成进度</span>
                    <span className="text-slate-400 font-normal">目标完成度</span>
                  </div>

                  <div className="space-y-1.5">
                    {/* Original */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span className="font-semibold text-indigo-700">原创: {completedOriginal}/{targetOriginal} 篇</span>
                        <span className="text-indigo-600 font-bold">{pctOriginal}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${pctOriginal}%` }} />
                      </div>
                    </div>

                    {/* Secondary */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span className="font-semibold text-purple-700">二创: {completedSecondary}/{targetSecondary} 篇</span>
                        <span className="text-purple-600 font-bold">{pctSecondary}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600 rounded-full transition-all" style={{ width: `${pctSecondary}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1 mb-0.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>KOL 数量</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">{uniqueKolIds.size}</div>
                </div>

                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1 mb-0.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Content 总数</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">{campContents.length}</div>
                </div>

                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1 mb-0.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>审核中</span>
                  </div>
                  <div className="text-sm font-bold text-indigo-600">{inReviewCount}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <EditCampaignModal
        isOpen={!!editingCampaign}
        campaign={editingCampaign}
        onClose={() => setEditingCampaign(undefined)}
        onSuccess={() => {
          setCampaigns(dataService.getCampaigns());
        }}
      />
    </div>
  );
};
