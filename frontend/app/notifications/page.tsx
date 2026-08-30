'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Clock, 
  CheckCheck, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { api } from '../../lib/api';
import { NotificationItem } from '../../types';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleMarkSingleRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const getIcon = (type: string) => {
    if (type === 'high_risk') return <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />;
    if (type === 'warning') return <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />;
    if (type === 'completed') return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
    return <Info className="w-5 h-5 text-cyan-400 shrink-0" />;
  };

  return (
    <div className="space-y-6 py-4 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-blue-900/30 pb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">System Alerts</div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Notifications</span>
          </h1>
        </div>

        {notifications.some(n => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-slate-700 hover:bg-surface-elevated text-xs font-semibold text-cyan-300 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-slate-400">
          Loading alerts...
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border-slate-800 space-y-3">
          <Bell className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Unread Notifications</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All screening operations, high-risk flags, and system updates will be logged here in real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkSingleRead(n.id)}
              className={`glass-panel rounded-2xl p-4 border transition-all flex items-start gap-4 cursor-pointer ${
                !n.is_read
                  ? 'bg-blue-950/20 border-cyan-500/40 shadow-glow-blue/10'
                  : 'bg-surface/60 border-slate-800 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="p-2 rounded-xl bg-surface border border-white/5 mt-0.5">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{n.title}</h4>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {n.message}
                </p>

                {n.link && (
                  <div className="pt-2">
                    <Link
                      href={n.link}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                    >
                      <span>View Result Dossier</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
