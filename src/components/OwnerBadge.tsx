import React from 'react';
import { CurrentOwner, OWNER_LABELS } from '../types';
import { User, Building2, UserCheck, Minus } from 'lucide-react';

interface OwnerBadgeProps {
  owner: CurrentOwner;
}

export const OwnerBadge: React.FC<OwnerBadgeProps> = ({ owner }) => {
  const label = OWNER_LABELS[owner] || owner;

  switch (owner) {
    case 'Me':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/70">
          <User className="w-3 h-3" />
          {label}
        </span>
      );
    case 'Agency':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/70">
          <Building2 className="w-3 h-3" />
          {label}
        </span>
      );
    case 'KOL':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200/70">
          <UserCheck className="w-3 h-3" />
          {label}
        </span>
      );
    case 'None':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
          <Minus className="w-3 h-3" />
          {label}
        </span>
      );
  }
};
