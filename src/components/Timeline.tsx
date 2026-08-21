import React, { useState } from 'react';
import { TimelineEvent } from '../types';
import { 
  FileText, 
  Send, 
  Building2, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Video, 
  Flag,
  ArrowUpDown
} from 'lucide-react';

interface TimelineProps {
  events: TimelineEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  const [isAsc, setIsAsc] = useState(true);

  const sortedEvents = [...events].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime() || 0;
    const timeB = new Date(b.timestamp).getTime() || 0;
    return isAsc ? timeA - timeB : timeB - timeA;
  });

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'brief':
        return <Send className="w-4 h-4 text-slate-500" />;
      case 'script_sub':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'agency_rev':
        return <Building2 className="w-4 h-4 text-amber-600" />;
      case 'my_rev':
        return <UserCheck className="w-4 h-4 text-indigo-600" />;
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'revision_req':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'video_sub':
        return <Video className="w-4 h-4 text-purple-600" />;
      case 'completed':
        return <Flag className="w-4 h-4 text-emerald-700" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActorBadge = (actor: TimelineEvent['actor']) => {
    switch (actor) {
      case 'Me':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">我 (Me)</span>;
      case 'Agency':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">省广</span>;
      case 'KOL':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">达人</span>;
      case 'System':
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">系统</span>;
    }
  };

  const formatTimestamp = (ts: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return ts;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Timeline 全生命周期审稿轨迹</h3>
          <p className="text-xs text-slate-500 mt-0.5">记录该内容从 Brief 到 Script、Video 每一轮审核的完整履历</p>
        </div>
        <button
          onClick={() => setIsAsc(!isAsc)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 hover:bg-slate-50 text-slate-600"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>{isAsc ? '正序 (较早在前)' : '倒序 (最新在前)'}</span>
        </button>
      </div>

      {sortedEvents.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-400">暂无时间轴履历</div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {sortedEvents.map((evt) => (
            <div key={evt.id} className="relative group">
              {/* Dot Icon Container */}
              <div className="absolute -left-6 top-0.5 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center z-10">
                {getEventIcon(evt.type)}
              </div>

              <div className="bg-slate-50 hover:bg-slate-100/80 transition-colors p-3.5 rounded-lg border border-slate-200/80">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{evt.title}</span>
                    {getActorBadge(evt.actor)}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{formatTimestamp(evt.timestamp)}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{evt.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
