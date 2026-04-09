"use client";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { LogOut, ChevronDown } from "lucide-react";
import NotificationCenter from "./NotificationCenter";

export default function TopBar() {
  const { data: session } = useSession();
  const [showUser, setShowUser] = useState(false);

  if (!session) return null;

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-end px-5 gap-3 shrink-0">
      <NotificationCenter />

      <div className="relative">
        <button
          onClick={() => setShowUser(!showUser)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {session.user?.name?.[0]?.toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-medium text-gray-800 leading-none">{session.user?.name}</div>
            <div className="text-xs text-gray-400 mt-0.5">{(session.user as any)?.role}</div>
          </div>
          <ChevronDown size={12} className="text-gray-400" />
        </button>

        {showUser && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowUser(false)} />
            <div className="absolute right-0 top-10 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="text-xs font-medium text-gray-800">{session.user?.email}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {(session.user as any)?.tenant_name ?? "KASA Advisory"}
                </div>
              </div>
              <div className="p-1">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
