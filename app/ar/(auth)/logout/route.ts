export const runtime = "edge";
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("session", "", {
    maxAge: 0,
    path: "/",
    secure: true,
    sameSite: "none",
    domain: ".kasaadvisory.com",
  });
  return response;
}
