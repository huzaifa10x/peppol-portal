"use client";
import { useState, useEffect } from "react";
import { useSession } from "@/lib/session";
import { Bell, Mail, CheckCircle, Send, Shield } from "lucide-react";
import Link from "next/link";

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const tenantId = (session?.user as any)?.tenant_id ?? "";
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    fetch(`${BASE}/email/preferences/${tenantId}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { setEmail(d.notification_email ?? ""); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tenantId]);

  const save = async () => {
    await fetch(`${BASE}/email/preferences/${tenantId}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notification_email: email }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const sendTest = async () => {
    setTesting(true); setTestResult(null);
    const r = await fetch(`${BASE}/email/test`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: email }),
    }).then(r => r.json()).catch(() => null);
    setTestResult(r?.sent ?? false);
    setTesting(false);
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-8">Notification preferences and account settings</p>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
            <Mail size={16} className="text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">Email Notifications</div>
            <div className="text-xs text-gray-400">Receive alerts for invoices, TDDs, and system events</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Notification Email Address
            </label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@kasaadvisory.com"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              You will receive emails for: send failures, new invoices received,
              TDD sent to UAE FTA, and system alerts.
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={save} disabled={!email || loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#7C01ED] text-white rounded-xl text-sm font-medium hover:bg-[#7C01ED] disabled:opacity-50">
              {saved
                ? <><CheckCircle size={14} /> Saved!</>
                : "Save Preferences"
              }
            </button>
            <button onClick={sendTest} disabled={!email || testing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              <Send size={14} className={testing ? "animate-pulse" : ""} />
              {testing ? "Sending..." : "Send Test Email"}
            </button>
          </div>

          {testResult !== null && (
            <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${testResult
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-600"
              }`}>
              {testResult
                ? <><CheckCircle size={14} /> Test email sent successfully — check your inbox</>
                : <>❌ Failed to send — check SMTP configuration</>
              }
            </div>
          )}
        </div>
      </div>

      {/* Notification types */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
            <Bell size={16} className="text-purple-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">Notification Types</div>
            <div className="text-xs text-gray-400">Events that trigger email alerts</div>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: "New Invoice Received", desc: "When a new PINT-AE invoice arrives via Peppol", on: true, color: "bg-blue-100 text-blue-700" },
            { label: "Invoice Send Failed", desc: "When an outbound invoice fails to deliver", on: true, color: "bg-red-100 text-red-700" },
            { label: "TDD Sent to UAE FTA", desc: "When a Tax Data Document is delivered to C5", on: true, color: "bg-purple-100 text-purple-700" },
            { label: "System Alert", desc: "When MLS watcher stops or container is unhealthy", on: true, color: "bg-amber-100 text-amber-700" },
          ].map(({ label, desc, on, color }) => (
            <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <div>
                <div className="text-sm font-medium text-gray-800">{label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
                {on ? "Active" : "Off"}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* MFA Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
              <Shield size={16} className="text-green-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800">Two-Factor Authentication</div>
              <div className="text-xs text-gray-400">Add an extra layer of security to your account</div>
            </div>
          </div>
          <Link href="/settings/mfa"
            className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-medium hover:bg-green-700">
            Configure MFA
          </Link>
        </div>
      </div>
    </div>
  );
}
