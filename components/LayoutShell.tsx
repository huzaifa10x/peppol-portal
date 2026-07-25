"use client";
import { useSession } from "@/lib/session";
import { usePathname } from "next/navigation";
import Link from "next/link";
import NavLinks from "./NavLinks";
import TopBar from "./TopBar";
import Image from "next/image";

// Auth pages & Public Legal routes
const AUTH_ROUTES = ["/login", "/register"];
const PUBLIC_LEGAL_ROUTES = ["/privacy", "/terms", "/data-retention"];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const isAuthPage = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  const isPublicLegalPage = PUBLIC_LEGAL_ROUTES.some((r) => pathname.startsWith(r));

  // Auth pages & Public Legal pages don't show full portal layout
  if (isAuthPage || isPublicLegalPage) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-gray-50 text-gray-900">
        <main className="flex-1">{children}</main>

        {/* Public Legal & Company Footer */}
        <footer className="border-t border-gray-200 bg-white py-6 px-4 text-xs text-gray-600 text-center">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <p className="font-semibold text-gray-800">KASA Advisory Service FZE</p>
              <p className="text-gray-500">License No: 16428 · UAE Address: Dubai Silicon Oasis, UAE</p>
            </div>
            <div className="flex gap-4 text-gray-600">
              <Link href="/privacy" className="hover:text-[#7C01ED] transition-colors">
                Privacy Policy
              </Link>
              <span>·</span>
              <Link href="/terms" className="hover:text-[#7C01ED] transition-colors">
                Terms of Service
              </Link>
              <span>·</span>
              <Link href="/data-retention" className="hover:text-[#7C01ED] transition-colors">
                Data Storage (UAE)
              </Link>
            </div>
            <div className="text-right text-gray-500">
              <p>Email: <a href="mailto:info@kasaadvisory.com" className="hover:underline text-gray-700">info@kasaadvisory.com</a></p>
              <p>© 2026 KASA Advisory Service FZE. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Loading spinner with primary KASA purple (#7C01ED)
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-[#7C01ED] border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not authenticated
  if (status === "unauthenticated") {
    return <>{children}</>;
  }

  // Authenticated Layout
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-gray-900">
      {/* Sidebar */}
      <div className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        {/* Sidebar Header with KASA Logo & Portal Label */}
        <div className="px-4 py-4 border-b border-gray-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Image
              alt="KASA Advisory Logo"
              width={140}
              height={32}
              priority
              className="h-8 w-auto object-contain"
              src="/kasa-logo.png"
            />
          </div>

          <div>
            <div className="text-[11px] font-bold tracking-wider text-[#7C01ED] uppercase">
              PEPPOL PORTAL
            </div>
            <div className="text-[11px] text-gray-500 truncate max-w-[180px]">
              {(session?.user as any)?.tenant_name ?? "KASA Advisory"} · PAE001045
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavLinks />
        </nav>

        {/* Sidebar Footer */}
        <div className="px-4 py-3 border-t border-gray-100 text-[11px] text-gray-500 flex flex-col gap-1">
          <div className="font-medium text-gray-700">UAE · PINT-AE</div>
          <div className="flex gap-2 text-gray-400">
            <Link href="/privacy" className="hover:text-gray-600">Privacy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-gray-600">Terms</Link>
            <span>·</span>
            <Link href="/data-retention" className="hover:text-gray-600">Data Info</Link>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}