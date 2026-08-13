import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { Campaign, ContentItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { OwnerBadge } from '../components/OwnerBadge';
import { isOverdue } from '../utils/dateUtils';
import { ArrowLeft, Calendar, FileText, Users, Plus, Edit3 } from 'lucide-react';
import { EditCampaignModal } from '../components/EditCampaignModal';

interface CampaignDetailPageProps {
  campaignId: string;
  onNavigate: (page: string, params?: { id?: string }) => void;
  onOpenNewContent: () => void;
}

export const CampaignDetailPage: React.FC<CampaignDetailPageProps> = ({
  campaignId,
  onNavigate,
  onOpenNewContent,
}) => {
  const [campaign, setCampaign] = useState<Campaign | undefined>();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const update = () => {
      setCampaign(dataService.getCampaignById(campaignId));
      setContents(dataService.getContents().filter((c) => c.campaignId === campaignId));
    };
    update();
    return dataService.subscribe(update);
  }, [campaignId]);

  const kols = dataService.getKols();
  const getKolName = (id: string) => kols.find((k) => k.id === id)?.name || id;

  if (!campaign) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>未找到该 Campaign</p>
        <button
          onClick={() => onNavigate('campaigns')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs"
        >
          返回 Campaign 列表
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation */}
      <button
        onClick={() => onNavigate('campaigns')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>返回 Campaign 列表</span>
      </button>

      {/* Campaign Header Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {campaign.status}
              </span>
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {campaign.startDate} ~ {campaign.endDate}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{campaign.name}</h1>
          </div>

          <div className="flex items-center gap-2.5 self-start">
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>调整时间与设置</span>
            </button>

            <button
              onClick={onOpenNewContent}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>添加此 Campaign 下的 Content</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
          <div>
            <span className="font-bold text-slate-900 block mb-1">项目简介：</span>
            <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
              {campaign.description || '无'}
            </p>
          </div>
          <div>
            <span className="font-bold text-slate-900 block mb-1">通用 Brief 提纲：</span>
            <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
              {campaign.brief || '无'}
            </p>
          </div>
        </div>

        {/* Campaign Completion Progress Stats */}
        {(() => {
          const targetOriginal = campaign.targetOriginal ?? 3;
          const targetSecondary = campaign.targetSecondary ?? 5;
          const completedOriginal = contents.filter(
            (c) => (c.category === '原创' || (!c.category && c.id.endsWith('1'))) && c.stage === 'Completed'
          ).length;
          const completedSecondary = contents.filter(
            (c) => c.category === '二创' && c.stage === 'Completed'
          ).length;

          const pctOriginal = Math.min(100, Math.round((completedOriginal / (targetOriginal || 1)) * 100));
          const pctSecondary = Math.min(100, Math.round((completedSecondary / (targetSecondary || 1)) * 100));

          return (
            <div className="pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-900 block mb-2">Campaign 内容产出完成情况：</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  <div className="flex items-center justify-between font-bold text-xs text-indigo-900 mb-1">
                    <span>原创内容完成度</span>
                    <span>{completedOriginal} / {targetOriginal} 篇 ({pctOriginal}%)</span>
                  </div>
                  <div className="w-full h-2 bg-indigo-200/60 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pctOriginal}%` }} />
                  </div>
                </div>

                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                  <div className="flex items-center justify-between font-bold text-xs text-purple-900 mb-1">
                    <span>二创衍生完成度</span>
                    <span>{completedSecondary} / {targetSecondary} 篇 ({pctSecondary}%)</span>
                  </div>
                  <div className="w-full h-2 bg-purple-200/60 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full" style={{ width: `${pctSecondary}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Contents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>关联的 Content 内容任务 ({contents.length})</span>
          </h3>
        </div>

        {contents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            暂无关联的内容任务，点击上方按钮添加。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">KOL 达人</th>
                  <th className="px-5 py-3">Content 标题</th>
                  <th className="px-5 py-3">类型</th>
                  <th className="px-5 py-3">平台</th>
                  <th className="px-5 py-3">Stage 阶段</th>
                  <th className="px-5 py-3">Status 状态</th>
                  <th className="px-5 py-3">Current Owner</th>
                  <th className="px-5 py-3">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contents.map((item) => {
                  const overdue = isOverdue(item.deadline, item.stage);
                  const cat = item.category || (item.id.endsWith('1') ? '原创' : '二创');
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onNavigate('content-detail', { id: item.id })}
                      className={`hover:bg-indigo-50/40 cursor-pointer transition-colors ${
                        overdue ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5 font-bold text-slate-900">{getKolName(item.kolId)}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800 max-w-[240px] truncate">
                        {item.title}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          cat === '原创' ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {cat}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{item.platform}</td>
                      <td className="px-5 py-3.5">
                        <StageBadge stage={item.stage} size="sm" />
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="px-5 py-3.5">
                        <OwnerBadge owner={item.currentOwner} />
                      </td>
                      <td className="px-5 py-3.5 font-mono">{item.deadline}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <EditCampaignModal
        isOpen={showEditModal}
        campaign={campaign}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          setCampaign(dataService.getCampaignById(campaignId));
        }}
      />
    </div>
  );
};
