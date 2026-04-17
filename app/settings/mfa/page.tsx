"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Shield, CheckCircle, Smartphone, Copy, AlertTriangle } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

export default function MFASetupPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const userEmail = session?.user?.email;

  const [status, setStatus]     = useState<any>(null);
  const [setup, setSetup]       = useState<any>(null);
  const [code, setCode]         = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [copied, setCopied]     = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetch(`${BASE}/auth/mfa/status/${userId}`)
      .then(r => r.json())
      .then(setStatus)
      .catch(() => {});
  }, [userId]);

  const startSetup = async () => {
    setLoading(true);
    const r = await fetch(`${BASE}/auth/mfa/setup`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ user_id: userId, email: userEmail }),
    }).then(r => r.json());
    setSetup(r);
    setLoading(false);
  };

  const verifySetup = async () => {
    setLoading(true);
    const r = await fetch(`${BASE}/auth/mfa/verify-setup`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ user_id: userId, email: userEmail, code }),
    }).then(r => r.json());
    if (r.verified) {
      setVerified(true);
      setStatus({ totp_enabled: true, totp_verified: true });
    }
    setLoading(false);
  };

  const disableMFA = async () => {
    if (!confirm("Disable MFA? This reduces account security.")) return;
    await fetch(`${BASE}/auth/mfa/disable`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ user_id: userId, email: userEmail }),
    });
    setStatus({ totp_enabled: false });
    setSetup(null);
    setVerified(false);
  };

  const copySecret = () => {
    navigator.clipboard.writeText(setup?.secret ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Two-Factor Authentication
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Protect your account with an authenticator app
      </p>

      {/* Current status */}
      <div className={`rounded-xl border p-5 mb-6 flex items-center gap-4 ${
        status?.totp_enabled
          ? "bg-green-50 border-green-200"
          : "bg-gray-50 border-gray-200"
      }`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          status?.totp_enabled ? "bg-green-100" : "bg-gray-100"
        }`}>
          <Shield size={18} className={status?.totp_enabled ? "text-green-600" : "text-gray-400"} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-800">
            {status?.totp_enabled ? "MFA is Enabled" : "MFA is Disabled"}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {status?.totp_enabled
              ? "Your account is protected with TOTP authentication"
              : "Enable MFA to secure your account"
            }
          </div>
        </div>
        {status?.totp_enabled && (
          <button onClick={disableMFA}
            className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
            Disable
          </button>
        )}
      </div>

      {/* Setup flow */}
      {!status?.totp_enabled && !setup && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-2">
            Set Up Authenticator App
          </h2>
          <p className="text-xs text-gray-500 mb-5">
            You'll need Microsoft Authenticator, Google Authenticator, or any
            TOTP-compatible app installed on your phone.
          </p>
          <div className="flex gap-3 mb-5">
            {[
              "Microsoft Authenticator",
              "Google Authenticator",
              "Authy",
            ].map(app => (
              <span key={app}
                className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                {app}
              </span>
            ))}
          </div>
          <button onClick={startSetup} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            <Smartphone size={14}/>
            {loading ? "Generating..." : "Set Up MFA"}
          </button>
        </div>
      )}

      {/* QR / Secret display */}
      {setup && !verified && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-800 mb-1">
              Step 1 — Scan QR Code or Enter Secret
            </h2>
            <p className="text-xs text-gray-500">
              Open your authenticator app and scan the QR code, or manually
              enter the secret key below.
            </p>
          </div>

          {/* QR code via Google Charts API */}
          <div className="flex justify-center">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setup.uri)}`}
              alt="QR Code"
              className="w-48 h-48 rounded-xl border border-gray-200"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Manual Entry Key
            </label>
            <div className="flex gap-2">
              <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono tracking-wider text-gray-700">
                {setup.secret}
              </code>
              <button onClick={copySecret}
                className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200">
                {copied ? <CheckCircle size={14} className="text-green-500"/> : <Copy size={14} className="text-gray-400"/>}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">
              Step 2 — Verify Setup
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Enter the 6-digit code from your authenticator app to confirm it's working.
            </p>
            <div className="flex gap-3">
              <input type="text" value={code} maxLength={6}
                onChange={e => setCode(e.target.value.replace(/\D/g,"").slice(0,6))}
                placeholder="000000"
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-xl font-mono text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={verifySetup} disabled={loading || code.length !== 6}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {loading ? "Verifying..." : "Verify"}
              </button>
            </div>
          </div>

          {/* Backup codes */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-amber-600"/>
              <span className="text-xs font-semibold text-amber-700">
                Save These Backup Codes
              </span>
            </div>
            <p className="text-xs text-amber-600 mb-2">
              If you lose your phone, use these codes to regain access. Each can only be used once.
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {setup.backup?.map((code: string, i: number) => (
                <code key={i} className="text-xs font-mono bg-white px-2 py-1 rounded border border-amber-200 text-center">
                  {code}
                </code>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {(verified || status?.totp_enabled) && setup && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600 shrink-0"/>
          <div>
            <div className="text-sm font-semibold text-green-800">
              MFA Successfully Enabled
            </div>
            <div className="text-xs text-green-600 mt-0.5">
              Your account now requires an authenticator code on every login.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
