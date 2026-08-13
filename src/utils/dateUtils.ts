import { Stage } from '../types';

export function isOverdue(deadline: string, stage: Stage): boolean {
  if (stage === 'Completed') return false;
  if (!deadline) return false;
  const todayStr = new Date().toISOString().split('T')[0];
  return deadline < todayStr;
}

export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return '';
  const now = new Date();
  const past = new Date(dateStr);
  const diffInMs = now.getTime() - past.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return '今天';
  if (diffInDays === 1) return '1天前';
  if (diffInDays > 1) return `${diffInDays}天前`;
  return dateStr.split('T')[0];
}

export function calculateWaitingTime(updatedAt: string): string {
  if (!updatedAt) return '未更新';
  const now = new Date();
  const past = new Date(updatedAt);
  const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return '刚刚';
  if (diffInHours < 24) return `${diffInHours}小时`;
  const days = Math.floor(diffInHours / 24);
  return `${days}天${diffInHours % 24}小时`;
}
