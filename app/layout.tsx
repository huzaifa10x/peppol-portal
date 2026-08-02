'use client'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import LayoutShell from "@/components/LayoutShell";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { warning, extendSession } = useSessionTimeout();
  useSessionTimeout();
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <LayoutShell>
            {warning && (
              <div style={{
                position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
                background: "#854F0B", color: "#fff",
                padding: "12px 24px", display: "flex",
                alignItems: "center", justifyContent: "space-between",
                fontSize: "14px"
              }}>
                <span>Your session will expire in 1 minute due to inactivity.</span>
                <button
                  onClick={extendSession}
                  style={{
                    background: "#fff", color: "#854F0B",
                    border: "none", borderRadius: "6px",
                    padding: "6px 16px", fontSize: "13px",
                    fontWeight: 500, cursor: "pointer"
                  }}
                >
                  Stay logged in
                </button>
              </div>
            )}
            {children}
          </LayoutShell>
        </SessionProvider>
      </body>
    </html>
  );
}