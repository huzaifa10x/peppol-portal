"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Smartphone } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState<"credentials" | "mfa">("credentials");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, totp: step === "mfa" ? totp : "" }),
      });

      const data = await res.json();

      if (data.mfa_required) {
        setStep("mfa");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error || "Sign in failed");
        setLoading(false);
        return;
      }

      if (data.ok) {
        window.location.href = "/";
        return;
      }

      setError("Sign in failed — please try again");
    } catch {
      setError("Connection error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between p-4 sm:p-6 text-gray-900">
      <div className="flex-1 flex flex-col items-center justify-center my-8">
        <div className="w-full max-w-md">
          {/* Top Logo & Branding Header */}
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="mb-4">
              <Image
                alt="KASA Advisory Services"
                width={180}
                height={40}
                priority
                className="h-10 w-auto object-contain"
                src="/kasa-logo.png"
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">PEPPOL PORTAL</h1>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              KASA Advisory Service FZE · PAE001045
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 sm:p-8">
            {step === "credentials" ? (
              <>
                <div className="mb-6">
                  <h2 className="text-base font-bold text-gray-900">Sign in to your account</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Enter your KASA Advisory credentials</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      placeholder="admin@kasaadvisory.com"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7C01ED] focus:border-transparent bg-white shadow-xs transition-all placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••••••"
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7C01ED] focus:border-transparent bg-white shadow-xs pr-10 transition-all placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-[#7C01ED] hover:bg-[#6800CB] text-white rounded-lg font-semibold text-sm disabled:opacity-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7C01ED]/50"
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6 p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                  <div className="w-10 h-10 bg-[#7C01ED] rounded-lg flex items-center justify-center text-white shrink-0">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Two-Factor Authentication</h2>
                    <p className="text-xs text-gray-600">Enter code from authenticator app</p>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider text-center">
                      Authentication Code
                    </label>
                    <input
                      type="text"
                      value={totp}
                      onChange={(e) => setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      required
                      autoFocus
                      maxLength={6}
                      placeholder="000000"
                      className="w-full px-3.5 py-3 border border-gray-200 rounded-lg text-2xl font-mono text-center tracking-[0.5em] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7C01ED] focus:border-transparent bg-white shadow-xs"
                    />
                    <p className="text-[11px] text-gray-500 mt-2 text-center">
                      Use Microsoft Authenticator or Google Authenticator
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || totp.length !== 6}
                    className="w-full py-2.5 px-4 bg-[#7C01ED] hover:bg-[#6800CB] text-white rounded-lg font-semibold text-sm disabled:opacity-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7C01ED]/50"
                  >
                    {loading ? "Verifying..." : "Verify & Sign in"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep("credentials");
                      setError("");
                      setTotp("");
                    }}
                    className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    ← Back to login
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Registration & System Info */}
          <div className="text-center mt-6 space-y-2">
            <p className="text-xs text-gray-600">
              New client?{" "}
              <Link href="/register" className="text-[#7C01ED] font-semibold hover:underline">
                Create account
              </Link>
            </p>
            <p className="text-[11px] text-gray-500">
              UAE PINT-AE · Seat PAE001045 · OpenPeppol Certified
            </p>
          </div>
        </div>
      </div>

      {/* Clean Demo Disclaimer Banner */}
      <div className="max-w-md mx-auto w-full text-center">
        <p className="text-[11px] text-gray-500 bg-white border border-gray-200 py-2 px-4 rounded-lg shadow-2xs">
          <strong>Notice:</strong> Demonstration system. Data shown is for illustrative purposes only.
        </p>
      </div>
    </div>
  );
}