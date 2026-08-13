import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { KOL, ContentItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { StageBadge } from '../components/StageBadge';
import { OwnerBadge } from '../components/OwnerBadge';
import { isOverdue } from '../utils/dateUtils';
import { ArrowLeft, ExternalLink, Phone, Users, FileText, Plus } from 'lucide-react';

interface KolDetailPageProps {
  kolId: string;
  onNavigate: (page: string, params?: { id?: string }) => void;
  onOpenNewContent: () => void;
}

export const KolDetailPage: React.FC<KolDetailPageProps> = ({ kolId, onNavigate, onOpenNewContent }) => {
  const [kol, setKol] = useState<KOL | undefined>();
  const [contents, setContents] = useState<ContentItem[]>([]);

  useEffect(() => {
    const update = () => {
      setKol(dataService.getKolById(kolId));
      setContents(dataService.getContents().filter((c) => c.kolId === kolId));
    };
    update();
    return dataService.subscribe(update);
  }, [kolId]);

  const campaigns = dataService.getCampaigns();
  const getCampaignName = (id: string) => campaigns.find((c) => c.id === id)?.name || id;

  if (!kol) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>未找到该 KOL</p>
        <button onClick={() => onNavigate('kols')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs">
          返回 KOL 列表
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => onNavigate('kols')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>返回 KOL 资源库</span>
      </button>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-4">
            <img src={kol.avatar} alt={kol.name} className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100 shadow-sm" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{kol.name}</h1>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                  {kol.platform}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="font-mono font-semibold text-slate-800">{kol.followers} 粉丝</span>
                {kol.profileUrl && (
                  <a
                    href={kol.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline inline-flex items-center gap-0.5 font-medium"
                  >
                    访问主页 <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onOpenNewContent}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>发起此达人的 Content 任务</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="font-bold text-slate-800 block mb-1">商务联系方式：</span>
            <span className="text-slate-600 font-mono">{kol.contact || '未填写'}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="font-bold text-slate-800 block mb-1">风格与合作特点备注：</span>
            <span className="text-slate-600">{kol.notes || '无特殊备注'}</span>
          </div>
          <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-100">
            <span className="font-bold text-emerald-900 block mb-1">合作总表现 (手动填充累加)：</span>
            <div className="flex items-center gap-3 font-mono text-emerald-800 font-bold mt-1">
              <span>
                播放量:{' '}
                {contents.reduce((sum, c) => sum + (c.performanceData?.views || 0), 0).toLocaleString()}
              </span>
              <span>·</span>
              <span>
                点赞:{' '}
                {contents.reduce((sum, c) => sum + (c.performanceData?.likes || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Contents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>该达人的历史合作 Content 任务 ({contents.length})</span>
          </h3>
        </div>

        {contents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            该达人暂无历史合作任务记录。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">所属 Campaign</th>
                  <th className="px-5 py-3">Content 任务标题</th>
                  <th className="px-5 py-3">Stage 阶段</th>
                  <th className="px-5 py-3">Status 状态</th>
                  <th className="px-5 py-3">发布表现 (手动)</th>
                  <th className="px-5 py-3">Current Owner</th>
                  <th className="px-5 py-3">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contents.map((item) => {
                  const overdue = isOverdue(item.deadline, item.stage);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onNavigate('content-detail', { id: item.id })}
                      className={`hover:bg-indigo-50/40 cursor-pointer transition-colors ${
                        overdue ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-600">{getCampaignName(item.campaignId)}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 max-w-[280px] truncate">{item.title}</td>
                      <td className="px-5 py-3.5">
                        <StageBadge stage={item.stage} size="sm" />
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px]">
                        {item.performanceData ? (
                          <span className="text-emerald-700 font-bold">
                            {(item.performanceData.views || 0).toLocaleString()} 播放 / {(item.performanceData.likes || 0).toLocaleString()} 赞
                          </span>
                        ) : (
                          <span className="text-slate-400">未录入</span>
                        )}
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
    </div>
  );
};
