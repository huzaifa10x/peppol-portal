// app/api/tenant/stats/route.ts — NEW FILE
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const API = process.env.API_URL || "https://api.kasaadvisory.com";
const SECRET = new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || "peppol-nextauth-secret-2026-local"  // ← match Vercel
);

export async function GET(req: NextRequest) {
    const sessionToken = req.cookies.get("session")?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        await jwtVerify(sessionToken, SECRET);
    } catch {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Forward to backend with internal key
    const url = new URL(req.url);
    const res = await fetch(`${API}/tenant/stats${url.search}`, {
        headers: {
            "X-Internal-Key": "kasa-internal-2026-secure",
            "Cookie": `session=${sessionToken}`,
        },
    });
    const data = await res.json();
    return NextResponse.json(data);
}