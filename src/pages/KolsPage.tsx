import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { KOL } from '../types';
import { Plus, ExternalLink, Phone, MessageSquare, FileText, Eye, ThumbsUp } from 'lucide-react';

interface KolsPageProps {
  onNavigate: (page: string, params?: { id?: string }) => void;
  onOpenNewKol: () => void;
}

export const KolsPage: React.FC<KolsPageProps> = ({ onNavigate, onOpenNewKol }) => {
  const [kols, setKols] = useState<KOL[]>([]);

  useEffect(() => {
    const update = () => {
      setKols(dataService.getKols());
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
          <h1 className="text-xl font-bold text-slate-900">合作达人库 ({kols.length})</h1>
          <p className="text-xs text-slate-500 mt-1">
            仅录入目前已合作的达人信息。发布后数据（播放量/点赞数等）支持手动填充并自动统计累加。
          </p>
        </div>

        <button
          onClick={onOpenNewKol}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>录入已合作 KOL</span>
        </button>
      </div>

      {/* KOL Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kols.map((kol) => {
          const kolContents = contents.filter((c) => c.kolId === kol.id);

          // Calculate manually filled aggregate performance metrics
          let totalViews = 0;
          let totalLikes = 0;
          kolContents.forEach((c) => {
            if (c.performanceData) {
              totalViews += c.performanceData.views || 0;
              totalLikes += c.performanceData.likes || 0;
            }
          });

          return (
            <div
              key={kol.id}
              onClick={() => onNavigate('kol-detail', { id: kol.id })}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3.5 mb-3">
                  <img
                    src={kol.avatar}
                    alt={kol.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                      {kol.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {kol.platform}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono font-medium">
                        {kol.followers} 粉丝
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                      累计播放量
                    </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {totalViews > 0 ? totalViews.toLocaleString() : '未录入'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-slate-500">
                      <ThumbsUp className="w-3.5 h-3.5 text-rose-500" />
                      累计互动/点赞
                    </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {totalLikes > 0 ? totalLikes.toLocaleString() : '未录入'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  合作任务 ({kolContents.length})
                </span>
                <span className="text-indigo-600 font-semibold group-hover:underline flex items-center gap-0.5">
                  查看主页 <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
