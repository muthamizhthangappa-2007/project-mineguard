import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, MessageSquare, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { apiFetch } from '../services/api';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch('/notifications');
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      // Ignore background network error
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {}
  };

  const markAllRead = async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        title="Notifications & SMS Alerts"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-96 max-w-[90vw] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden text-slate-100">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-sm">Notifications & SMS Alerts</h3>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/80">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No notifications recorded.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 hover:bg-slate-800/60 transition-colors ${
                      !n.isRead ? 'bg-slate-800/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        {n.type === 'CRITICAL_OBSERVATION' || n.type === 'SLA_OVERDUE' ? (
                          <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                        ) : n.type === 'ESCALATION' ? (
                          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <p className={`text-xs font-semibold ${!n.isRead ? 'text-amber-300' : 'text-slate-200'}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-slate-300 mt-1 whitespace-pre-line leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="text-slate-400 hover:text-emerald-400 p-1"
                          title="Mark read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {n.smsSent && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-700/50">
                          <MessageSquare className="w-2.5 h-2.5" /> DEMO SMS SENT ✓
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
