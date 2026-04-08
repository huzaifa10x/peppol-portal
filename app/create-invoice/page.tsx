"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Send, CheckCircle, XCircle, Calculator } from "lucide-react";

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

export default function CreateInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<any>(null);
  const [error, setError]     = useState("");

  const [docType, setDocType] = useState("invoice");
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

  const setField = (k: keyof typeof form, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const setLine = (i: number, k: keyof LineItem, v: string | number) =>
    setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l));

  const addLine = () => setLines(ls => [
    ...ls,
    { description: "", quantity: 1, unit_code: "EA",
      unit_price: 0, vat_category_code: "S", vat_rate: 5 }
  ]);

  const removeLine = (i: number) =>
    setLines(ls => ls.filter((_, idx) => idx !== i));

  const subtotal   = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  const taxTotal   = lines.reduce((s, l) => s + l.quantity * l.unit_price * (l.vat_rate / 100), 0);
  const grandTotal = subtotal + taxTotal;

  const handleSubmit = async () => {
    if (!form.buyer_name || !form.buyer_tax_id || !form.buyer_peppol_id) {
      setError("Buyer name, Tax ID, and Peppol ID are required"); return;
    }
    if (lines.some(l => !l.description || l.unit_price <= 0)) {
      setError("All line items need a description and price"); return;
    }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch(`${BASE}/invoices/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, doc_type: docType, line_items: lines }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="p-8 max-w-lg">
        <div className={`rounded-2xl border p-8 text-center ${
          result.sent ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
        }`}>
          {result.sent
            ? <CheckCircle size={40} className="text-green-500 mx-auto mb-4" />
            : <XCircle size={40} className="text-amber-500 mx-auto mb-4" />
          }
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {result.sent ? "Invoice Sent!" : "Invoice Created"}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {result.sent
              ? "Successfully sent via Peppol AS4 network"
              : "Saved but could not send — check system status"
            }
          </p>
          <div className="bg-white rounded-xl p-4 text-left space-y-2 mb-6 border border-gray-200">
            {[
              ["Invoice ID",  result.invoice_id],
              ["Status",      result.status],
              ["Subtotal",    `AED ${fmt(result.subtotal)}`],
              ["VAT",         `AED ${fmt(result.tax)}`],
              ["Total",       `AED ${fmt(result.total)}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium text-gray-800">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setResult(null)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
              Create Another
            </button>
            <button onClick={() => router.push("/invoices")}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
              View Invoices
            </button>
          </div>
        </div>
      </div>
    );
  }

  const InputField = ({ label, value, onChange, placeholder, mono = false, required = false }:
    { label: string; value: string; onChange: (v: string) => void;
      placeholder?: string; mono?: boolean; required?: boolean }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 ${mono ? "font-mono" : ""}`} />
    </div>
  );

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Generate a PINT-AE compliant invoice and send via Peppol
          </p>
        </div>
        {/* Doc type selector */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {[
            { v: "invoice",     l: "Invoice" },
            { v: "credit_note", l: "Credit Note" },
            { v: "sb_invoice",  l: "Self-Billing" },
          ].map(t => (
            <button key={t.v} onClick={() => setDocType(t.v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                docType === t.v
                  ? "bg-white shadow-sm text-gray-800"
                  : "text-gray-500 hover:text-gray-700"
              }`}>{t.l}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Supplier */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded text-xs font-bold flex items-center justify-center">S</span>
            Supplier (Sender)
          </h2>
          <div className="space-y-3">
            <InputField label="Legal Name" value={form.supplier_name}
              onChange={v => setField("supplier_name", v)} required />
            <InputField label="Tax ID (TRN)" value={form.supplier_tax_id}
              onChange={v => setField("supplier_tax_id", v)} mono required
              placeholder="100000000000003" />
            <InputField label="City / Address" value={form.supplier_address}
              onChange={v => setField("supplier_address", v)} />
          </div>
        </div>

        {/* Buyer */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 bg-green-100 text-green-700 rounded text-xs font-bold flex items-center justify-center">B</span>
            Buyer (Receiver)
          </h2>
          <div className="space-y-3">
            <InputField label="Legal Name" value={form.buyer_name}
              onChange={v => setField("buyer_name", v)} required
              placeholder="Buyer Company LLC" />
            <InputField label="Tax ID (TRN)" value={form.buyer_tax_id}
              onChange={v => setField("buyer_tax_id", v)} mono required
              placeholder="200000000000003" />
            <InputField label="Peppol ID" value={form.buyer_peppol_id}
              onChange={v => setField("buyer_peppol_id", v)} mono required
              placeholder="0235:200000000000003" />
            <InputField label="City / Address" value={form.buyer_address}
              onChange={v => setField("buyer_address", v)} />
          </div>
        </div>
      </div>

      {/* Invoice details */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Invoice Details</h2>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
            <select value={form.currency_code}
              onChange={e => setField("currency_code", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="AED">AED</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <InputField label="Due Date" value={form.due_date}
            onChange={v => setField("due_date", v)} placeholder="2026-05-08" />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Participant</label>
            <select value={form.participant_type}
              onChange={e => setField("participant_type", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="billing">Billing (0235:pae001045)</option>
              <option value="selfbilling">Self-Billing (0235:2222)</option>
            </select>
          </div>
        </div>
        <div className="mt-3">
          <InputField label="Note (optional)" value={form.note}
            onChange={v => setField("note", v)} placeholder="Tax invoice" />
        </div>
      </div>

      {/* Line items */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Line Items</h2>
          <button onClick={addLine}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100">
            <Plus size={12} /> Add Line
          </button>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
            <div className="col-span-4">Description</div>
            <div className="col-span-1">Qty</div>
            <div className="col-span-2">Unit Price</div>
            <div className="col-span-1">VAT %</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-1 text-right">VAT</div>
            <div className="col-span-1" />
          </div>

          {lines.map((line, i) => {
            const lineAmt = line.quantity * line.unit_price;
            const lineVat = lineAmt * (line.vat_rate / 100);
            return (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4">
                  <input value={line.description}
                    onChange={e => setLine(i, "description", e.target.value)}
                    placeholder="Service or product description"
                    className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-1">
                  <input type="number" value={line.quantity} min={0.01} step={0.01}
                    onChange={e => setLine(i, "quantity", parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right" />
                </div>
                <div className="col-span-2">
                  <input type="number" value={line.unit_price} min={0} step={0.01}
                    onChange={e => setLine(i, "unit_price", parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right" />
                </div>
                <div className="col-span-1">
                  <select value={line.vat_rate}
                    onChange={e => setLine(i, "vat_rate", parseFloat(e.target.value))}
                    className="w-full px-1.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value={5}>5%</option>
                    <option value={0}>0%</option>
                  </select>
                </div>
                <div className="col-span-2 text-right text-xs font-medium text-gray-700 pr-1">
                  {fmt(lineAmt)}
                </div>
                <div className="col-span-1 text-right text-xs text-gray-500">
                  {fmt(lineVat)}
                </div>
                <div className="col-span-1 flex justify-end">
                  {lines.length > 1 && (
                    <button onClick={() => removeLine(i)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex justify-end">
            <div className="w-56 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-800">{form.currency_code} {fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">VAT</span>
                <span className="text-gray-800">{form.currency_code} {fmt(taxTotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-200">
                <span className="text-gray-800">Total</span>
                <span className="text-blue-700 text-base">{form.currency_code} {fmt(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button onClick={() => router.back()}
          className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading
            ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Generating & Sending...</>
            : <><Send size={15} /> Generate & Send via Peppol</>
          }
        </button>
      </div>
    </div>
  );
}
