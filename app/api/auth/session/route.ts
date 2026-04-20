import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "peppol-nextauth-secret-2026"
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
