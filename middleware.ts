// middleware.ts  — project root, beside package.json (NOT inside app/)
//
// Intercepts the FTA redirect before any page renders.
//
//   FTA  ->  /register?authcode=...&TIN=...
//   here ->  exchange the code with our backend, set an httpOnly cookie,
//            307-redirect to a clean /register
//
// Middleware is the correct place for this: unlike a page component it may
// both set cookies and redirect. The authcode never reaches client-side
// JavaScript, never lands in browser history, and is never sent in a
// request body.

import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";
const COOKIE_MAX_AGE = 900; // 15 minutes, matching the backend session TTL

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;

  const authcode = (
    url.searchParams.get("authcode") ||
    url.searchParams.get("authCode") ||
    url.searchParams.get("AUTHCODE") ||
    ""
  ).trim();

  // Nothing to do: either already exchanged, or opened directly.
  if (!authcode) return NextResponse.next();

  const tin = (
    url.searchParams.get("TIN") || url.searchParams.get("tin") || ""
  ).trim();

  const clean = new URL("/register", url.origin);
  let ref: string | null = null;

  try {
    const res = await fetch(`${API}/fta/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authcode, tin: tin || undefined }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok && data?.ref) {
      ref = data.ref;
    } else {
      // Expired, already used, or malformed. The page renders the reason.
      clean.searchParams.set("status", data?.code || "invalid");
    }
  } catch {
    clean.searchParams.set("status", "unavailable");
  }

  // 307 replaces the history entry rather than adding one, so the URL
  // containing the authcode is not left in the back stack.
  const response = NextResponse.redirect(clean, 307);

  if (ref) {
    response.cookies.set("asp_ref", ref, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
      // Shared parent domain so api.kasaadvisory.com receives it too.
      domain: ".kasaadvisory.com",
    });
  }

  // Belt and braces: this response must never be cached or referred onward.
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  response.headers.set("Referrer-Policy", "no-referrer");

  return response;
}

// Only /register. Route groups such as app/(auth)/register do not appear in
// the URL, so the plain path is correct.
export const config = {
  matcher: "/register",
};