"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Shield, CheckCircle, AlertCircle, Building2,
  Mail, Phone, Hash, Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "form" | "details" | "success";
type Action = 1 | 2 | 3; // 1=onboard  2=reverify  3=offboard/delink

interface EntityData {
  TIN: string;
  email: string;
  mobile: string;
  entityNameEn: string;
  entityNameAr: string;
  vatTrn: string;
  effectiveDate: string;
  legalType: string;
  verificationStatus: string;
  msgDesc: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidTIN(v: string) { return /^1\d{9}$/.test(v.trim()); }
function isValidEmail(v: string) {
  if (!v.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

// ─── Read-only entity field ────────────────────────────────────────────────────

function ReadField({
  label, value, icon: Icon,
}: { label: string; value: string; icon?: React.ElementType }) {
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

// ─── Inner component (uses useSearchParams, must be inside Suspense) ──────────

function OnboardInner() {
  const searchParams = useSearchParams();

  // URL state
  const [authcode, setAuthcode] = useState("");
  const [tinFromUrl, setTinFromUrl] = useState(""); // non-empty = reverify/offboard mode

  // Form state
  const [action, setAction] = useState<Action>(1);
  const [stage, setStage] = useState<Stage>("form");
  const [email, setEmail] = useState("");
  const [tin, setTin] = useState("");
  const [mobile, setMobile] = useState("");
  const [countryCode, setCountryCode] = useState("+971");

  // Result state
  const [entityData, setEntityData] = useState<EntityData | null>(null);
  const [declared, setDeclared] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [authcodeValid, setAuthcodeValid] = useState<boolean | null>(null);

  // Replace the existing useEffect with this:
  useEffect(() => {
    const ac = searchParams.get("authcode") || "";
    const t = searchParams.get("TIN") || "";
    setAuthcode(ac);
    setTinFromUrl(t);
    if (t) { setTin(t); setAction(2); }
    if (ac || t) window.history.replaceState({}, "", "/onboard");

    // Validate authcode on load
    if (ac) {
      fetch(`${API}/fta/validate-authcode?authcode=${encodeURIComponent(ac)}`, { credentials: "include" })
        .then(r => r.json())
        .then(d => setAuthcodeValid(d.valid !== false))
        .catch(() => setAuthcodeValid(true)); // fail open on network error
    } else {
      setAuthcodeValid(true); // no authcode = reverify flow, allow
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const isOnboarding = !tinFromUrl;

  const canVerify =
    authcodeValid !== false &&
    (isOnboarding ? isValidTIN(tin) : true);

  // ── Step 1: Verify taxpayer via /fta/verify ───────────────────────────────
  const handleVerify = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/fta/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tin: isOnboarding ? tin.trim() : tinFromUrl,
          email: email.trim(),
          mobile: mobile ? `${countryCode}${mobile}` : "",
          authcode,
          action,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || data.error || "Verification failed. Please check your details.");
      } else {
        setEntityData(data);
        setStage("details");
      }
    } catch {
      setError("Connection error — please try again.");
    }
    setLoading(false);
  };

  // ── Step 2: Submit via /fta/register ─────────────────────────────────────
  const handleSubmit = async () => {
    if (!entityData) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/fta/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tin: entityData.TIN,
          email: entityData.email,
          mobile: entityData.mobile,
          authcode,
          entityNameEn: entityData.entityNameEn,
          entityNameAr: entityData.entityNameAr,
          vatTrn: entityData.vatTrn,
          effectiveDate: entityData.effectiveDate,
          legalType: entityData.legalType,
          action,
          reason:
            action === 3 ? "Taxpayer offboarding request"
              : action === 2 ? "Reverification request"
                : "New onboarding",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || data.error || "Registration failed. Please try again.");
      } else {
        setStage("success");
      }
    } catch {
      setError("Connection error — please try again.");
    }
    setLoading(false);
  };

  const actionLabel = action === 3 ? "Offboard" : action === 2 ? "Reverify" : "Onboard";
  const actionBtnCls =
    action === 3 ? "bg-red-600 hover:bg-red-700"
      : "bg-[#7C01ED] hover:bg-[#7C01ED]";

