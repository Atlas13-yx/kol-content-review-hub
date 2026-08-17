import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Bell,
  Clock,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  FileText,
  Video,
  CheckSquare,
  Users,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { SystemNotification, UserRole } from '../types';

interface NotificationToastProps {
  currentRole: UserRole;
  onNavigate: (page: string, params?: { id?: string; campaignId?: string; batchId?: string }) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ currentRole, onNavigate }) => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isExpandedList, setIsExpandedList] = useState(false);

  useEffect(() => {
    const update = () => {
      const allActive = dataService.getNotifications(currentRole, false);
      setNotifications(allActive);
    };

    update();
    return dataService.subscribe(update);
  }, [currentRole]);

  // Dismiss a notification
  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dataService.dismissNotification(id);
  };

  // Click on toast to navigate to task
  const handleClickNotification = (notif: SystemNotification) => {
    dataService.markNotificationAsRead(notif.id);
    dataService.dismissNotification(notif.id);
    if (notif.targetPage) {
      onNavigate(notif.targetPage, notif.targetParams);
    }
  };

  const handleDismissAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    dataService.dismissAllNotifications();
  };

  if (notifications.length === 0) {
    return null;
  }

  // Display top 3 toasts when collapsed, or all when expanded
  const visibleToasts = isExpandedList ? notifications : notifications.slice(0, 3);
  const hiddenCount = notifications.length - visibleToasts.length;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 w-full max-w-sm sm:max-w-md pointer-events-none select-none">
      {/* Action Bar when multiple alerts exist */}
      {notifications.length > 1 && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-xl shadow-xl pointer-events-auto border border-slate-700/60">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="font-bold text-slate-100">
              消息待办提醒 ({notifications.length})
            </span>
          </div>
          <div className="flex items-center gap-3">
            {notifications.length > 2 && (
              <button
                onClick={() => setIsExpandedList(!isExpandedList)}
                className="text-indigo-300 hover:text-indigo-200 text-xs font-semibold cursor-pointer"
              >
                {isExpandedList ? '收起' : `展开全部 (${notifications.length})`}
              </button>
            )}
            <button
              onClick={handleDismissAll}
              className="text-slate-400 hover:text-white text-xs cursor-pointer flex items-center gap-1 font-medium"
              title="全部清除"
            >
              <X className="w-3.5 h-3.5" />
              <span>全部清除</span>
            </button>
          </div>
        </div>
      )}

      {/* Toast Items */}
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((notif) => {
          const isDeadline = notif.type === 'campaign_deadline' || notif.type === 'review_deadline';
          const isKolSelection = notif.type === 'kol_selection';
          const isHighlight = notif.highlight || isDeadline;

          let badgeIcon = <Bell className="w-4 h-4 text-indigo-600" />;
          let cardBg = 'bg-white/95 border-indigo-200 shadow-indigo-100/50';
          let titleColor = 'text-slate-900';
          let headerBadge = 'bg-indigo-50 text-indigo-700 border-indigo-200';

          if (notif.type === 'campaign_deadline') {
            badgeIcon = <Clock className="w-4 h-4 text-amber-600 animate-pulse" />;
            cardBg = 'bg-gradient-to-br from-amber-50/95 via-white/95 to-orange-50/95 border-amber-300 shadow-amber-500/10';
            titleColor = 'text-amber-950';
            headerBadge = 'bg-amber-100 text-amber-800 border-amber-300';
          } else if (notif.type === 'review_deadline') {
            badgeIcon = <AlertTriangle className="w-4 h-4 text-rose-600" />;
            cardBg = 'bg-gradient-to-br from-rose-50/95 via-white/95 to-white/95 border-rose-200 shadow-rose-500/10';
            titleColor = 'text-rose-950';
            headerBadge = 'bg-rose-100 text-rose-800 border-rose-200';
          } else if (isKolSelection) {
            badgeIcon = <Users className="w-4 h-4 text-emerald-600" />;
            cardBg = 'bg-gradient-to-br from-emerald-50/95 via-white/95 to-white/95 border-emerald-200 shadow-emerald-500/10';
            headerBadge = 'bg-emerald-100 text-emerald-800 border-emerald-200';
          } else if (notif.relatedType === 'video') {
            badgeIcon = <Video className="w-4 h-4 text-blue-600" />;
          } else if (notif.relatedType === 'brief') {
            badgeIcon = <FileText className="w-4 h-4 text-indigo-600" />;
          }

          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={() => handleClickNotification(notif)}
              className={`group pointer-events-auto relative p-4 rounded-2xl border backdrop-blur-xl shadow-xl transition-all hover:shadow-2xl hover:scale-[1.01] cursor-pointer ${cardBg}`}
            >
              {/* Close Button (×) */}
              <button
                onClick={(e) => handleDismiss(e, notif.id)}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="关闭此提醒 (×)"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-3.5 pr-6">
                {/* Icon Badge */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs border ${headerBadge}`}
                >
                  {badgeIcon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`text-sm font-bold leading-tight ${titleColor}`}>
                      {notif.title}
                    </h4>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-2.5">
                    {notif.message}
                  </p>

                  {/* Footer metadata & Action link */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100/80 text-[11px]">
                    <span className="text-slate-400 font-mono font-medium">
                      {new Date(notif.createdAt).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 group-hover:text-indigo-700 group-hover:translate-x-0.5 transition-all">
                      <span>立即前往处理</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Collapsed Indicator */}
      {!isExpandedList && hiddenCount > 0 && (
        <div
          onClick={() => setIsExpandedList(true)}
          className="pointer-events-auto text-center py-1.5 px-3 bg-white/90 backdrop-blur-md rounded-xl border border-slate-200 text-xs font-semibold text-indigo-600 hover:text-indigo-700 shadow-sm cursor-pointer hover:bg-indigo-50/80 transition-colors"
        >
          还有 {hiddenCount} 条提醒待处理，点击展开...
        </div>
      )}
    </div>
  );
};
