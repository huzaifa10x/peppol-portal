"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  Search,
  Copy,
  FileText,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  Building2,
  UserCheck,
} from "lucide-react";
import { tenantApi, DBDocument } from "@/lib/api";
import InvoiceFileUpload from "./InvoiceFileUpload";
import BulkUpload from "./BulkUpload";

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

interface LineItem {
  description: string;
  quantity: number;
  unit_code: string;
  unit_price: number;
  vat_category_code: string;
  vat_rate: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2 }).format(n);
}

// Modernized Step Indicator
function Steps({ current }: { current: number }) {
  const steps = [
    { n: 1, label: "Fill Details", icon: FileText },
    { n: 2, label: "Validate", icon: ShieldCheck },
    { n: 3, label: "Send Invoice", icon: Send },
  ];

  return (
    <div className="flex items-center gap-2 mb-8 bg-white p-2 rounded-2xl border border-gray-200 shadow-2xs max-w-fit">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const done = current > s.n;
        const active = current === s.n;
        return (
          <div key={s.n} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${done
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : active
                  ? "bg-[#7C01ED] text-white shadow-xs"
                  : "bg-gray-50 text-gray-500 border border-gray-100"
                }`}
            >
              {done ? <CheckCircle2 size={15} /> : <Icon size={15} />}
              <span>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight size={16} className="text-gray-300 mx-1 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  mono = false,
  required = false,
  type = "text",
  isDisabled = false
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  required?: boolean;
  type?: string;
  isDisabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">
        {label}
        {required && <span className="text-rose-600 ml-0.5">*</span>}
      </label>
      <input
        disabled={isDisabled}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3.5 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C01ED] focus:border-transparent transition-all placeholder:text-gray-400 shadow-2xs ${mono ? "font-mono" : ""
          }`}
      />
    </div>
  );
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [docType, setDocType] = useState("invoice");
  const [draftResult, setDraftResult] = useState<any>(null);
  const [validateResult, setValidateResult] = useState<any>(null);
  const [sendResult, setSendResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [receiverStatus, setReceiverStatus] = useState<any>(null);
  const [checkingReceiver, setCheckingReceiver] = useState(false);
  const [templates, setTemplates] = useState<DBDocument[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const [form, setForm] = useState({
    invoice_number: "",
    issue_date: "",
    supplier_name: "KASA Advisory Service FZE",
    supplier_tax_id: "100000000000003",
    supplier_address: "Abu Dhabi, UAE",
    buyer_name: "",
    buyer_tax_id: "",
    buyer_address: "Dubai, UAE",
    buyer_peppol_id: "",
    currency_code: "AED",
    due_date: "",
    note: "",
    buyer_reference: "",
    participant_type: "billing",
  });

  const [lines, setLines] = useState<LineItem[]>([
    {
      description: "",
      quantity: 1,
      unit_code: "EA",
      unit_price: 0,
      vat_category_code: "S",
      vat_rate: 5,
    },
  ]);

  useEffect(() => {
    tenantApi
      .templates()
      .then((r) => setTemplates(r.templates))
      .catch(() => { });
  }, []);

  const setField = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const setLine = (i: number, k: keyof LineItem, v: string | number) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)));

  const checkReceiver = async () => {
    if (!form.buyer_peppol_id) return;
    setCheckingReceiver(true);
    const r = await tenantApi.lookupReceiver(form.buyer_peppol_id);
    setReceiverStatus(r);
    setCheckingReceiver(false);
  };

  const loadTemplate = (t: DBDocument) => {
    setForm((f) => ({
      ...f,
      buyer_name: t.buyer_name ?? f.buyer_name,
      buyer_tax_id: t.buyer_tax_id ?? f.buyer_tax_id,
      currency_code: t.currency_code ?? f.currency_code,
      participant_type: t.participant_type ?? f.participant_type,
    }));
    if ((t as any).line_items?.length > 0) {
      setLines(
        (t as any).line_items.map((li: any) => ({
          description: li.description ?? "",
          quantity: parseFloat(li.quantity) || 1,
          unit_code: li.unit_code ?? "EA",
          unit_price: parseFloat(li.unit_price) || 0,
          vat_category_code: li.vat_category_code ?? "S",
          vat_rate: parseFloat(li.vat_rate) || 5,
        }))
      );
    }
    setShowTemplates(false);
  };

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  const taxTotal = lines.reduce(
    (s, l) => s + l.quantity * l.unit_price * (l.vat_rate / 100),
    0
  );
  const grandTotal = subtotal + taxTotal;

  // ── STEP 1: Save Draft ──────────────────────────────────────────────────────
  const saveDraft = async () => {
    if (!form.buyer_name || !form.buyer_tax_id || !form.buyer_peppol_id) {
      setError("Buyer name, Tax ID, and Peppol ID are required");
      return;
    }
    const trnRegex = /^1\d{12}03$/;
    if (!trnRegex.test(form.buyer_tax_id.trim())) {
      setError("Buyer TRN must be 15 digits, start with 1 and end with 03");
      return;
    }
    if (!trnRegex.test(form.supplier_tax_id.trim())) {
      setError("Supplier TRN must be 15 digits, start with 1 and end with 03");
      return;
    }
    if (lines.some((l) => !l.description || l.unit_price <= 0)) {
      setError("All line items need a description and price > 0");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/invoices/draft`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, doc_type: docType, line_items: lines }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data.detail) || "Failed");
      setDraftResult(data);
      setStep(2);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2: Validate ───────────────────────────────────────────────────────
  const validateInvoice = async () => {
    if (!draftResult?.document_id) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${BASE}/invoices/${draftResult.document_id}/validate-draft`,
        { method: "POST", credentials: "include", }
      );
      const data = await res.json();
      setValidateResult(data);
      if (data.valid) setStep(3);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 3: Send ───────────────────────────────────────────────────────────
  const sendInvoice = async () => {
    if (!draftResult?.document_id) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${BASE}/invoices/${draftResult.document_id}/send-validated`,
        { method: "POST", credentials: "include", }
      );
      const data = await res.json();
      setSendResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Final Screen ────────────────────────────────────────────────────────────
  if (sendResult) {
    return (
      <div className="p-6 max-w-lg mx-auto text-gray-900">
        <div
          className={`rounded-2xl border p-8 text-center shadow-xs ${sendResult.sent
            ? "bg-emerald-50/50 border-emerald-200"
            : "bg-rose-50/50 border-rose-200"
            }`}
        >
          {sendResult.sent ? (
            <CheckCircle2 size={48} className="text-emerald-600 mx-auto mb-4" />
          ) : (
            <XCircle size={48} className="text-rose-600 mx-auto mb-4" />
          )}
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {sendResult.sent ? "Invoice Sent Successfully!" : "Send Failed"}
          </h2>
          <p className="text-xs text-gray-600 mb-6">
            {sendResult.sent
              ? "Delivered via Peppol AS4 network · Validated & Certified"
              : "Check network connectivity or retry from Outbound logs"}
          </p>
          <div className="bg-white rounded-xl p-4 text-left space-y-2.5 mb-6 border border-gray-200 shadow-2xs">
            {[
              ["Invoice ID", draftResult?.invoice_id],
              ["Status", sendResult.status],
              ["Total Amount", `AED ${fmt(draftResult?.total ?? 0)}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs">
                <span className="font-semibold text-gray-500 uppercase tracking-wider">
                  {k}
                </span>
                <span className="font-bold text-gray-900">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setStep(1);
                setDraftResult(null);
                setValidateResult(null);
                setSendResult(null);
                setLines([
                  {
                    description: "",
                    quantity: 1,
                    unit_code: "EA",
                    unit_price: 0,
                    vat_category_code: "S",
                    vat_rate: 5,
                  },
                ]);
              }}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
            >
              New Invoice
            </button>
            <button
              onClick={() => router.push("/outbound")}
              className="flex-1 px-4 py-2.5 bg-[#7C01ED] hover:bg-[#6800CB] text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              View Outbound
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Add the handler that maps extracted data back to your form:
  const handleExtracted = (data: any) => {
    setShowUpload(false);
    // Populate form fields
    setForm(f => ({
      ...f,
      invoice_number: data.invoice_number || f.invoice_number,
      issue_date: data.issue_date || f.issue_date,
      due_date: data.due_date || f.due_date,
      currency_code: data.currency_code || f.currency_code,
      buyer_name: data.buyer?.name || f.buyer_name,
      buyer_tax_id: data.buyer?.tax_id || f.buyer_tax_id,
      supplier_name: data.supplier?.name || f.supplier_name,
      supplier_tax_id: data.supplier?.tax_id || f.supplier_tax_id,
      note: data.notes || data.note || f.note, // Changed `notes` to `note`
      buyer_reference: data.buyer_reference || f.buyer_reference,
    }));
    setDocType(data.invoice_type === "CREDIT_NOTE" ? "credit_note" : "invoice");
    if (data.line_items?.length) {
      setLines(data.line_items.map((l: any) => ({
        description: l.description,
        quantity: l.quantity,
        unit_code: l.unit_of_measure || "EA",
        unit_price: l.unit_price,
        vat_category_code: "S",
        vat_rate: l.vat_rate,
      })));
    }
  };

  return (
    <div className="p-6 max-w-5xl text-gray-900">
      {/* Top Bar / Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        {/* Title Section */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Create Invoice
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            PINT-AE Compliant &middot; Instant Validation &amp; Delivery
          </p>
        </div>

        {/* Actions Section */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Upload Button */}
          <button
            onClick={() => setShowUpload(true)}
            className="px-4 py-2 bg-[#7C01ED] hover:bg-[#6c01d0] text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
          >
            Upload Invoice File
          </button>

          {/* Templates Dropdown */}
          {templates.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
              >
                <Copy size={14} className="text-[#7C01ED]" />
                <span>Templates</span>
              </button>
              {showTemplates && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowTemplates(false)}
                  />
                  <div className="absolute right-0 top-11 w-72 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 p-1">
                    {templates.slice(0, 5).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => loadTemplate(t)}
                        className="w-full px-3.5 py-2.5 text-left hover:bg-purple-50/50 rounded-xl transition-colors"
                      >
                        <div className="text-xs font-bold text-gray-900">
                          {t.invoice_number}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {t.buyer_name} &middot; AED {fmt(t.payable_amount ?? 0)}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Document Type Switcher */}
          <div className="flex gap-1 bg-gray-200/60 p-1 rounded-xl">
            {[
              { v: "invoice", l: "Invoice" },
              { v: "credit_note", l: "Credit Note" },
              { v: "sb_invoice", l: "Self-Billing" },
            ].map((t) => (
              <button
                key={t.v}
                onClick={() => setDocType(t.v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${docType === t.v
                  ? "bg-white text-gray-900 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                {t.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Steps current={step} />

      {/* ── STEP 1: Fill Details ─────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Supplier Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <div className="w-7 h-7 bg-purple-50 text-[#7C01ED] rounded-lg flex items-center justify-center font-bold">
                  <Building2 size={16} />
                </div>
                <h2 className="text-sm font-bold text-gray-900">
                  Supplier Details
                </h2>
              </div>
              <div className="space-y-4">
                <InputField
                  isDisabled={true}
                  label="Legal Name"
                  value={form.supplier_name}
                  onChange={(v) => setField("supplier_name", v)}
                  required
                />
                <InputField
                  isDisabled={true}
                  label="Tax ID (TRN)"
                  value={form.supplier_tax_id}
                  onChange={(v) => setField("supplier_tax_id", v)}
                  mono
                  required
                  placeholder="100000000000003"
                />
                <InputField
                  isDisabled={true}
                  label="City / Address"
                  value={form.supplier_address}
                  onChange={(v) => setField("supplier_address", v)}
                />
              </div>
            </div>

            {/* Buyer Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <div className="w-7 h-7 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-bold">
                  <UserCheck size={16} />
                </div>
                <h2 className="text-sm font-bold text-gray-900">
                  Buyer Details
                </h2>
              </div>
              <div className="space-y-4">
                <InputField
                  label="Legal Name"
                  value={form.buyer_name}
                  onChange={(v) => setField("buyer_name", v)}
                  required
                  placeholder="Buyer Company LLC"
                />
                <InputField
                  label="Tax ID (TRN)"
                  value={form.buyer_tax_id}
                  onChange={(v) => setField("buyer_tax_id", v)}
                  mono
                  required
                  placeholder="100000000000003"
                />
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">
                    Peppol ID<span className="text-rose-600 ml-0.5">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={form.buyer_peppol_id}
                      onChange={(e) => {
                        setField("buyer_peppol_id", e.target.value);
                        setReceiverStatus(null);
                      }}
                      placeholder="0235:100000000000003"
                      className="flex-1 px-3.5 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C01ED] focus:border-transparent font-mono bg-white shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={checkReceiver}
                      disabled={!form.buyer_peppol_id || checkingReceiver}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg font-semibold text-gray-700 disabled:opacity-50 shrink-0 transition-colors"
                    >
                      {checkingReceiver ? (
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full" />
                      ) : (
                        <Search size={15} />
                      )}
                    </button>
                  </div>
                  {receiverStatus && (
                    <div
                      className={`mt-2 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${receiverStatus.found
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                        : "bg-rose-50 border border-rose-200 text-rose-700"
                        }`}
                    >
                      {receiverStatus.found ? (
                        <>
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span>Registered · {receiverStatus.service_count} Services Available</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={14} className="text-rose-600" />
                          <span>Not found in Peppol network</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <InputField
                  label="City / Address"
                  value={form.buyer_address}
                  onChange={(v) => setField("buyer_address", v)}
                />
              </div>
            </div>
          </div>

          {/* Invoice Terms Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs">
            <h2 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              Invoice Terms &amp; Options
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">
                  Currency
                </label>
                <select
                  value={form.currency_code}
                  onChange={(e) => setField("currency_code", e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C01ED] focus:border-transparent shadow-2xs"
                >
                  {["AED", "USD", "EUR", "GBP", "SAR"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <InputField
                label="Due Date"
                value={form.due_date}
                onChange={(v) => setField("due_date", v)}
                placeholder="2026-05-15"
                type="date"
              />
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">
                  Participant Role
                </label>
                <select
                  value={form.participant_type}
                  onChange={(e) => setField("participant_type", e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C01ED] focus:border-transparent shadow-2xs"
                >
                  <option value="billing">Billing (PAE001045)</option>
                  <option value="selfbilling">Self-Billing (2222)</option>
                </select>
              </div>
              <InputField
                label="Note (Optional)"
                value={form.note}
                onChange={(v) => setField("note", v)}
                placeholder="Tax invoice details"
              />
            </div>
          </div>

          {/* Line Items Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">Line Items</h2>
              <button
                type="button"
                onClick={() =>
                  setLines((ls) => [
                    ...ls,
                    {
                      description: "",
                      quantity: 1,
                      unit_code: "EA",
                      unit_price: 0,
                      vat_category_code: "S",
                      vat_rate: 5,
                    },
                  ])
                }
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-[#7C01ED] border border-purple-200 rounded-lg text-xs font-bold transition-colors"
              >
                <Plus size={14} /> Add Line
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
                <div className="col-span-4">Description</div>
                <div className="col-span-1 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-1 text-right">VAT</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-1 text-right">VAT Amt</div>
                <div className="col-span-1" />
              </div>

              {lines.map((line, i) => {
                const lineAmt = line.quantity * line.unit_price;
                const lineVat = lineAmt * (line.vat_rate / 100);
                return (
                  <div
                    key={i}
                    className="grid grid-cols-12 gap-2 items-center bg-gray-50/70 border border-gray-200/60 rounded-xl p-2.5"
                  >
                    <div className="col-span-4">
                      <input
                        value={line.description}
                        onChange={(e) => setLine(i, "description", e.target.value)}
                        placeholder="Service or product name"
                        className="w-full px-3 py-1.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C01ED]"
                      />
                    </div>
                    <div className="col-span-1">
                      <input
                        type="number"
                        value={line.quantity}
                        min={0.01}
                        step={0.01}
                        onChange={(e) =>
                          setLine(i, "quantity", parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none text-right"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={line.unit_price}
                        min={0}
                        step={0.01}
                        onChange={(e) =>
                          setLine(i, "unit_price", parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none text-right"
                      />
                    </div>
                    <div className="col-span-1">
                      <select
                        value={line.vat_rate}
                        onChange={(e) =>
                          setLine(i, "vat_rate", parseFloat(e.target.value))
                        }
                        className="w-full px-1 py-1.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none"
                      >
                        <option value={5}>5%</option>
                        <option value={0}>0%</option>
                      </select>
                    </div>
                    <div className="col-span-2 text-right text-xs font-bold text-gray-900 pr-1">
                      {fmt(lineAmt)}
                    </div>
                    <div className="col-span-1 text-right text-xs font-medium text-gray-500">
                      {fmt(lineVat)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-xs font-medium text-gray-600">
                  <span>Subtotal</span>
                  <span>
                    {form.currency_code} {fmt(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-medium text-gray-600">
                  <span>VAT (5%)</span>
                  <span>
                    {form.currency_code} {fmt(taxTotal)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-gray-200 text-gray-900">
                  <span>Total Amount</span>
                  <span className="text-[#7C01ED]">
                    {form.currency_code} {fmt(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
              <XCircle size={16} className="shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveDraft}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#7C01ED] hover:bg-[#6800CB] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shadow-xs"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Saving Draft...</span>
                </>
              ) : (
                <>
                  <FileText size={15} />
                  <span>Save &amp; Continue</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Validate ──────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="max-w-xl">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-50 text-[#7C01ED] rounded-xl flex items-center justify-center shrink-0 font-bold">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Ready to Validate
                </h2>
                <p className="text-xs text-gray-500">
                  Draft ID: {draftResult?.invoice_id}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs mb-6 p-4 bg-gray-50/70 border border-gray-200/60 rounded-xl">
              {[
                ["Invoice ID", draftResult?.invoice_id],
                ["Subtotal", `AED ${fmt(draftResult?.subtotal ?? 0)}`],
                ["VAT", `AED ${fmt(draftResult?.tax ?? 0)}`],
                ["Total Payable", `AED ${fmt(draftResult?.total ?? 0)}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-500 font-medium">{k}</span>
                  <span className="font-bold text-gray-900">{v}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-600 mb-6 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
              Clicking <strong>Validate Invoice</strong> checks your document against UAE PINT-AE schematron rules to ensure 100% compliance before sending.
            </p>

            {validateResult && (
              <div
                className={`mb-6 p-4 rounded-xl border ${validateResult.valid
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {validateResult.valid ? (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  ) : (
                    <AlertTriangle size={16} className="text-rose-600" />
                  )}
                  <span className="text-xs font-bold">
                    {validateResult.valid
                      ? "Validation Passed — Ready to Send"
                      : `${validateResult.error_count} Validation Error(s) Found`}
                  </span>
                </div>
                {validateResult.errors?.map((e: string, i: number) => (
                  <div
                    key={i}
                    className="text-[11px] font-mono text-rose-700 bg-white rounded-lg p-2.5 mt-2 border border-rose-100"
                  >
                    {e.slice(0, 150)}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                ← Edit Form
              </button>
              <button
                type="button"
                onClick={validateInvoice}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7C01ED] hover:bg-[#6800CB] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shadow-xs"
              >
                {loading ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Validating...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Validate Invoice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Send ──────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="max-w-xl">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Validation Passed ✓
                </h2>
                <p className="text-xs text-gray-500">
                  Invoice is PINT-AE compliant and ready for transmission.
                </p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl mb-6 text-xs text-emerald-800">
              <div className="font-bold mb-0.5">Compliant Document</div>
              <div>
                All schematron rules verified. Ready for Peppol AS4 transmission.
              </div>
            </div>

            <div className="space-y-2 text-xs mb-6 p-4 bg-gray-50/70 border border-gray-200/60 rounded-xl">
              {[
                ["Invoice ID", draftResult?.invoice_id],
                ["Buyer Name", form.buyer_name],
                ["Peppol ID", form.buyer_peppol_id],
                ["Total Amount", `AED ${fmt(draftResult?.total ?? 0)}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-500 font-medium">{k}</span>
                  <span className="font-bold text-gray-900">{v}</span>
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                <XCircle size={15} className="shrink-0" /> {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={sendInvoice}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shadow-xs"
              >
                {loading ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Sending via Peppol...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Send via Peppol AS4</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpload && (
        <InvoiceFileUpload onExtracted={handleExtracted} onClose={() => setShowUpload(false)} />
      )}
      <BulkUpload />
    </div>
  );
}