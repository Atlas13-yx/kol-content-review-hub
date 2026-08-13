import React from 'react';
import { Status, STATUS_LABELS } from '../types';

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const label = STATUS_LABELS[status] || status;

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    case 'Waiting for My Review':
      // Highly prominent for "Waiting for My Review"
      colorClasses = 'bg-indigo-600 text-white font-medium shadow-sm ring-1 ring-indigo-700/50';
      break;
    case 'Waiting for Agency Review':
      colorClasses = 'bg-amber-50 text-amber-800 border border-amber-200/80 font-medium';
      break;
    case 'Waiting for KOL Script':
    case 'Waiting for KOL Video':
    case 'Waiting for KOL Revision':
      colorClasses = 'bg-sky-50 text-sky-800 border border-sky-200/80 font-medium';
      break;
    case 'Script Approved':
    case 'Video Approved':
    case 'Completed':
      colorClasses = 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium';
      break;
    case 'Brief Draft':
    case 'Brief Sent':
      colorClasses = 'bg-slate-100 text-slate-600 border border-slate-200';
      break;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs rounded-md',
    md: 'px-2.5 py-1 text-xs rounded-md',
    lg: 'px-3 py-1.5 text-sm rounded-lg',
  }[size];

  return (
    <span className={`inline-flex items-center whitespace-nowrap transition-colors ${sizeClasses} ${colorClasses}`}>
      {status === 'Waiting for My Review' && (
        <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse" />
      )}
      {label}
    </span>
  );
};
