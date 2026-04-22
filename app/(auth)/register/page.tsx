"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowLeft } from "lucide-react";

function RegField({ label, type = "text", placeholder, required = false, value, onChange, hint }: {
  label: string; type?: string; placeholder?: string; required?: boolean;
  value: string; onChange: (v: string) => void; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    company_name: "", slug: "", peppol_id: "",
    name: "", email: "", password: "", confirm_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (field: string, value: string) => {
    setForm(f => {
      const updated = { ...f, [field]: value };
      // Auto-generate slug from company_name
      if (field === "company_name") {
        updated.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) { setError("Passwords do not match"); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true); setError("");
    try {
      const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";
      const res = await fetch(`${BASE}/auth/register-tenant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: form.company_name,
          slug: form.slug,
          peppol_id: form.peppol_id || "",
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (res.ok && data.created) {
        setSuccess(true);
      } else {
        setError(data.detail || data.error || JSON.stringify(data));
      }
    } catch { setError("Connection error — please try again"); }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Account Created!</h2>
          <p className="text-sm text-gray-500 mb-6">Your tenant account has been created. You can now sign in.</p>
          <button onClick={() => router.push("/login")}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700">
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-sm text-gray-500 mt-1">KASA Advisory Peppol Portal · UAE PINT-AE</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-3">

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Company Info</p>
            <RegField label="Company Name" value={form.company_name} onChange={v => set("company_name", v)}
              placeholder="ACME Trading LLC" required />
            <RegField label="Slug (URL identifier)" value={form.slug} onChange={v => set("slug", v)}
              placeholder="acme-trading-llc" required hint="Auto-generated from company name, letters/numbers/hyphens only" />
            <RegField label="Peppol ID" value={form.peppol_id} onChange={v => set("peppol_id", v)}
              placeholder="0235:100123456700003" hint="Optional — e.g. 0235:TRN" />

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Admin Account</p>
            <RegField label="Your Name" value={form.name} onChange={v => set("name", v)}
              placeholder="John Smith" required />
            <RegField label="Email" type="email" value={form.email} onChange={v => set("email", v)}
              placeholder="admin@company.com" required />
            <div className="grid grid-cols-2 gap-3">
              <RegField label="Password" type="password" value={form.password} onChange={v => set("password", v)}
                placeholder="••••••••" required />
              <RegField label="Confirm Password" type="password" value={form.confirm_password}
                onChange={v => set("confirm_password", v)} placeholder="••••••••" required />
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>

        <div className="text-center mt-4">
          <button onClick={() => router.push("/login")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mx-auto">
            <ArrowLeft size={14} /> Back to login
          </button>
        </div>
      </div>
      <p className="fixed bottom-0 p-2 bg-red-200 text-xs w-full text-center">"This is a demonstration system. Data shown is for illustrative purposes only and does not represent real transactions."</p>
    </div>
  );
}
