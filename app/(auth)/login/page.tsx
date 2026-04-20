"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, Smartphone } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp]         = useState("");
  const [showPass, setShowPass] = useState(false);
  const [step, setStep]         = useState<"credentials" | "mfa">("credentials");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
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
        router.refresh();
        router.push("/");
        return;
      }

      setError("Sign in failed — please try again");
    } catch { setError("Connection error"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Peppol Portal</h1>
          <p className="text-sm text-gray-500 mt-1">KASA Advisory Service FZE</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {step === "credentials" ? (
            <>
              <h2 className="text-lg font-semibold text-gray-800 mb-5">Sign in to your account</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required autoFocus placeholder="admin@kasaadvisory.com"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} value={password}
                      onChange={e => setPassword(e.target.value)} required placeholder="••••••••••"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 pr-10" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Smartphone size={18} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">Two-Factor Authentication</h2>
                  <p className="text-xs text-gray-400">Enter the code from your authenticator app</p>
                </div>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Authentication Code</label>
                  <input type="text" value={totp}
                    onChange={e => setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required autoFocus maxLength={6} placeholder="000000"
                    className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-2xl font-mono text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                  <p className="text-xs text-gray-400 mt-1.5 text-center">Open Microsoft Authenticator or Google Authenticator</p>
                </div>
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
                <button type="submit" disabled={loading || totp.length !== 6}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {loading ? "Verifying..." : "Verify & Sign in"}
                </button>
                <button type="button" onClick={() => { setStep("credentials"); setError(""); setTotp(""); }}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">← Back to login</button>
              </form>
            </>
          )}
        </div>
        <div className="text-center mt-4 space-y-1">
          <p className="text-xs text-gray-400">New client? <a href="/register" className="text-blue-600 hover:underline">Create account</a></p>
          <p className="text-xs text-gray-400">UAE PINT-AE · Seat PAE001045 · OpenPeppol Certified</p>
        </div>
      </div>
    </div>
  );
}
