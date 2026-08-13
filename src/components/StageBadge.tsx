import React from 'react';
import { Stage, STAGE_LABELS } from '../types';

interface StageBadgeProps {
  stage: Stage;
  size?: 'sm' | 'md';
}

export const StageBadge: React.FC<StageBadgeProps> = ({ stage, size = 'md' }) => {
  const label = STAGE_LABELS[stage] || stage;

  let styles = 'bg-zinc-100 text-zinc-700 border-zinc-200';

  switch (stage) {
    case 'Brief':
      styles = 'bg-slate-100 text-slate-700 border-slate-200';
      break;
    case 'Script':
      styles = 'bg-blue-50 text-blue-700 border-blue-200/60';
      break;
    case 'Video':
      styles = 'bg-purple-50 text-purple-700 border-purple-200/60';
      break;
    case 'Completed':
      styles = 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
      break;
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-medium rounded border ${sizeClass} ${styles}`}>
      {label}
    </span>
  );
};
