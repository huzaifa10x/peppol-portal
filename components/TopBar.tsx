"use client";
import { useSession, useSignOut } from "@/lib/session";
import { useState } from "react";
import { LogOut, ChevronDown, User } from "lucide-react";
import NotificationCenter from "./NotificationCenter";

export default function TopBar() {
  const { data: session, status } = useSession();
  const signOut = useSignOut();
  const [showUser, setShowUser] = useState(false);

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-end px-5 gap-3 shrink-0">
      {status === "authenticated" && session && (
        <>
          <NotificationCenter />
          <div className="relative">
            <button
              onClick={() => setShowUser(!showUser)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-7 h-7 bg-[#7C01ED] rounded-full flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white">
                  {session.user?.name?.[0]?.toUpperCase() ?? "K"}
                </span>
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-medium text-gray-800 leading-none">
                  {session.user?.name ?? "Admin"}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {(session.user as any)?.role ?? "admin"}
                </div>
              </div>
              <ChevronDown size={12} className="text-gray-400" />
            </button>

            {showUser && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUser(false)}
                />
                <div className="absolute right-0 top-11 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <div className="text-xs font-semibold text-gray-800">
                      {session.user?.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {session.user?.email}
                    </div>
                    <div className="text-xs text-blue-600 mt-0.5">
                      {(session.user as any)?.tenant_name ?? "KASA Advisory"}
                    </div>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={signOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">
                      <LogOut size={14} />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Always show sign out even when session loading */}
      {status === "unauthenticated" && (
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200">
          <LogOut size={14} />
          Sign out
        </button>
      )}
    </div>
  );
}
