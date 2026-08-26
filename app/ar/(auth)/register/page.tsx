"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Shield, CheckCircle, AlertCircle, Building2,
  Mail, Phone, Hash, Loader2,
} from "lucide-react";

// /Users/macbook/Documents/Next Projects/peppol-portal/app/(auth)/register

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
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

// ─── Read-only entity field ────────────────────────────────────────────────────

function ReadField({
  label, value, icon: Icon, ltr = false,
}: { label: string; value: string; icon?: React.ElementType; ltr?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
        {Icon && <Icon size={14} className="text-gray-400 shrink-0" />}
        <span
          className="text-sm text-gray-700 font-medium"
          dir={ltr ? "ltr" : undefined}
        >
          {value || "—"}
        </span>
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

  useEffect(() => {
    const ac = searchParams.get("authcode") || "";
    const t = searchParams.get("TIN") || searchParams.get("tin") || "";
    setAuthcode(ac);
    setTinFromUrl(t);
    if (t) { setTin(t); setAction(2); }
    // if (ac || t) window.history.replaceState({}, "", "/onboard");

    // Validate authcode on load
    if (ac) {
      fetch(`${API}/fta/validate-authcode?authcode=${encodeURIComponent(ac)}`, { credentials: "include" })
        .then(r => r.json())
        .then(d => setAuthcodeValid(d.valid !== false))
        .catch(() => setAuthcodeValid(true)); // fail open on network error
    } else {
      setAuthcodeValid(false); // no authcode = reverify flow, allow
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const isOnboarding = !tinFromUrl;

  const canVerify =
    authcodeValid !== false &&
    isValidEmail(email) &&
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
        setError(data.detail || data.error || "فشل التحقق. يُرجى مراجعة البيانات المُدخلة.");
      } else {
        setEntityData(data);
        setStage("details");
      }
    } catch {
      setError("تعذّر الاتصال بالخادم — يُرجى المحاولة مرة أخرى.");
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
          // NOTE: kept in English — this value is sent to the FTA/GSB backend.
          reason:
            action === 3 ? "Taxpayer offboarding request"
              : action === 2 ? "Reverification request"
                : "New onboarding",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || data.error || "فشل تنفيذ الطلب. يُرجى المحاولة مرة أخرى.");
      } else {
        setStage("success");
      }
    } catch {
      setError("تعذّر الاتصال بالخادم — يُرجى المحاولة مرة أخرى.");
    }
    setLoading(false);
  };

  const actionLabel = action === 3 ? "إلغاء الربط" : action === 2 ? "إعادة التحقق" : "الربط";
  const actionBtnCls =
    action === 3 ? "bg-red-600 hover:bg-red-700"
      : "bg-[#7C01ED] hover:bg-[#7C01ED]";

  // ────────────────────────────────────────────────────────────────────────────
  // SUCCESS
  // ────────────────────────────────────────────────────────────────────────────
  if (stage === "success") {
    const msg = {
      1: "تم ربط تسجيلكم في الفوترة الإلكترونية بشركة كاسا أدفيزوري بنجاح.",
      2: "تمت إعادة التحقق من تسجيلكم في الفوترة الإلكترونية بنجاح.",
      3: "تم إلغاء ربط تسجيلكم في الفوترة الإلكترونية بشركة كاسا أدفيزوري بنجاح.",
    }[action];
    return (
      <div dir="rtl" lang="ar" className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {action === 3 ? "تم إلغاء الربط بنجاح"
              : action === 2 ? "تمت إعادة التحقق بنجاح"
                : "تم الربط بنجاح"}
          </h2>
          <p className="text-sm text-gray-500 mb-6">{msg}</p>
          <p className="text-xs text-gray-400">
            يمكنكم الآن إغلاق هذه النافذة والعودة إلى منصة «إمارات تاكس».
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
      <div dir="rtl" lang="ar" className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-[#7C01ED] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">تأكيد البيانات</h1>
            <p className="text-sm text-gray-500 mt-1">يُرجى مراجعة المعلومات الواردة أدناه</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              بيانات مقدّم الطلب
            </p>
            <ReadField label="البريد الإلكتروني المسجّل" value={entityData.email} icon={Mail} ltr />
            <ReadField label="رقم المعرّف الضريبي (TIN)" value={entityData.TIN} icon={Hash} ltr />
            {entityData.mobile && (
              <ReadField label="رقم الهاتف المتحرك" value={entityData.mobile} icon={Phone} ltr />
            )}

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">
              بيانات المنشأة
            </p>
            {entityData.legalType && (
              <ReadField label="الشكل القانوني" value={entityData.legalType} icon={Building2} />
            )}
            <ReadField label="الاسم القانوني للمنشأة (بالإنجليزية)" value={entityData.entityNameEn} icon={Building2} ltr />
            {entityData.entityNameAr && (
              <ReadField label="الاسم القانوني للمنشأة (بالعربية)" value={entityData.entityNameAr} />
            )}
            <ReadField label="رقم التسجيل الضريبي (TRN)" value={entityData.vatTrn} icon={Hash} ltr />
            <ReadField
              label="تاريخ سريان التسجيل"
              value={entityData.effectiveDate}
              ltr
            />
            <ReadField
              label="تاريخ تقديم الطلب"
              value={new Date().toISOString().split("T")[0]}
              ltr
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
                أُقرّ بأن جميع المعلومات المقدَّمة صحيحة ودقيقة وكاملة على حدّ علمي واعتقادي.
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
                رجوع
              </button>
              <button
                onClick={handleSubmit}
                disabled={!declared || loading}
                className={`flex-1 py-2.5 text-white rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 ${actionBtnCls}`}
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> جارٍ المعالجة...</>
                  : `إرسال الطلب وإتمام ${actionLabel}`}
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
    <div dir="rtl" lang="ar" className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#7C01ED] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {isOnboarding ? "طلب الربط" : "طلب إعادة التحقق / إلغاء الربط"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            كاسا أدفيزوري · الفوترة الإلكترونية PINT-AE في دولة الإمارات
          </p>
        </div>

        {authcodeValid === false && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-4 text-center">
            <AlertCircle size={24} className="text-red-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-red-700">الرابط منتهي الصلاحية أو مُستخدَم مسبقاً</p>
            <p className="text-xs text-red-500 mt-1 leading-relaxed">
              انتهت صلاحية رابط الربط هذا أو تم استخدامه من قبل.<br />
              يُرجى التواصل مع كاسا أدفيزوري للحصول على رابط دعوة جديد.
            </p>
          </div>
        )}

        {/* Loading state while checking authcode */}
        {authcodeValid === null && authcode && (
          <div className="flex items-center justify-center gap-2 mb-4 text-xs text-gray-400">
            <Loader2 size={14} className="animate-spin" />
            جارٍ التحقق من رابط الدعوة…
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">

          {/* Action radio — only shown for reverify/offboard */}
          {!isOnboarding && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                اختيار الإجراء
              </p>
              <div className="flex gap-3">
                {[
                  { value: 2 as Action, label: "إعادة التحقق" },
                  { value: 3 as Action, label: "إلغاء الربط" },
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
            بيانات مقدّم الطلب
          </p>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              البريد الإلكتروني المسجّل في «إمارات تاكس» <span className="text-red-500 ms-0.5">*</span>
            </label>
            <input
              type="email" value={email}
              dir="ltr"
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@yourcompany.com"
              className="w-full px-3 py-2 text-sm text-left border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* TIN */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              رقم المعرّف الضريبي (TIN)
              {isOnboarding && <span className="text-red-500 ms-0.5">*</span>}
            </label>
            <input
              type="text" value={tin}
              dir="ltr"
              onChange={e => isOnboarding && setTin(e.target.value)}
              readOnly={!isOnboarding}
              placeholder="1000000000"
              maxLength={10}
              className={`w-full px-3 py-2 text-sm text-left border rounded-lg focus:outline-none ${!isOnboarding
                ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
                : tin && !isValidTIN(tin)
                  ? "border-red-300 bg-red-50 focus:ring-2 focus:ring-red-500"
                  : "border-gray-200 focus:ring-2 focus:ring-blue-500"
                }`}
            />
            {isOnboarding && tin && !isValidTIN(tin) && (
              <p className="text-xs text-red-500 mt-0.5">
                يجب أن يبدأ رقم المعرّف الضريبي بالرقم 1 وأن يتكوّن من 10 أرقام بالضبط
              </p>
            )}
          </div>

          {/* Mobile (optional) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              رقم الهاتف المتحرك المسجّل (اختياري)
            </label>
            <div className="flex gap-2" dir="ltr">
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
                className="flex-1 px-3 py-2 text-sm text-left border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              ? <><Loader2 size={16} className="animate-spin" /> جارٍ التحقق...</>
              : "التحقق من بيانات مقدّم الطلب"}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
          <Shield size={12} />
          <span>مؤمَّن وفق متطلبات الهيئة الاتحادية للضرائب · متوافق مع PINT-AE</span>
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
        <div dir="rtl" lang="ar" className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-14 h-14 bg-[#7C01ED] rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Shield size={28} className="text-white" />
            </div>
            <p className="text-sm text-gray-500">جارٍ التحميل...</p>
          </div>
        </div>
      }
    >
      <OnboardInner />
    </Suspense>
  );
}