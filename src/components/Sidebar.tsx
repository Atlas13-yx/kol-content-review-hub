import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  UserCheck,
  FileCheck,
  FileText,
  Video,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Flame,
  ChevronDown
} from 'lucide-react';
import { dataService } from '../services/dataService';

export type NavPage =
  | 'dashboard'
  | 'campaigns'
  | 'campaign-detail'
  | 'kol-selection'
  | 'brief-review'
  | 'script-review'
  | 'video-review'
  | 'kols'
  | 'kol-detail'
  | 'content-detail'
  | 'contents'
  | 'my-reviews';

interface SidebarProps {
  currentPage: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: (page: string, params?: { id?: string }) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  isCollapsed,
  onToggleCollapse,
  onNavigate,
}) => {
  const [counts, setCounts] = useState({
    total: 0,
    kolSelection: 0,
    brief: 0,
    script: 0,
    video: 0,
    kols: 0,
    campaigns: 0,
  });

  const [isBrandGroupOpen, setIsBrandGroupOpen] = useState(true);

  useEffect(() => {
    const updateCounts = () => {
      const contents = dataService.getContents();
      const kols = dataService.getKols();
      const campaigns = dataService.getCampaigns();

      setCounts({
        total: contents.length,
        kolSelection: contents.filter((c) => c.stage === 'KOL Selection').length,
        brief: contents.filter((c) => c.stage === 'Brief').length,
        script: contents.filter((c) => c.stage === 'Script').length,
        video: contents.filter((c) => c.stage === 'Video').length,
        kols: kols.length,
        campaigns: campaigns.length,
      });
    };

    updateCounts();
    return dataService.subscribe(updateCounts);
  }, []);

  const navSections = [
    {
      title: '主工作台',
      items: [
        {
          id: 'dashboard',
          label: '控制台 (所有任务)',
          icon: LayoutDashboard,
          badge: counts.total,
          badgeColor: 'bg-slate-100 text-slate-700 font-bold',
        },
        {
          id: 'campaigns',
          label: 'Campaign',
          icon: FolderKanban,
          badge: counts.campaigns,
          badgeColor: 'bg-slate-100 text-slate-700',
        },
      ],
    },
    {
      title: '阶段审核协同',
      items: [
        {
          id: 'kol-selection',
          label: '1. 达人筛选',
          icon: UserCheck,
          badge: counts.kolSelection,
          badgeColor: 'bg-amber-100 text-amber-800 font-bold',
        },
        {
          id: 'brief-review',
          label: '2. Brief 审核',
          icon: FileCheck,
          badge: counts.brief,
          badgeColor: 'bg-blue-100 text-blue-800 font-bold',
        },
        {
          id: 'script-review',
          label: '3. 脚本审核',
          icon: FileText,
          badge: counts.script,
          badgeColor: 'bg-indigo-100 text-indigo-800 font-bold',
        },
        {
          id: 'video-review',
          label: '4. 视频审核',
          icon: Video,
          badge: counts.video,
          badgeColor: 'bg-purple-100 text-purple-800 font-bold',
        },
      ],
    },
    {
      title: '资源库',
      items: [
        {
          id: 'kols',
          label: '达人库',
          icon: Users,
          badge: counts.kols,
          badgeColor: 'bg-slate-100 text-slate-700',
        },
      ],
    },
  ];

  return (
    <aside
      className={`fixed top-16 left-0 bottom-0 z-30 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col select-none ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Floating Circular Toggle Button on right border */}
      <button
        onClick={onToggleCollapse}
        title={isCollapsed ? '展开左侧菜单' : '收起左侧菜单'}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 cursor-pointer z-40 transition-transform active:scale-95"
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Menu Items List */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {section.title}
              </div>
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  currentPage === item.id ||
                  (item.id === 'campaigns' && currentPage === 'campaign-detail') ||
                  (item.id === 'kols' && currentPage === 'kol-detail');

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-[#E64A19] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="truncate whitespace-nowrap">{item.label}</span>
                      )}
                    </div>

                    {!isCollapsed && item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                          isActive ? 'bg-white/20 text-white' : item.badgeColor
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info in Sidebar */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-100 bg-slate-50/70">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate font-medium">阶段审核单向流转</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
            筛选 ➔ Brief ➔ 脚本 ➔ 视频 ➔ 上线
          </p>
        </div>
      )}
    </aside>
  );
};
