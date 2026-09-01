// app/(auth)/register/page.tsx
//
// By the time this renders, middleware.ts has already taken the authcode
// out of the URL and put it in an httpOnly cookie. There is nothing left
// to do here but render.
//
// A ?status= parameter may be present when the exchange failed — the client
// component reads it to show the right message.

import { Suspense } from "react";
import { Shield } from "lucide-react";
import RegisterClient from "./RegisterClient";

export const dynamic = "force-dynamic";  // never cache a session-bound page
export const revalidate = 0;

function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 bg-[#7E01ED] rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Shield size={28} className="text-white" />
        </div>
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RegisterClient />
    </Suspense>
  );
}