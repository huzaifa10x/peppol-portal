"use client";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { Bell, LogOut, User, ChevronDown } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  read: boolean;
  created_at: string;
}

export default function TopBar() {
  const { data: session } = useSession();
  const [notifs, setNotifs]     = useState<Notification[]>([]);
  const [unread, setUnread]     = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUser, setShowUser] = useState(false);

  const loadNotifs = async () => {
    try {
      const r = await fetch(`${BASE}/notifications`);
      const d = await r.json();
      setNotifs(d.notifications ?? []);
      setUnread(d.unread ?? 0);
    } catch {}
  };

  useEffect(() => {
    loadNotifs();
    const interval = setInterval(loadNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  const markRead = async (id: string) => {
    await fetch(`${BASE}/notifications/${id}/read`, { method: "POST" });
    setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));
    setUnread(u => Math.max(0, u - 1));
  };

  if (!session) return null;

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-end px-5 gap-3 shrink-0">
      {/* Notifications */}
      <div className="relative">
        <button onClick={() => { setShowNotifs(!showNotifs); setShowUser(false); }}
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={16} className="text-gray-500" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {showNotifs && (
          <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">Notifications</span>
              {unread > 0 && (
                <span className="text-xs text-blue-600 font-medium">{unread} unread</span>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">No notifications</div>
              ) : notifs.map(n => (
                <div key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${
                    !n.read ? "bg-blue-50" : ""
                  }`}>
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      n.severity === "error"   ? "bg-red-500" :
                      n.severity === "warning" ? "bg-amber-500" : "bg-blue-500"
                    }`} />
                    <div>
                      <div className="text-xs font-medium text-gray-800">{n.title}</div>
                      {n.message && (
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User menu */}
      <div className="relative">
        <button onClick={() => { setShowUser(!showUser); setShowNotifs(false); }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {session.user?.name?.[0]?.toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="text-left">
            <div className="text-xs font-medium text-gray-800 leading-none">{session.user?.name}</div>
            <div className="text-xs text-gray-400 mt-0.5">{(session.user as any)?.role}</div>
          </div>
          <ChevronDown size={12} className="text-gray-400" />
        </button>

        {showUser && (
          <div className="absolute right-0 top-10 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="text-xs font-medium text-gray-800">{session.user?.email}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {(session.user as any)?.tenant_name}
              </div>
            </div>
            <div className="p-1">
              <button onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
