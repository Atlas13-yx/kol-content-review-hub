import React from 'react';
import { UserRole } from '../types';
import { dataService } from '../services/dataService';
import { Shield, Building2, CheckCircle2, UserCheck, X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onRoleChanged: (newRole: UserRole) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onRoleChanged,
}) => {
  if (!isOpen) return null;

  const handleSelectRole = (role: UserRole) => {
    dataService.setCurrentRole(role);
    onRoleChanged(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">切换/登录工作身份</h3>
              <p className="text-xs text-slate-400">选择您的登录账号与审核权限角色</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-600 leading-relaxed">
            <p className="font-bold text-slate-800 mb-1">对接与流转规则说明：</p>
            <p>
              <strong className="text-indigo-700">广汽国际</strong> 不直接与 KOL 达人沟通。所有审核意见由广汽国际录入裁决结果，统一交由 <strong className="text-emerald-700">省广代理商</strong> 转达并协助达人修改，达人修改完成后再由省广提交复审。
            </p>
          </div>

          {/* Role Card 1: 广汽国际 (Me) */}
          <div
            onClick={() => handleSelectRole('Me')}
            className={`cursor-pointer rounded-xl p-4 border-2 transition-all flex items-start gap-4 ${
              currentRole === 'Me'
                ? 'border-indigo-600 bg-indigo-50/60 shadow-md ring-2 ring-indigo-500/20'
                : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  广汽国际 (Me)
                  {currentRole === 'Me' && (
                    <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-semibold">
                      当前登录
                    </span>
                  )}
                </span>
                {currentRole === 'Me' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                广汽国际团队。拥有内容最终裁决权，上传终审确认与修改要求（意见将传至省广由其督促达人修改），可创建与维护 Campaign 活动。
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-indigo-700 font-medium">
                <span className="bg-indigo-100 px-2 py-0.5 rounded">权限：终审裁决</span>
                <span className="bg-indigo-100 px-2 py-0.5 rounded">意见传至省广</span>
                <span className="bg-indigo-100 px-2 py-0.5 rounded">项目归档</span>
              </div>
            </div>
          </div>

          {/* Role Card 2: 省广代理商 (Agency) */}
          <div
            onClick={() => handleSelectRole('Agency')}
            className={`cursor-pointer rounded-xl p-4 border-2 transition-all flex items-start gap-4 ${
              currentRole === 'Agency'
                ? 'border-emerald-600 bg-emerald-50/60 shadow-md ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  省广代理商 (Agency)
                  {currentRole === 'Agency' && (
                    <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-semibold">
                      当前登录
                    </span>
                  )}
                </span>
                {currentRole === 'Agency' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                省广执行团队。负责对接达人、上传省广初审意见，并负责把广汽国际的终审要求转达达人落实修改，修改后推送给广汽国际复审。
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                <span className="bg-emerald-100 px-2 py-0.5 rounded">权限：录入省广初审</span>
                <span className="bg-emerald-100 px-2 py-0.5 rounded">对接达人跟进</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">提示：登录状态会自动在本地保存</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
