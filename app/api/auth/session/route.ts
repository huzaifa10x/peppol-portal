import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
// /Users/macbook/Documents/Next Projects/peppol-portal/app/api/auth/session/route.ts
export const runtime = "edge";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "peppol-nextauth-secret-2026-local"  // ← match Vercel
);

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("session")?.value;
    if (!token) return NextResponse.json({ user: null });
    const { payload } = await jwtVerify(token, SECRET);
    return NextResponse.json({ user: payload });
  } catch {
    return NextResponse.json({ user: null });
  }
}
