import React from 'react';
import { Plus, User, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onNewContent?: () => void;
  onNewCampaign?: () => void;
  onNewKol?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onNewContent,
  onNewCampaign,
  onNewKol,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {onNewContent && (
          <button
            onClick={onNewContent}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>新建 Content 任务</span>
          </button>
        )}

        {onNewCampaign && (
          <button
            onClick={onNewCampaign}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>新建 Campaign</span>
          </button>
        )}

        {onNewKol && (
          <button
            onClick={onNewKol}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>新建 KOL</span>
          </button>
        )}

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* Current User Indicator */}
        <div className="flex items-center gap-2 pl-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs">
            <User className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
              <span>广汽国际 (Me)</span>
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-[10px] text-slate-400">内容终审与裁决</div>
          </div>
        </div>
      </div>
    </header>
  );
};
