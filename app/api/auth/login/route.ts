import { SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
// /Users/macbook/Documents/Next Projects/peppol-portal/app/api/auth/login/route.ts
const API = process.env.API_URL || "https://api.kasaadvisory.com";
const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "peppol-nextauth-secret-2026-local"  // ← match Vercel
);

export async function POST(req: NextRequest) {
  try {
    const { email, password, totp } = await req.json();

    // Call backend login
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const data = await res.json();
    const user = data.user || data;

    // If MFA required but no totp provided
    if (user.totp_enabled && !totp) {
      return NextResponse.json({ mfa_required: true });
    }

    // If MFA required and totp provided - validate it
    if (user.totp_enabled && totp) {
      const mfa = await fetch(`${API}/auth/mfa/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: totp }),
      }).then(r => r.json());

      if (!mfa.valid) {
        return NextResponse.json({ error: "Invalid MFA code" }, { status: 401 });
      }
    }

    // Create JWT
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenant_id: user.tenant_id,
      tenant_name: user.tenant_name,
      totp_enabled: user.totp_enabled ?? false,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(SECRET);

    const response = NextResponse.json({ ok: true, user });
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      domain: ".kasaadvisory.com",
    });
    return response;
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
