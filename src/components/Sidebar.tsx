import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  FileText, 
  FolderKanban, 
  Users, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { dataService } from '../services/dataService';

export type NavPage = 'dashboard' | 'my-reviews' | 'contents' | 'campaigns' | 'kols' | 'content-detail' | 'campaign-detail' | 'kol-detail';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage, params?: { id?: string }) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const [myReviewCount, setMyReviewCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const contents = dataService.getContents();
      const count = contents.filter((c) => c.currentOwner === 'Me').length;
      setMyReviewCount(count);
    };

    updateCount();
    const unsubscribe = dataService.subscribe(updateCount);
    return () => unsubscribe();
  }, []);

  const handleResetDemo = () => {
    if (window.confirm('确定要重置示例数据吗？修改过的审稿记录和版本将恢复默认。')) {
      dataService.resetToDemoData();
      alert('Demo 数据已重置！');
    }
  };

  const navItems = [
    {
      id: 'dashboard' as NavPage,
      label: 'Dashboard 首页',
      icon: LayoutDashboard,
    },
    {
      id: 'my-reviews' as NavPage,
      label: '待我审核',
      icon: CheckSquare,
      badge: myReviewCount,
      badgeColor: 'bg-indigo-600 text-white',
    },
    {
      id: 'contents' as NavPage,
      label: 'Content 任务列表',
      icon: FileText,
    },
    {
      id: 'campaigns' as NavPage,
      label: 'Campaign 项目',
      icon: FolderKanban,
    },
    {
      id: 'kols' as NavPage,
      label: 'KOL 达人库',
      icon: Users,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-950/50">
            KOL
          </div>
          <div>
            <h1 className="font-semibold text-slate-100 text-sm tracking-tight leading-none">Content Review Hub</h1>
            <p className="text-[11px] text-slate-400 mt-1">达人内容审核管理</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">工作台 Navigation</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                    isActive ? 'bg-white text-indigo-700' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info & Demo Reset */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 mb-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>目前版本：V0.1 + V0.2</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            包含任务责任流转、Script & Video 历史版本及意见保留。
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors border border-slate-800"
          title="恢复初始示例数据"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>重置 Demo 数据</span>
        </button>
      </div>
    </aside>
  );
};
