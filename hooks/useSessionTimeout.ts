"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const TIMEOUT_MS = 5 * 60 * 1000;
const WARNING_MS = 4 * 60 * 1000;

export function useSessionTimeout() {
  const router = useRouter();
  const logoutTimer = useRef<NodeJS.Timeout | null>(null);
  const warnTimer   = useRef<NodeJS.Timeout | null>(null);
  const [warning, setWarning] = useState(false);

  const logout = () => {
    document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem("token");
    sessionStorage.clear();
    router.push("/login?reason=timeout");
  };

  const reset = () => {
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (warnTimer.current)   clearTimeout(warnTimer.current);
    setWarning(false);
    warnTimer.current  = setTimeout(() => setWarning(true), WARNING_MS);
    logoutTimer.current = setTimeout(logout, TIMEOUT_MS);
  };

  useEffect(() => {
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
      if (warnTimer.current)   clearTimeout(warnTimer.current);
    };
  }, []);

  return { warning, extendSession: reset };
}