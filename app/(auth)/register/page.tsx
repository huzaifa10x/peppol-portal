// app/register/page.tsx
//
// Server component. Runs on Vercel's server, never in the browser.
//
// FTA redirects the taxpayer to /register?authcode=...&TIN=...
// This component takes the authcode server-side, exchanges it with our
// backend for an opaque reference held in an httpOnly cookie, then issues
// a 307 redirect to a clean /register with no query string.
//
// The result: the authcode never reaches client-side JavaScript, never
// appears in the address bar after the redirect, is not written to browser
// history, and is not leaked in Referer headers to any third party.
//
// Referrer-Policy is set to no-referrer for this route in next.config.js
// (see the accompanying snippet) so the FIRST request — the one that still
// carries the code in its URL — cannot leak it onward either.

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import RegisterClient from "./RegisterClient";

export const dynamic = "force-dynamic";   // never cache a page tied to a session
export const revalidate = 0;

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

type SearchParams = Promise<{ [k: string]: string | string[] | undefined }>;

function first(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const authcode = first(sp.authcode || sp.authCode || sp.AUTHCODE).trim();
  const tin = first(sp.TIN || sp.tin).trim();

  // No authcode in the URL — either we have already exchanged it (cookie
  // present) or the page was opened directly.
  if (!authcode) {
    return <RegisterClient />;
  }

  // Exchange it server-side. The browser never sees this request.
  let setCookieHeader: string | null = null;
  let failure: string | null = null;

  try {
    const res = await fetch(`${API}/fta/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authcode, tin: tin || undefined }),
      cache: "no-store",
    });

    setCookieHeader = res.headers.get("set-cookie");
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      failure = data?.error || "This link could not be validated.";
    }
  } catch {
    failure = "We could not reach our service. Please try again shortly.";
  }

  // Mirror the backend cookie onto this response so it survives the redirect.
  if (setCookieHeader) {
    const jar = await cookies();
    const refMatch = setCookieHeader.match(/asp_ref=([^;]+)/);
    if (refMatch) {
      jar.set("asp_ref", refMatch[1], {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 900,
        path: "/",
        domain: ".kasaadvisory.com",
      });
    }
  }

  // Clean URL. The authcode is gone from the address bar and from history:
  // a 307 replaces the entry rather than adding one.
  redirect(failure ? `/register?status=invalid` : "/register");
}