import React from 'react';
import { UserRole, UserAccount } from '../types';
import { LoginPage } from './LoginPage';
import { X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onRoleChanged: (newRole: UserRole) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onRoleChanged,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative max-w-4xl w-full">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-slate-400 hover:text-white flex items-center gap-1 text-xs font-semibold bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/80 transition-colors"
        >
          <X className="w-4 h-4" />
          <span>关闭</span>
        </button>
        <LoginPage
          isModal={true}
          onCloseModal={onClose}
          onLoginSuccess={(user: UserAccount) => {
            onRoleChanged(user.role);
            onClose();
          }}
        />
      </div>
    </div>
  );
};

