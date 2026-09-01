// app/register/RegisterClient.tsx
//
// Client component. Knows nothing about the authcode — it reads the journey
// context from /fta/session (resolved by the httpOnly cookie) and sends no
// authcode in any request.
//
// Failure states cover the FTA UAT evidence template requirements:
// service unavailable, timeout, Peppol failure, expired link, already used,
// already linked, and validation errors, each stating whether the
// taxpayer's status changed.

"use client";

import { useState, useEffect } from "react";
import {
  Shield, CheckCircle, AlertCircle, AlertTriangle, Building2,
  Mail, Phone, Hash, Loader2, RefreshCw,
} from "lucide-react";

type Stage = "loading" | "form" | "details" | "success" | "dead";
type Action = 1 | 2 | 3;

interface EntityData {
  TIN: string; email: string; mobile: string;
  entityNameEn: string; entityNameAr: string; vatTrn: string;
  effectiveDate: string; legalType: string;
  verificationStatus: string; msgDesc: string;
}

interface SessionCtx {
  journey: "onboard" | "reverify" | "offboard";
  tin: string | null;
  requiresAction: boolean;
  mode: "stub" | "live";
}

interface ApiError {
  error?: string; code?: string; retryable?: boolean;
  reference_id?: string; stage?: string; field?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

const isValidTIN = (v: string) => /^\d{10}$/.test(v.trim());
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

function ReadField({ label, value, icon: Icon }:
  { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
        {Icon && <Icon size={14} className="text-gray-400 shrink-0" />}
        <span className="text-sm text-gray-700 font-medium">{value || "—"}</span>
      </div>
    </div>
  );
}

/** Error banner. Retryable failures get a retry affordance; terminal ones don't. */
function ErrorBanner({ err, onRetry }: { err: ApiError; onRetry?: () => void }) {
  const retryable = err.retryable === true;
  return (
    <div className={`flex items-start gap-2 p-3 rounded-xl border ${
      retryable ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
      {retryable
        ? <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
        : <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className={`text-sm ${retryable ? "text-amber-800" : "text-red-600"}`}>
          {err.error || "Something went wrong."}
        </p>
        {err.reference_id && (
          <p className="text-[11px] text-gray-400 mt-1 font-mono break-all">
            Reference: {err.reference_id}
          </p>
        )}
        {retryable && onRetry && (
          <button onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 hover:text-amber-900">
            <RefreshCw size={12} /> Try again
          </button>
        )}
      </div>
    </div>
  );
}

export default function RegisterClient() {
  const [stage, setStage] = useState<Stage>("loading");
  const [session, setSession] = useState<SessionCtx | null>(null);
  const [action, setAction] = useState<Action>(1);
  const [email, setEmail] = useState("");
  const [tin, setTin] = useState("");
  const [mobile, setMobile] = useState("");
  const [countryCode, setCountryCode] = useState("+971");
  const [entityData, setEntityData] = useState<EntityData | null>(null);
  const [reason, setReason] = useState("");
  const [declared, setDeclared] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<ApiError | null>(null);
  const [deadMsg, setDeadMsg] = useState("");

  // ---- load journey context from the cookie ------------------------------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/fta/session`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) {
          setDeadMsg(data.error || "Your session has expired. Please start again from EmaraTax.");
          setStage("dead");
          return;
        }
        setSession(data);
        if (data.tin) { setTin(data.tin); setAction(2); }
        setStage("form");
      } catch {
        setDeadMsg("We could not reach our service. Please try again shortly.");
        setStage("dead");
      }
    })();
  }, []);

  const isOnboarding = !session?.requiresAction;
  const canVerify = isValidEmail(email) && (isOnboarding ? isValidTIN(tin) : true);

  // ---- step 1: verify ----------------------------------------------------
  const doVerify = async () => {
    setLoading(true); setErr(null);
    try {
      const res = await fetch(`${API}/fta/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tin: isOnboarding ? tin.trim() : session?.tin,
          email: email.trim(),
          mobile: mobile ? `${countryCode}${mobile}` : "",
          action,   // no authcode: the backend resolves it from the cookie
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "EXPIRED" || data.code === "NO_SESSION") {
          setDeadMsg(data.error); setStage("dead"); return;
        }
        setErr(data);
      } else {
        setEntityData(data);
        setStage("details");
      }
    } catch {
      setErr({ error: "We could not reach our service. Your request has not been submitted.", retryable: true });
    }
    setLoading(false);
  };

  // ---- step 2: submit ----------------------------------------------------
  const doSubmit = async () => {
    if (!entityData) return;
    if (!isOnboarding && !reason.trim()) {
      setErr({ error: "Please enter a reason.", field: "reason" }); return;
    }
    setLoading(true); setErr(null);
    try {
      const res = await fetch(`${API}/fta/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tin: entityData.TIN,
          action,
          reason: reason.trim() || (action === 3 ? "Delinking"
                  : action === 2 ? "Reverification" : "New onboarding"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "EXPIRED" || data.code === "NO_SESSION") {
          setDeadMsg(data.error); setStage("dead"); return;
        }
        setErr(data);
      } else {
        setStage("success");
      }
    } catch {
      setErr({ error: "We could not reach our service. Your linkage status is unchanged.", retryable: true });
    }
    setLoading(false);
  };

  const actionLabel = action === 3 ? "Delink" : action === 2 ? "Reverify" : "Onboard";
  const btnCls = action === 3
    ? "bg-red-600 hover:bg-red-700"
    : "bg-[#7E01ED] hover:bg-[#6501C2]";

  // ---- loading -----------------------------------------------------------
  if (stage === "loading") {
    return (
      <Shell>
        <div className="text-center py-10">
          <Loader2 size={28} className="animate-spin text-[#7E01ED] mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading your request…</p>
        </div>
      </Shell>
    );
  }

  // ---- terminal (expired / used / unreachable) ---------------------------
  if (stage === "dead") {
    return (
      <Shell title="Request cannot continue">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
          <AlertCircle size={28} className="text-red-500 mx-auto mb-3" />
          <p className="text-sm text-gray-700">{deadMsg}</p>
          <p className="text-xs text-gray-400 mt-3">
            No changes have been made to your registration.
          </p>
        </div>
      </Shell>
    );
  }

  // ---- success -----------------------------------------------------------
  if (stage === "success") {
    const msg = {
      1: "Your e-invoicing registration has been successfully linked to KASA Advisory.",
      2: "Your e-invoicing registration has been successfully reverified.",
      3: "Your e-invoicing registration has been successfully removed from KASA Advisory.",
    }[action];
    return (
      <Shell>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            action === 3 ? "bg-gray-100" : "bg-green-100"}`}>
            <CheckCircle size={28} className={action === 3 ? "text-gray-500" : "text-green-600"} />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {action === 3 ? "Delinked Successfully"
              : action === 2 ? "Reverified Successfully" : "Onboarded Successfully"}
          </h2>
          <p className="text-sm text-gray-500 mb-6">{msg}</p>
          <p className="text-xs text-gray-400">
            You may now close this window and return to EmaraTax.
          </p>
        </div>
      </Shell>
    );
  }

  // ---- details -----------------------------------------------------------
  if (stage === "details" && entityData) {
    return (
      <Shell title="Confirm Your Details" sub="Please review the information below">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Applicant Details</p>
          <ReadField label="Registered Email" value={entityData.email} icon={Mail} />
          <ReadField label="TIN (Tax Identifier)" value={entityData.TIN} icon={Hash} />
          {entityData.mobile && <ReadField label="Mobile" value={entityData.mobile} icon={Phone} />}

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Entity Details</p>
          {entityData.legalType && <ReadField label="Legal Type" value={entityData.legalType} icon={Building2} />}
          <ReadField label="Entity Legal Name (EN)" value={entityData.entityNameEn} icon={Building2} />
          {entityData.entityNameAr && <ReadField label="Entity Legal Name (AR)" value={entityData.entityNameAr} />}
          <ReadField label="VAT TRN" value={entityData.vatTrn} icon={Hash} />
          <ReadField label="Effective Date of Registration" value={entityData.effectiveDate} />
          <ReadField label="Date of Submission" value={new Date().toISOString().split("T")[0]} />

          {!isOnboarding && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <input type="text" value={reason} maxLength={255}
                onChange={e => setReason(e.target.value)}
                placeholder={action === 3 ? "Reason for delinking" : "Reason for reverification"}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7E01ED]" />
            </div>
          )}

          <label className="flex items-start gap-3 pt-2 cursor-pointer">
            <input type="checkbox" checked={declared}
              onChange={e => setDeclared(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#7E01ED] focus:ring-[#7E01ED]" />
            <span className="text-xs text-gray-600 leading-relaxed">
              I declare that all information provided is true, accurate and complete
              to the best of my knowledge and belief.
            </span>
          </label>

          {err && <ErrorBanner err={err} onRetry={() => doSubmit()} />}

          <div className="flex gap-3 pt-1">
            <button onClick={() => { setStage("form"); setErr(null); }}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50">
              Back
            </button>
            <button onClick={doSubmit} disabled={!declared || loading}
              className={`flex-1 py-2.5 text-white rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${btnCls}`}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
                       : `Submit & ${actionLabel}`}
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // ---- form --------------------------------------------------------------
  return (
    <Shell
      title={isOnboarding ? "Linking Request" : "Reverifying / Delinking Request"}
      sub="KASA Advisory · UAE PINT-AE e-invoicing"
      testMode={session?.mode === "stub"}
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
        {!isOnboarding && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Select Action <span className="text-red-500">*</span>
            </p>
            <div className="flex gap-3">
              {[{ value: 2 as Action, label: "Reverify" },
                { value: 3 as Action, label: "Delinking" }].map(opt => (
                <label key={opt.value}
                  className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer ${
                    action === opt.value
                      ? "border-[#7E01ED] bg-[#F6EDFE]"
                      : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" name="action" value={opt.value}
                    checked={action === opt.value}
                    onChange={() => setAction(opt.value)}
                    className="accent-[#7E01ED]" />
                  <span className={`text-sm font-medium ${
                    action === opt.value ? "text-[#4A0A8C]" : "text-gray-600"}`}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Applicant Details</p>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Registered EmaraTax E-mail Address <span className="text-red-500">*</span>
          </label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="admin@yourcompany.com"
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
              email && !isValidEmail(email)
                ? "border-red-300 bg-red-50 focus:ring-red-500"
                : "border-gray-200 focus:ring-[#7E01ED]"}`} />
          {email && !isValidEmail(email) && (
            <p className="text-xs text-red-500 mt-0.5">Enter a valid e-mail address</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            TIN (Tax Identifier Number){isOnboarding && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <input type="text" value={tin} maxLength={10} inputMode="numeric"
            onChange={e => isOnboarding && setTin(e.target.value.replace(/\D/g, ""))}
            readOnly={!isOnboarding} placeholder="1000000000"
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none ${
              !isOnboarding ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
                : tin && !isValidTIN(tin)
                  ? "border-red-300 bg-red-50 focus:ring-2 focus:ring-red-500"
                  : "border-gray-200 focus:ring-2 focus:ring-[#7E01ED]"}`} />
          {isOnboarding && tin && !isValidTIN(tin) && (
            <p className="text-xs text-red-500 mt-0.5">TIN must be exactly 10 digits</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Registered Mobile Number (Optional)
          </label>
          <div className="flex gap-2">
            <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
              className="px-2 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#7E01ED]">
              <option value="+971">🇦🇪 +971</option>
              <option value="+966">🇸🇦 +966</option>
              <option value="+974">🇶🇦 +974</option>
              <option value="+965">🇰🇼 +965</option>
              <option value="+91">🇮🇳 +91</option>
              <option value="+92">🇵🇰 +92</option>
              <option value="+44">🇬🇧 +44</option>
              <option value="+1">🇺🇸 +1</option>
            </select>
            <input type="tel" value={mobile}
              onChange={e => setMobile(e.target.value)} placeholder="50 123 4567"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7E01ED]" />
          </div>
        </div>

        {err && <ErrorBanner err={err} onRetry={() => doVerify()} />}

        <button onClick={doVerify} disabled={!canVerify || loading}
          className="w-full py-2.5 bg-[#7E01ED] hover:bg-[#6501C2] text-white rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying…</>
                   : "Verify Applicant Details"}
        </button>
      </div>
    </Shell>
  );
}

function Shell({ children, title, sub, testMode }: {
  children: React.ReactNode; title?: string; sub?: string; testMode?: boolean;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#7E01ED] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield size={28} className="text-white" />
          </div>
          {title && <h1 className="text-xl font-bold text-gray-900">{title}</h1>}
          {sub && <p className="text-sm text-gray-500 mt-1">{sub}</p>}
          {testMode && (
            <span className="inline-block mt-2 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold tracking-wider">
              TEST MODE — NOT SUBMITTED TO FTA
            </span>
          )}
        </div>
        {children}
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
          <Shield size={12} />
          <span>Secured by UAE Federal Tax Authority · PINT-AE compliant</span>
        </div>
      </div>
    </div>
  );
}