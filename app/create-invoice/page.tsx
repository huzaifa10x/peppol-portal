"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, Send, CheckCircle, XCircle,
  Search, Copy, FileText, Shield, AlertTriangle,
  ChevronRight, RotateCcw
} from "lucide-react";
import { tenantApi, DBDocument } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

interface LineItem {
  description: string; quantity: number; unit_code: string;
  unit_price: number; vat_category_code: string; vat_rate: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2 }).format(n);
}

// Step indicator
function Steps({ current }: { current: number }) {
  const steps = [
    { n: 1, label: "Fill Details", icon: FileText },
    { n: 2, label: "Validate",     icon: Shield },
    { n: 3, label: "Send",         icon: Send },
  ];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => {
        const Icon    = s.icon;
        const done    = current > s.n;
        const active  = current === s.n;
        return (
          <div key={s.n} className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              done   ? "bg-green-100 text-green-700" :
              active ? "bg-blue-600 text-white shadow-sm" :
                       "bg-gray-100 text-gray-400"
            }`}>
              {done
                ? <CheckCircle size={14} />
                : <Icon size={14} />
              }
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <ChevronRight size={16} className="text-gray-300 mx-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, mono=false, required=false, type="text" }: 
  { label:string; value:string; onChange:(v:string)=>void; placeholder?:string; mono?:boolean; required?:boolean; type?:string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${mono?"font-mono":""}`} />
    </div>
  );
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const [step, setStep]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [docType, setDocType]       = useState("invoice");
  const [draftResult, setDraftResult]     = useState<any>(null);
  const [validateResult, setValidateResult] = useState<any>(null);
  const [sendResult, setSendResult] = useState<any>(null);
  const [error, setError]           = useState("");
  const [receiverStatus, setReceiverStatus] = useState<any>(null);
  const [checkingReceiver, setCheckingReceiver] = useState(false);
  const [templates, setTemplates]   = useState<DBDocument[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  const [form, setForm] = useState({
    supplier_name:    "KASA Advisory Service FZE",
    supplier_tax_id:  "100000000000003",
    supplier_address: "Abu Dhabi, UAE",
    buyer_name:       "",
    buyer_tax_id:     "",
    buyer_address:    "Dubai, UAE",
    buyer_peppol_id:  "",
    currency_code:    "AED",
    due_date:         "",
    note:             "",
    participant_type: "billing",
  });

  const [lines, setLines] = useState<LineItem[]>([
    { description: "", quantity: 1, unit_code: "EA",
      unit_price: 0, vat_category_code: "S", vat_rate: 5 }
  ]);

  useEffect(() => {
    tenantApi.templates().then(r => setTemplates(r.templates)).catch(() => {});
  }, []);

  const setField = (k: keyof typeof form, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const setLine = (i: number, k: keyof LineItem, v: string | number) =>
    setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l));

  const checkReceiver = async () => {
    if (!form.buyer_peppol_id) return;
    setCheckingReceiver(true);
    const r = await tenantApi.lookupReceiver(form.buyer_peppol_id);
    setReceiverStatus(r);
    setCheckingReceiver(false);
  };

  const loadTemplate = (t: DBDocument) => {
    setForm(f => ({
      ...f,
      buyer_name:       t.buyer_name       ?? f.buyer_name,
      buyer_tax_id:     t.buyer_tax_id     ?? f.buyer_tax_id,
      currency_code:    t.currency_code    ?? f.currency_code,
      participant_type: t.participant_type ?? f.participant_type,
    }));
    if ((t as any).line_items?.length > 0) {
      setLines((t as any).line_items.map((li: any) => ({
        description:       li.description ?? "",
        quantity:          parseFloat(li.quantity)   || 1,
        unit_code:         li.unit_code   ?? "EA",
        unit_price:        parseFloat(li.unit_price) || 0,
        vat_category_code: li.vat_category_code ?? "S",
        vat_rate:          parseFloat(li.vat_rate) || 5,
      })));
    }
    setShowTemplates(false);
  };

  const subtotal   = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  const taxTotal   = lines.reduce((s, l) => s + l.quantity * l.unit_price * (l.vat_rate/100), 0);
  const grandTotal = subtotal + taxTotal;

  // ── STEP 1: Save as Draft ──────────────────────────────────────────────────
  const saveDraft = async () => {
    if (!form.buyer_name || !form.buyer_tax_id || !form.buyer_peppol_id) {
      setError("Buyer name, Tax ID, and Peppol ID are required"); return;
    }
    if (lines.some(l => !l.description || l.unit_price <= 0)) {
      setError("All line items need a description and price > 0"); return;
    }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${BASE}/invoices/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, doc_type: docType, line_items: lines }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data.detail) || "Failed");
      setDraftResult(data);
      setStep(2);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  // ── STEP 2: Validate ───────────────────────────────────────────────────────
  const validateInvoice = async () => {
    if (!draftResult?.document_id) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(
        `${BASE}/invoices/${draftResult.document_id}/validate-draft`,
        { method: "POST" }
      );
      const data = await res.json();
      setValidateResult(data);
      if (data.valid) setStep(3);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  // ── STEP 3: Send ───────────────────────────────────────────────────────────
  const sendInvoice = async () => {
    if (!draftResult?.document_id) return;
    setLoading(true); setError("");
    try {
      const res = await fetch(
        `${BASE}/invoices/${draftResult.document_id}/send-validated`,
        { method: "POST" }
      );
      const data = await res.json();
      setSendResult(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  // ── Final result screen ────────────────────────────────────────────────────
  if (sendResult) {
    return (
      <div className="p-8 max-w-lg">
        <div className={`rounded-2xl border p-8 text-center ${
          sendResult.sent
            ? "bg-green-50 border-green-200"
            : "bg-red-50 border-red-200"
        }`}>
          {sendResult.sent
            ? <CheckCircle size={40} className="text-green-500 mx-auto mb-4" />
            : <XCircle     size={40} className="text-red-500   mx-auto mb-4" />
          }
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {sendResult.sent ? "Invoice Sent!" : "Send Failed"}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {sendResult.sent
              ? "Delivered via Peppol AS4 · validated before sending"
              : "Check system status and retry from Outbound page"
            }
          </p>
          <div className="bg-white rounded-xl p-4 text-left space-y-2 mb-6 border border-gray-200">
            {[
              ["Invoice ID", draftResult?.invoice_id],
              ["Status",     sendResult.status],
              ["Total",      `AED ${fmt(draftResult?.total ?? 0)}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="font-semibold text-gray-900">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setStep(1); setDraftResult(null);
                setValidateResult(null); setSendResult(null);
                setLines([{ description:"",quantity:1,unit_code:"EA",unit_price:0,vat_category_code:"S",vat_rate:5 }]);
              }}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-white">
              New Invoice
            </button>
            <button onClick={() => router.push("/outbound")}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
              View Outbound
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
        <div className="flex gap-2">
          {templates.length > 0 && (
            <div className="relative">
              <button onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                <Copy size={13} /> Template
              </button>
              {showTemplates && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowTemplates(false)} />
                  <div className="absolute right-0 top-10 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                    {templates.slice(0,5).map(t => (
                      <button key={t.id} onClick={() => loadTemplate(t)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0">
                        <div className="text-xs font-medium text-gray-800">{t.invoice_number}</div>
                        <div className="text-xs text-gray-400">{t.buyer_name} · AED {fmt(t.payable_amount??0)}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <div className="flex gap-0.5 bg-gray-100 rounded-xl p-0.5">
            {[{v:"invoice",l:"Invoice"},{v:"credit_note",l:"Credit Note"},{v:"sb_invoice",l:"Self-Billing"}].map(t => (
              <button key={t.v} onClick={() => setDocType(t.v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  docType===t.v ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"
                }`}>{t.l}</button>
            ))}
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-6">PINT-AE compliant · validated before sending</p>

      <Steps current={step} />

      {/* ── STEP 1: Fill Details ─────────────────────────────────────────── */}
      {step === 1 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded text-xs font-bold flex items-center justify-center">S</span>
                Supplier
              </h2>
              <div className="space-y-3">
                <InputField label="Legal Name" value={form.supplier_name} onChange={v=>setField("supplier_name",v)} required />
                <InputField label="Tax ID (TRN)" value={form.supplier_tax_id} onChange={v=>setField("supplier_tax_id",v)} mono required placeholder="100000000000003" />
                <InputField label="City / Address" value={form.supplier_address} onChange={v=>setField("supplier_address",v)} />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span className="w-5 h-5 bg-green-100 text-green-700 rounded text-xs font-bold flex items-center justify-center">B</span>
                Buyer
              </h2>
              <div className="space-y-3">
                <InputField label="Legal Name" value={form.buyer_name} onChange={v=>setField("buyer_name",v)} required placeholder="Buyer Company LLC" />
                <InputField label="Tax ID (TRN)" value={form.buyer_tax_id} onChange={v=>setField("buyer_tax_id",v)} mono required placeholder="200000000000003" />
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Peppol ID<span className="text-red-500 ml-0.5">*</span></label>
                  <div className="flex gap-2">
                    <input value={form.buyer_peppol_id}
                      onChange={e=>{setField("buyer_peppol_id",e.target.value);setReceiverStatus(null);}}
                      placeholder="0235:200000000000003"
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                    <button onClick={checkReceiver} disabled={!form.buyer_peppol_id||checkingReceiver}
                      className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 disabled:opacity-50 shrink-0">
                      {checkingReceiver ? <span className="animate-spin inline-block w-3 h-3 border border-gray-400 border-t-transparent rounded-full" /> : <Search size={13} />}
                    </button>
                  </div>
                  {receiverStatus && (
                    <div className={`mt-1.5 px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
                      receiverStatus.found
                        ? "bg-green-50 border border-green-200 text-green-700"
                        : "bg-red-50 border border-red-200 text-red-600"
                    }`}>
                      {receiverStatus.found
                        ? <><CheckCircle size={11}/> Registered · {receiverStatus.service_count} services</>
                        : <><XCircle size={11}/> Not found in Peppol network</>
                      }
                    </div>
                  )}
                </div>
                <InputField label="City / Address" value={form.buyer_address} onChange={v=>setField("buyer_address",v)} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Invoice Details</h2>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
                <select value={form.currency_code} onChange={e=>setField("currency_code",e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {["AED","USD","EUR","GBP","SAR"].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <InputField label="Due Date" value={form.due_date} onChange={v=>setField("due_date",v)} placeholder="2026-05-15" type="date" />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Participant</label>
                <select value={form.participant_type} onChange={e=>setField("participant_type",e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="billing">Billing (PAE001045)</option>
                  <option value="selfbilling">Self-Billing (2222)</option>
                </select>
              </div>
              <InputField label="Note (optional)" value={form.note} onChange={v=>setField("note",v)} placeholder="Tax invoice" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Line Items</h2>
              <button onClick={()=>setLines(ls=>[...ls,{description:"",quantity:1,unit_code:"EA",unit_price:0,vat_category_code:"S",vat_rate:5}])}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100">
                <Plus size={12}/> Add Line
              </button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-400 px-1">
                <div className="col-span-4">Description</div>
                <div className="col-span-1 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-1 text-right">VAT</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-1 text-right">VAT Amt</div>
                <div className="col-span-1"/>
              </div>
              {lines.map((line,i) => {
                const lineAmt = line.quantity * line.unit_price;
                const lineVat = lineAmt * (line.vat_rate/100);
                return (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg p-2">
                    <div className="col-span-4">
                      <input value={line.description} onChange={e=>setLine(i,"description",e.target.value)}
                        placeholder="Service or product"
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" />
                    </div>
                    <div className="col-span-1">
                      <input type="number" value={line.quantity} min={0.01} step={0.01}
                        onChange={e=>setLine(i,"quantity",parseFloat(e.target.value)||0)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none text-right bg-white" />
                    </div>
                    <div className="col-span-2">
                      <input type="number" value={line.unit_price} min={0} step={0.01}
                        onChange={e=>setLine(i,"unit_price",parseFloat(e.target.value)||0)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none text-right bg-white" />
                    </div>
                    <div className="col-span-1">
                      <select value={line.vat_rate} onChange={e=>setLine(i,"vat_rate",parseFloat(e.target.value))}
                        className="w-full px-1 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none bg-white">
                        <option value={5}>5%</option>
                        <option value={0}>0%</option>
                      </select>
                    </div>
                    <div className="col-span-2 text-right text-xs font-semibold text-gray-800 pr-1">{fmt(lineAmt)}</div>
                    <div className="col-span-1 text-right text-xs text-gray-500">{fmt(lineVat)}</div>
                    <div className="col-span-1 flex justify-end">
                      {lines.length > 1 && (
                        <button onClick={()=>setLines(ls=>ls.filter((_,idx)=>idx!==i))}
                          className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors">
                          <Trash2 size={12}/>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
              <div className="w-56 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{form.currency_code} {fmt(subtotal)}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>VAT</span><span>{form.currency_code} {fmt(taxTotal)}</span></div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                  <span className="text-gray-800">Total</span>
                  <span className="text-blue-700">{form.currency_code} {fmt(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
              <XCircle size={14} className="shrink-0"/> {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button onClick={()=>router.back()}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={saveDraft} disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 shadow-sm">
              {loading
                ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"/>Saving...</>
                : <><FileText size={15}/>Save &amp; Continue</>
              }
            </button>
          </div>
        </>
      )}

      {/* ── STEP 2: Validate ──────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="max-w-xl">
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Shield size={18} className="text-blue-600"/>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">Ready to Validate</div>
                <div className="text-xs text-gray-400">Invoice {draftResult?.invoice_id} saved as draft</div>
              </div>
            </div>
            <div className="space-y-2 text-xs mb-5">
              {[
                ["Invoice ID", draftResult?.invoice_id],
                ["Subtotal",   `AED ${fmt(draftResult?.subtotal??0)}`],
                ["VAT",        `AED ${fmt(draftResult?.tax??0)}`],
                ["Total",      `AED ${fmt(draftResult?.total??0)}`],
              ].map(([k,v])=>(
                <div key={k} className="flex justify-between">
                  <span className="text-gray-400">{k}</span>
                  <span className="font-medium text-gray-800">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mb-5 p-3 bg-gray-50 rounded-lg">
              Clicking Validate will check your invoice against the UAE PINT-AE schematron rules.
              This ensures your invoice is compliant before sending it to the buyer's Peppol inbox.
            </p>

            {validateResult && (
              <div className={`mb-4 p-4 rounded-xl border ${
                validateResult.valid
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {validateResult.valid
                    ? <CheckCircle size={16} className="text-green-600"/>
                    : <AlertTriangle size={16} className="text-red-500"/>
                  }
                  <span className={`text-sm font-semibold ${validateResult.valid ? "text-green-700" : "text-red-700"}`}>
                    {validateResult.valid
                      ? "Validation passed — ready to send"
                      : `${validateResult.error_count} validation error(s) found`
                    }
                  </span>
                </div>
                <div className="text-xs text-gray-600 mb-1">Variant: {validateResult.variant}</div>
                {validateResult.errors?.map((e: string, i: number) => (
                  <div key={i} className="text-xs font-mono text-red-600 bg-white rounded p-2 mt-1 border border-red-100">
                    {e.slice(0,150)}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={()=>setStep(1)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
                ← Edit
              </button>
              <button onClick={validateInvoice} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {loading
                  ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"/>Validating...</>
                  : <><Shield size={15}/>Validate Invoice</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Send ──────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="max-w-xl">
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle size={18} className="text-green-600"/>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">Validation Passed ✓</div>
                <div className="text-xs text-gray-400">Invoice is PINT-AE compliant and ready to send</div>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-5 text-xs text-green-700">
              <div className="font-semibold mb-1">All validation checks passed</div>
              <div>Your invoice complies with UAE PINT-AE schematron rules and is ready for Peppol delivery.</div>
            </div>

            <div className="space-y-2 text-xs mb-5">
              {[
                ["Invoice ID",  draftResult?.invoice_id],
                ["Buyer",       form.buyer_name],
                ["Peppol ID",   form.buyer_peppol_id],
                ["Total",       `AED ${fmt(draftResult?.total??0)}`],
              ].map(([k,v])=>(
                <div key={k} className="flex justify-between">
                  <span className="text-gray-400">{k}</span>
                  <span className="font-medium text-gray-800">{v}</span>
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                <XCircle size={14} className="shrink-0"/> {error}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={()=>setStep(2)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
                ← Back
              </button>
              <button onClick={sendInvoice} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 shadow-sm">
                {loading
                  ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"/>Sending via Peppol...</>
                  : <><Send size={15}/>Send via Peppol AS4</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
