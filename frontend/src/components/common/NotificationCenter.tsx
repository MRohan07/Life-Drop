import React from 'react';
import { useLifeDrop } from '../../context/LifeDropContext';
import {
  X,
  Bell,
  CheckCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  Smartphone,
  ExternalLink,
  Trash2,
} from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRequest?: (requestId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onSelectRequest,
}) => {
  const {
    notifications,
    currentRole,
    currentUser,
    currentHospital,
    currentBloodBank,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotification,
  } = useLifeDrop();

  if (!isOpen) return null;

  // Filter notifications relevant to current persona
  const filteredNotifs = notifications.filter((n) => {
    if (currentRole === 'ADMIN') return true;
    if (n.recipientRole !== currentRole) return false;
    if (currentRole === 'USER' && n.recipientId && n.recipientId !== currentUser.id) return false;
    if (currentRole === 'HOSPITAL' && n.recipientId && n.recipientId !== currentHospital.id) return false;
    if (currentRole === 'BLOOD_BANK' && n.recipientId && n.recipientId !== currentBloodBank.id) return false;
    return true;
  });

  const unreadCount = filteredNotifs.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return <AlertTriangle className="w-5 h-5 text-lifedrop-emergency" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-lifedrop-success" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-lifedrop-warning" />;
      default:
        return <Info className="w-5 h-5 text-lifedrop-info" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-lifedrop-navy/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-lifedrop-primary/10 text-lifedrop-primary flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-lifedrop-navy flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-lifedrop-emergency text-white text-xs font-extrabold">
                      {unreadCount}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500">
                  {currentRole === 'USER'
                    ? `Donor: ${currentUser.name}`
                    : currentRole === 'HOSPITAL'
                    ? currentHospital.name
                    : currentRole === 'BLOOD_BANK'
                    ? currentBloodBank.name
                    : 'System Administrator'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsAsRead}
                  title="Mark all as read"
                  className="p-2 rounded-xl text-slate-500 hover:text-lifedrop-navy hover:bg-slate-200 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredNotifs.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-medium">No notifications right now.</p>
                <p className="text-xs text-slate-400 mt-1">
                  You're all caught up with recent events.
                </p>
              </div>
            ) : (
              filteredNotifs.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    markNotificationAsRead(notif.id);
                    if (notif.requestId && onSelectRequest) {
                      onSelectRequest(notif.requestId);
                      onClose();
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    notif.read
                      ? 'bg-white border-slate-100 opacity-80 hover:opacity-100'
                      : notif.type === 'emergency'
                      ? 'bg-red-50/80 border-red-200 shadow-sm'
                      : 'bg-blue-50/50 border-blue-100 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white shadow-xs border border-slate-100 flex-shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`text-sm font-bold truncate ${
                            notif.type === 'emergency' ? 'text-lifedrop-emergency' : 'text-slate-900'
                          }`}
                        >
                          {notif.title}
                        </h4>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">
                          {notif.timestamp.slice(11)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* External SMS Simulation Card */}
                      {notif.smsPreview && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono border border-slate-800 flex items-start gap-2">
                          <Smartphone className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="text-[10px] text-emerald-400 block font-sans font-bold uppercase tracking-wider">
                              SMS Emergency Dispatch
                            </span>
                            <span className="text-slate-300 text-[11px] leading-tight">
                              {notif.smsPreview}
                            </span>
                          </div>
                        </div>
                      )}

                      {notif.requestId && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-lifedrop-primary hover:underline">
                            View Request Details #{notif.requestId}
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(notif.id);
                      }}
                      className="p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer note */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400">
            Real-time emergency coordination channels active (In-App • SMS • Push)
          </div>
        </div>
      </div>
    </div>
  );
};
