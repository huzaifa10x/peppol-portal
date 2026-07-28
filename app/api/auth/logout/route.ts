// app/api/auth/logout/route.ts — full corrected file
import { NextResponse } from "next/server";

export const runtime = "edge";

const isProd = process.env.NEXTAUTH_URL?.includes("kasaadvisory.com") ?? false;

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("session", "", {
    maxAge:   0,
    path:     "/",
    secure:   isProd,
    sameSite: isProd ? "none" : "lax",
    ...(isProd && { domain: ".kasaadvisory.com" }),
  });
  return response;
}