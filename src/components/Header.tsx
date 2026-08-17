import React from 'react';
import { Shield, Building2, LogOut, ChevronDown, User, Layers, Sparkles } from 'lucide-react';
import { UserRole, UserAccount } from '../types';

interface HeaderProps {
  currentRole: UserRole;
  currentUser: UserAccount | null;
  onOpenSwitchAccount: () => void;
  onLogout: () => void;
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  currentUser,
  onOpenSwitchAccount,
  onLogout,
  onLogoClick,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs select-none">
      {/* Left: Brand Logo & Title */}
      <div
        onClick={onLogoClick}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
              KOL 内容审核系统
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/80">
              广汽国际
            </span>
          </div>
        </div>
      </div>

      {/* Right: Only 登录账号 + 退出 */}
      <div className="flex items-center gap-3">
        {/* Logged in User Pill (Click to Switch Account) */}
        <button
          onClick={onOpenSwitchAccount}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/80 hover:bg-slate-100/80 transition-all text-xs font-semibold text-slate-700 cursor-pointer"
          title="点击切换账号或查看身份"
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold ${
              currentRole === 'Me' ? 'bg-indigo-600' : 'bg-emerald-600'
            }`}
          >
            {currentRole === 'Me' ? '广' : '省'}
          </div>

          <div className="text-left hidden sm:block leading-tight">
            <div className="text-slate-900 font-bold flex items-center gap-1">
              <span>{currentRole === 'Me' ? '广汽国际' : '省广代理商'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
            <div className="text-[10px] text-slate-400 font-mono font-normal">
              {currentUser?.username || (currentRole === 'Me' ? 'zhangwenye' : 'agency_user')}
            </div>
          </div>
        </button>

        {/* Exit / Logout Button */}
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-all text-xs font-semibold cursor-pointer"
          title="退出当前登录账号"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">退出</span>
        </button>
      </div>
    </header>
  );
};
