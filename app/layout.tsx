import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavLinks from "@/components/NavLinks";
import SessionProvider from "@/components/SessionProvider";
import TopBar from "@/components/TopBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KASA Peppol Portal",
  description: "Peppol e-invoicing platform — KASA Advisory Service FZE",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <SessionProvider>
          <div className="flex h-screen overflow-hidden">
            <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
              <div className="px-5 py-5 border-b border-gray-100">
                <div className="text-sm font-bold text-blue-700 tracking-wide uppercase">Peppol Portal</div>
                <div className="text-xs text-gray-400 mt-0.5">KASA Advisory · PAE001045</div>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                <NavLinks />
              </nav>
              <div className="px-5 py-4 border-t border-gray-100 text-xs text-gray-400">
                UAE · PINT-AE · Oxalis-NG 1.2.0
              </div>
            </aside>
            <div className="flex-1 flex flex-col overflow-hidden">
              <TopBar />
              <main className="flex-1 overflow-auto">
                {children}
              </main>
            </div>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
