"use client";
import { useSession } from "@/lib/session";
import { usePathname } from "next/navigation";
import NavLinks from "./NavLinks";
import TopBar from "./TopBar";

const AUTH_ROUTES = ["/login", "/register"];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const isAuthPage = AUTH_ROUTES.some(r => pathname.startsWith(r));

  if (isAuthPage || status === "unauthenticated") {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-52 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="text-sm font-bold text-blue-700">PEPPOL PORTAL</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {(session?.user as any)?.tenant_name ?? "KASA Advisory"} · PAE001045
          </div>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          <NavLinks />
        </nav>
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="text-xs text-gray-400">UAE · PINT-AE · Oxalis-NG 1.2.0</div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
