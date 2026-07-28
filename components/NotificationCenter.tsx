"use client";
import { useState, useEffect } from "react";
import {
  Bell, X, CheckCircle, AlertTriangle,
  Info, Shield, Send, FileText, RefreshCw
} from "lucide-react";


const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  read: boolean;
  document_id: string | null;
  created_at: string;
}

interface Summary {
  total: number;
  unread: number;
  errors: number;
  warnings: number;
  tdd_generated: number;
  tdd_sent: number;
  send_failed: number;
  system_alerts: number;
  new_documents: number;
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  new_document: { icon: FileText, color: "text-blue-600", bg: "bg-blue-50", label: "New Invoice" },
  tdd_generated: { icon: Shield, color: "text-purple-600", bg: "bg-purple-50", label: "TDD Generated" },
  tdd_sent: { icon: Shield, color: "text-teal-600", bg: "bg-teal-50", label: "TDD Sent to FTA" },
  send_failed: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50", label: "Send Failed" },
  system_alert: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50", label: "System Alert" },
  resend_failed: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50", label: "Resend Failed" },
  default: { icon: Info, color: "text-gray-500", bg: "bg-gray-50", label: "Notification" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    const [n, s] = await Promise.all([
      fetch(`${BASE}/notifications?limit=50`, { credentials: "include" }).then(r => r.json()).catch(() => ({ notifications: [] })),
      fetch(`${BASE}/notifications/summary`, { credentials: "include" }).then(r => r.json()).catch(() => null),
    ]);
    setNotifs(n.notifications ?? []);
    setSummary(s);
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 30000);
    return () => clearInterval(i);
  }, []);

  const markRead = async (id: string) => {
    await fetch(`${BASE}/notifications/${id}/read`, { method: "POST", credentials: "include" });
    setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));
    setSummary(s => s ? { ...s, unread: Math.max(0, s.unread - 1) } : s);
  };

  const markAllRead = async () => {
    await fetch(`${BASE}/notifications/mark-all-read`, { method: "POST", credentials: "include" });
    setNotifs(n => n.map(x => ({ ...x, read: true })));
    setSummary(s => s ? { ...s, unread: 0 } : s);
  };

  const clearRead = async () => {
    await fetch(`${BASE}/notifications/clear`, { method: "DELETE", credentials: "include" });
    setNotifs(n => n.filter(x => !x.read));
    load();
  };

  const runSync = async () => {
    setSyncing(true);
    await fetch(`${BASE}/sync/full-pipeline`, { method: "POST", credentials: "include" });
    await fetch(`${BASE}/sync/notify-new-inbound`, { method: "POST", credentials: "include" });
    await load();
    setSyncing(false);
  };

  const filtered = filter === "all"
    ? notifs
    : notifs.filter(n => n.type === filter);

  const unread = summary?.unread ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <Bell size={16} className="text-gray-500" />
        {unread > 0 && (
          <span className="absolute top-1 -left-4 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 top-10 w-96 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-800">
                  Notifications
                  {unread > 0 && (
                    <span className="ml-2 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">
                      {unread} new
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={runSync} disabled={syncing}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    title="Sync pipeline">
                    <RefreshCw size={13} className={syncing ? "animate-spin text-blue-500" : ""} />
                  </button>
                  {unread > 0 && (
                    <button onClick={markAllRead}
                      className="text-xs text-blue-600 hover:underline px-1">
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setOpen(false)}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Summary pills */}
              {summary && (
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: "all", label: "All", count: summary.total },
                    { key: "new_document", label: "Inbound", count: summary.new_documents },
                    { key: "tdd_sent", label: "TDD", count: summary.tdd_sent + summary.tdd_generated },
                    { key: "send_failed", label: "Failures", count: summary.send_failed },
                    { key: "system_alert", label: "System", count: summary.system_alerts },
                  ].map(({ key, label, count }) => (
                    <button key={key} onClick={() => setFilter(key)}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${filter === key
                        ? "bg-[#7C01ED] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}>
                      {label}
                      {count > 0 && (
                        <span className={`ml-1 ${filter === key ? "opacity-75" : "text-gray-400"}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[420px]">
              {filtered.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <Bell size={24} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No notifications</p>
                </div>
              ) : filtered.map(n => {
                const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.default;
                const Icon = cfg.icon;
                return (
                  <div key={n.id}
                    onClick={() => !n.read && markRead(n.id)}
                    className={`flex gap-3 px-4 py-3 border-b border-gray-50 last:border-0 transition-colors ${!n.read ? "bg-blue-50/50 cursor-pointer hover:bg-blue-50" : "hover:bg-gray-50"
                      }`}>
                    <div className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon size={14} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-xs font-medium ${!n.read ? "text-gray-900" : "text-gray-700"} leading-snug`}>
                          {n.title}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">{timeAgo(n.created_at)}</span>
                      </div>
                      {n.message && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
              <button onClick={clearRead}
                className="text-xs text-gray-400 hover:text-gray-600">
                Clear read
              </button>
              <span className="text-xs text-gray-400">
                {filtered.length} shown
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
