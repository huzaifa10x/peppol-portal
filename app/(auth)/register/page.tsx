"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ArrowLeft } from "lucide-react";

function RegField({
  label,
  type = "text",
  placeholder,
  required = false,
  value,
  onChange,
  hint,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">
        {label}
        {required && <span className="text-rose-600 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3.5 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C01ED] focus:border-transparent bg-white shadow-2xs transition-all placeholder:text-gray-400"
      />
      {hint && <p className="text-[11px] text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    company_name: "",
    slug: "",
    peppol_id: "",
    name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (field: string, value: string) => {
    setForm((f) => {
      const updated = { ...f, [field]: value };
      // Auto-generate slug from company_name
      if (field === "company_name") {
        updated.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    setError("");
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
    } catch {
      setError("Connection error — please try again");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-gray-900">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xs border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-700">
            <CheckCircle2 size={28} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Account Created!</h2>
          <p className="text-xs text-gray-600 mb-6">
            Your tenant account has been created. You can now sign in to your dashboard.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full py-2.5 bg-[#7C01ED] hover:bg-[#6800CB] text-white rounded-lg font-semibold text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7C01ED]/50"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between p-4 sm:p-6 text-gray-900">
      <div className="flex-1 flex flex-col items-center justify-center my-8">
        <div className="w-full max-w-md">
          {/* Logo & Header */}
          <div className="text-center mb-6 flex flex-col items-center">
            <div className="mb-4">
              <Image
                alt="KASA Advisory Logo"
                width={180}
                height={40}
                priority
                className="h-10 w-auto object-contain"
                src="/kasa-logo.png"
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Create Account</h1>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              KASA Advisory Peppol Portal · UAE PINT-AE
            </p>
          </div>

          {/* Registration Form Card */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-[11px] font-bold text-[#7C01ED] uppercase tracking-wider">
                Company Details
              </p>

              <RegField
                label="Company Name"
                value={form.company_name}
                onChange={(v) => set("company_name", v)}
                placeholder="ACME Trading LLC"
                required
              />

              <RegField
                label="Slug (URL Identifier)"
                value={form.slug}
                onChange={(v) => set("slug", v)}
                placeholder="acme-trading-llc"
                required
                hint="Auto-generated: letters, numbers, and hyphens only"
              />

              <RegField
                label="Peppol ID"
                value={form.peppol_id}
                onChange={(v) => set("peppol_id", v)}
                placeholder="0235:100123456700003"
                hint="Optional — e.g. 0235:TRN"
              />

              <p className="text-[11px] font-bold text-[#7C01ED] uppercase tracking-wider pt-2">
                Administrator Account
              </p>

              <RegField
                label="Your Name"
                value={form.name}
                onChange={(v) => set("name", v)}
                placeholder="John Smith"
                required
              />

              <RegField
                label="Email Address"
                type="email"
                value={form.email}
                onChange={(v) => set("email", v)}
                placeholder="admin@company.com"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <RegField
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={(v) => set("password", v)}
                  placeholder="••••••••"
                  required
                />
                <RegField
                  label="Confirm"
                  type="password"
                  value={form.confirm_password}
                  onChange={(v) => set("confirm_password", v)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#7C01ED] hover:bg-[#6800CB] text-white rounded-lg font-semibold text-sm disabled:opacity-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7C01ED]/50 mt-2"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          </div>

          {/* Navigation link */}
          <div className="text-center mt-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={14} /> Back to login
            </Link>
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