  // ────────────────────────────────────────────────────────────────────────────
  // SUCCESS
  // ────────────────────────────────────────────────────────────────────────────
  if (stage === "success") {
    const msg = {
      1: "Your e-invoicing registration has been successfully linked to KASA Advisory.",
      2: "Your e-invoicing registration has been successfully reverified.",
      3: "Your e-invoicing registration has been successfully removed from KASA Advisory.",
    }[action];
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {action === 3 ? "Offboarded Successfully"
              : action === 2 ? "Reverified Successfully"
                : "Onboarded Successfully"}
          </h2>
          <p className="text-sm text-gray-500 mb-6">{msg}</p>
          <p className="text-xs text-gray-400">
            You may now close this window and return to EmaraTax.
          </p>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // DETAILS — read-only entity data + declaration checkbox
  // ────────────────────────────────────────────────────────────────────────────
  if (stage === "details" && entityData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-[#7C01ED] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Confirm Your Details</h1>
            <p className="text-sm text-gray-500 mt-1">Please review the information below</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Applicant Details
            </p>
            <ReadField label="Registered Email" value={entityData.email} icon={Mail} />
            <ReadField label="TIN (Tax Identifier)" value={entityData.TIN} icon={Hash} />
            {entityData.mobile && (
              <ReadField label="Mobile" value={entityData.mobile} icon={Phone} />
            )}

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">
              Entity Details
            </p>
            {entityData.legalType && (
              <ReadField label="Legal Type" value={entityData.legalType} icon={Building2} />
            )}
            <ReadField label="Entity Legal Name (EN)" value={entityData.entityNameEn} icon={Building2} />
            {entityData.entityNameAr && (
              <ReadField label="Entity Legal Name (AR)" value={entityData.entityNameAr} />
            )}
            <ReadField label="VAT TRN" value={entityData.vatTrn} icon={Hash} />
            <ReadField
              label="Effective Date of Registration"
              value={entityData.effectiveDate}
            />
            <ReadField
              label="Date of Submission"
              value={new Date().toISOString().split("T")[0]}
            />

            {/* Declaration */}
            <label className="flex items-start gap-3 pt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={declared}
                onChange={e => setDeclared(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-600 leading-relaxed">
                I declare that all information provided is true, accurate and complete
                to the best of my knowledge and belief.
              </span>
            </label>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setStage("form"); setError(""); }}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!declared || loading}
                className={`flex-1 py-2.5 text-white rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 ${actionBtnCls}`}
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Processing...</>
                  : `Submit & ${actionLabel}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // FORM — main input screen
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#7C01ED] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {isOnboarding ? "Linking Request" : "Reverifying / Delinking Request"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            KASA Advisory · UAE PINT-AE e-invoicing
          </p>
        </div>

        {authcodeValid === false && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-4 text-center">
            <AlertCircle size={24} className="text-red-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-red-700">Link Expired or Already Used</p>
            <p className="text-xs text-red-500 mt-1 leading-relaxed">
              This onboarding link has expired or has already been used.<br />
              Please contact KASA Advisory for a new invitation link.
            </p>
          </div>
        )}

        {/* Loading state while checking authcode */}
        {authcodeValid === null && authcode && (
          <div className="flex items-center justify-center gap-2 mb-4 text-xs text-gray-400">
            <Loader2 size={14} className="animate-spin" />
            Validating your invitation link…
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">

          {/* Action radio — only shown for reverify/offboard */}
          {!isOnboarding && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Select Action
              </p>
              <div className="flex gap-3">
                {[
                  { value: 2 as Action, label: "Reverify" },
                  { value: 3 as Action, label: "Delinking" },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${action === opt.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <input
                      type="radio" name="action" value={opt.value}
                      checked={action === opt.value}
                      onChange={() => setAction(opt.value)}
                      className="text-blue-600"
                    />
                    <span className={`text-sm font-medium ${action === opt.value ? "text-blue-700" : "text-gray-600"}`}>
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Applicant Details
          </p>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Registered EmaraTax E-mail Address (Optional)
            </label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@yourcompany.com"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* TIN */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              TIN (Tax Identifier Number)
              {isOnboarding && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <input
              type="text" value={tin}
              onChange={e => isOnboarding && setTin(e.target.value)}
              readOnly={!isOnboarding}
              placeholder="1000000000"
              maxLength={10}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none ${!isOnboarding
                ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
                : tin && !isValidTIN(tin)
                  ? "border-red-300 bg-red-50 focus:ring-2 focus:ring-red-500"
                  : "border-gray-200 focus:ring-2 focus:ring-blue-500"
                }`}
            />
            {isOnboarding && tin && !isValidTIN(tin) && (
              <p className="text-xs text-red-500 mt-0.5">
                TIN must start with 1 and be exactly 10 digits
              </p>
            )}
          </div>

          {/* Mobile (optional) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Registered Mobile Number (Optional)
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                className="px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="+971">🇦🇪 +971</option>
                <option value="+966">🇸🇦 +966</option>
                <option value="+974">🇶🇦 +974</option>
                <option value="+965">🇰🇼 +965</option>
                <option value="+91">🇮🇳 +91</option>
                <option value="+92">🇵🇰 +92</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+1">🇺🇸 +1</option>
              </select>
              <input
                type="tel" value={mobile}
                onChange={e => setMobile(e.target.value)}
                placeholder="50 123 4567"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={!canVerify || loading}
            className="w-full py-2.5 bg-[#7C01ED] text-white rounded-xl font-medium text-sm hover:bg-[#7C01ED] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Verifying...</>
              : "Verify Applicant Details"}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
          <Shield size={12} />
          <span>Secured by UAE Federal Tax Authority · PINT-AE compliant</span>
        </div>
      </div>
    </div>
  );
}

// ─── Exported page (Suspense required for useSearchParams in Next.js 13+) ─────

export default function OnboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-14 h-14 bg-[#7C01ED] rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Shield size={28} className="text-white" />
            </div>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      }
    >
      <OnboardInner />
    </Suspense>
  );
}