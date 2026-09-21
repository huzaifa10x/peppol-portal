// /Users/macbook/Documents/Next Projects/peppol-portal/proxy.ts
//
// Next.js 16 replaced middleware.ts with proxy.ts. This file does two jobs:
//
//   1. FTA authcode exchange for /register and /ar/register.
//      The redirect arrives as /register?authcode=...&TIN=... — we hand the
//      code to the backend, receive an opaque reference, store it in an
//      httpOnly cookie and redirect to a clean URL. The authcode therefore
//      never reaches client-side JavaScript, never enters browser history,
//      and is never sent in a request body.
//
//   2. Session auth for every other route (unchanged).

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";
const ASP_COOKIE_MAX_AGE = 900; // 15 min, matching the backend session TTL

// Routes that begin an FTA journey.
const REGISTER_PATHS = ["/register", "/ar/register"];

const PUBLIC_PATHS = [
  "/login",
  "/onboard",
  "/register",
  "/ar/register",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/session",
];

// --------------------------------------------------------------------------
// FTA authcode exchange
// --------------------------------------------------------------------------
async function handleFtaRedirect(req: NextRequest, basePath: string) {
  const url = req.nextUrl;

  const authcode = (
    url.searchParams.get("authcode") ||
    url.searchParams.get("authCode") ||
    url.searchParams.get("AUTHCODE") ||
    ""
  ).trim();

  // No code in the URL: already exchanged, or opened directly.
  if (!authcode) return null;

  const tin = (
    url.searchParams.get("TIN") || url.searchParams.get("tin") || ""
  ).trim();

  const clean = new URL(basePath, url.origin);
  let ref: string | null = null;

  try {
    const res = await fetch(`${API}/fta/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authcode, tin: tin || undefined }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({} as any));

    if (res.ok && data?.ref) {
      ref = data.ref;
    } else {
      clean.searchParams.set("status", data?.code || "invalid");
    }
  } catch {
    clean.searchParams.set("status", "unavailable");
  }

  // uncoment it to hide auth code from url
  const response = NextResponse.redirect(clean, 307);
  // const response = NextResponse.next();

  if (ref) {
    response.cookies.set("asp_ref", ref, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: ASP_COOKIE_MAX_AGE,
      path: "/",
      // Shared parent domain so api.kasaadvisory.com receives it too.
      // Comment this line out for local development on localhost.
      domain: ".kasaadvisory.com",
    });
  }

  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

// --------------------------------------------------------------------------
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- 1. FTA journeys: strip the authcode before anything else ----------
  const registerBase = REGISTER_PATHS.find((p) => pathname === p);
  if (registerBase) {
    const redirected = await handleFtaRedirect(req, registerBase);
    if (redirected) return redirected;
  }

  // --- 2. Public paths ---------------------------------------------------
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // --- 3. Next.js internals and static assets ----------------------------
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // --- 4. Everything else needs a valid session --------------------------
  const token = req.cookies.get("session")?.value;

  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || "peppol-nextauth-secret-2026-local"
    );
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("from", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("session");
    return response;
  }
}