"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenant_id: string;
  tenant_name: string;
  totp_enabled: boolean;
}

interface SessionContextType {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  status: "loading",
  signOut: async () => {},
  refresh: async () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  const fetchSession = async () => {
    try {
      const r = await fetch("/api/auth/session", { cache: "no-store" });
      const data = await r.json();
      if (data.user) {
        setUser(data.user);
        setStatus("authenticated");
      } else {
        setUser(null);
        setStatus("unauthenticated");
      }
    } catch {
      setUser(null);
      setStatus("unauthenticated");
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setStatus("unauthenticated");
    window.location.href = "/login";
  };

  return (
    <SessionContext.Provider value={{ user, status, signOut, refresh: fetchSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  return {
    data: ctx.user ? { user: ctx.user } : null,
    status: ctx.status,
    refresh: ctx.refresh,
  };
}

export function useSignOut() {
  return useContext(SessionContext).signOut;
}
