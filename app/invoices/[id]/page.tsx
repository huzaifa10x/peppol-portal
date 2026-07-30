"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle, Clock, XCircle, Send, FileText,
  Shield, RefreshCw, RotateCcw, Download, Network,
  AlertCircle, Building2, User, Hash, Calendar,
  Package, ChevronDown, ChevronUp, LucideProps,
} from "lucide-react";
import { formatTimeOnly } from "@/lib/utils";

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StatusEvent { status: string; notes: string | null; created_at: string; }
interface LineItem {
  id: string; description: string; quantity: number; unit_code: string;
  unit_price: number; line_amount: number; vat_rate: number; vat_amount: number;
}
interface Doc {
  id: string; direction: string; doc_type: string; participant_type: string;
  status: string; invoice_number: string | null; issue_date: string | null;
  due_date: string | null; supplier_name: string | null; supplier_tax_id: string | null;
  supplier_address: string | null; buyer_name: string | null; buyer_tax_id: string | null;
  buyer_address: string | null; currency_code: string;
  tax_exclusive_amount: number | null; tax_amount: number | null;
  payable_amount: number | null; tdd_generated: boolean; tdd_sent: boolean;
  mls_status: string | null; received_at: string;
  c3_message_id: string | null; c3_receipt_timestamp: string | null;
  xml_filename: string | null; xml_size_bytes: number | null;
  buyer_peppol_id: string | null; seller_peppol_id: string | null;
}

interface C3Receipt {
  ref_to_message_id: string | null; message_id: string | null;
  timestamp: string | null; c3_confirmed: boolean;
}

// ── Pipeline definitions ───────────────────────────────────────────────────────

interface PipelineStage {
  key: string; label: string; icon: React.ComponentType<LucideProps>;
  color: string; track: string; section?: string | null;
}

const PIPELINE_INBOUND: PipelineStage[] = [
  { key: "received", label: "Received", icon: FileText, color: "blue", track: "shared" },
  { key: "validated", label: "Validated (PINT-AE)", icon: CheckCircle, color: "blue", track: "shared" },
  { key: "tdd_generated", label: "TDD Generated", icon: Shield, color: "purple", track: "b" },
  { key: "tdd_sent", label: "TDD Sent to FTA C5", icon: Send, color: "purple", track: "b" },
  { key: "acknowledged", label: "MLS Acknowledged", icon: CheckCircle, color: "green", track: "a" },
];

const PIPELINE_OUTBOUND: PipelineStage[] = [
  { key: "draft", label: "Draft (C1)", icon: FileText, color: "gray", track: "shared", section: "Entry Lifecycle" },
  { key: "validated", label: "Validated (PINT-AE)", icon: CheckCircle, color: "blue", track: "shared", section: null },
  { key: "ready_for_dispatch", label: "Ready for Dispatch", icon: Send, color: "blue", track: "shared", section: null },
  { key: "discovery_in_progress", label: "SMP Discovery", icon: Network, color: "blue", track: "a", section: "Track A — Peppol Network (C2→C4)" },
  { key: "sending_as4", label: "Sending via AS4 (C2)", icon: Send, color: "blue", track: "a", section: null },
  { key: "sent_as4", label: "Sent via AS4", icon: Send, color: "blue", track: "a", section: null },
  { key: "as4_receipt_received", label: "C3 Receipt (NRR)", icon: Network, color: "green", track: "a", section: null },
  { key: "delivered_to_c3", label: "Delivered to C3", icon: CheckCircle, color: "green", track: "a", section: null },
  { key: "awaiting_c4_response", label: "Awaiting C4 (MLR)", icon: Clock, color: "blue", track: "a", section: null },
  { key: "accepted_c4", label: "Accepted by C4", icon: CheckCircle, color: "green", track: "a", section: null },
  { key: "c4_response_not_expected", label: "C4 Response N/A", icon: CheckCircle, color: "green", track: "a", section: null },
  { key: "tdd_generating", label: "Generating TDD", icon: Shield, color: "purple", track: "b", section: "Track B — FTA Reporting (C5)" },
  { key: "tdd_generated", label: "TDD Generated", icon: Shield, color: "purple", track: "b", section: null },
  { key: "fta_connector_not_configured", label: "FTA Connector (Staging)", icon: Clock, color: "gray", track: "b", section: null },
  { key: "fta_submitting", label: "Submitting to FTA (C5)", icon: Shield, color: "purple", track: "b", section: null },
  { key: "fta_accepted", label: "FTA Accepted (C5)", icon: CheckCircle, color: "green", track: "b", section: null },
  { key: "send_failed", label: "Send Failed", icon: XCircle, color: "red", track: "shared", section: null },
  { key: "delivery_failed", label: "Delivery Failed", icon: XCircle, color: "red", track: "a", section: null },
  { key: "fta_rejected", label: "FTA Rejected", icon: XCircle, color: "red", track: "b", section: null },
];

const DB_STATUS_TO_COMPLETED: Record<string, string[]> = {
  draft: ["draft"],
  validated: ["draft", "validated"],
  ready_for_dispatch: ["draft", "validated", "ready_for_dispatch"],
  sent: [
    "draft", "validated", "ready_for_dispatch",
    "discovery_in_progress", "sending_as4", "sent_as4",
    "as4_receipt_received", "delivered_to_c3", "c4_response_not_expected",
    "tdd_generating", "tdd_generated", "fta_connector_not_configured",
  ],
  send_failed: ["draft", "validated", "ready_for_dispatch"],
};

const FAILURE_KEYS = new Set(["send_failed", "discovery_failed", "delivery_failed", "rejected_c3", "rejected_c4", "tdd_generation_failed", "fta_rejected"]);

const OVERALL_STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: "DRAFT", color: "bg-gray-100 text-gray-700 border border-gray-200" },
  validated: { label: "IN PROGRESS", color: "bg-purple-50 text-[#7C01ED] border border-purple-200" },
  sent: { label: "TECHNICALLY COMPLETE", color: "bg-teal-50 text-teal-800 border border-teal-200" },
  send_failed: { label: "ACTION REQUIRED", color: "bg-rose-50 text-rose-800 border border-rose-200" },
  delivery_failed: { label: "ACTION REQUIRED", color: "bg-rose-50 text-rose-800 border border-rose-200" },
  fta_accepted: { label: "COMPLETE", color: "bg-emerald-50 text-emerald-800 border border-emerald-200" },
  accepted_c4: { label: "COMPLETE", color: "bg-emerald-50 text-emerald-800 border border-emerald-200" },
  fta_connector_not_configured: { label: "STAGING COMPLETE", color: "bg-teal-50 text-teal-800 border border-teal-200" },
};

const COLOR_MAP: Record<string, string> = {
  blue: "bg-purple-100 text-[#7C01ED]",
  purple: "bg-purple-100 text-[#7C01ED]",
  green: "bg-emerald-100 text-emerald-700",
  red: "bg-rose-100 text-rose-700",
  gray: "bg-gray-100 text-gray-400",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2 }).format(n);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [doc, setDoc] = useState<Doc | null>(null);
  const [history, setHistory] = useState<StatusEvent[]>([]);
  const [c3, setC3] = useState<C3Receipt | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showXml, setShowXml] = useState(false);

  const load = useCallback(async () => {
    try {
      const [docRes, histRes] = await Promise.all([
        fetch(`${BASE}/documents/${id}`, { credentials: "include" }).then(r => r.json()),
        fetch(`${BASE}/documents/${id}/status-history`, { credentials: "include" }).then(r => r.json()),
      ]);

      const found: Doc = docRes?.id ? docRes : null;
      setDoc(found);
      setHistory(histRes.history ?? []);

      if (found?.direction === "outbound") {
        try {
          const c3Res = await fetch(
            `${BASE}/receipts/as4-log/latest?lines=500`,
            { credentials: "include" }
          ).then(r => r.json());

          const receipts: C3Receipt[] = (c3Res.receipts ?? []).filter(
            (r: C3Receipt) => r.c3_confirmed
          );
          const matched = receipts.find(
            r => r.message_id === found.c3_message_id
          ) ?? null;

          if (found.c3_message_id) {
            setC3({
              message_id: found.c3_message_id,
              ref_to_message_id: matched?.ref_to_message_id ?? null,
              timestamp: found.c3_receipt_timestamp ?? null,
              c3_confirmed: true,
            });
          } else {
            setC3(receipts[receipts.length - 1] ?? null);
          }
        } catch { /* no C3 yet */ }
      }
    } catch { }
    try {
      const liRes = await fetch(`${BASE}/documents/${id}/line-items`, { credentials: "include" }).then(r => r.json());
      setLineItems(liRes.line_items ?? liRes.items ?? []);
    } catch { /* endpoint may not exist */ }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const resend = async () => {
    setResending(true);
    await fetch(`${BASE}/invoices/${id}/send-validated`, { method: "POST", credentials: "include" });
    await load();
    setResending(false);
  };

  const syncPipeline = async () => {
    setSyncing(true);
    await fetch(`${BASE}/sync/update-statuses`, { method: "POST", credentials: "include" });
    await load();
    setSyncing(false);
  };

  const downloadReceipt = async () => {
    try {
      const res = await fetch(`${BASE}/receipts/document/${id}/as4-receipt`, { credentials: "include" });
      if (res.ok) {
        const xml = await res.text();
        const blob = new Blob([xml], { type: "application/xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const cd = res.headers.get("Content-Disposition") || "";
        const match = cd.match(/filename="([^"]+)"/);
        a.download = match?.[1] ?? `NRR_${doc?.invoice_number ?? id}.xml`;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
      } else {
        alert(res.status === 404 ? "No AS4 receipt available for this invoice yet." : `Download failed (HTTP ${res.status})`);
      }
    } catch { alert("Connection error — please try again."); }
  };

  if (loading) return <div className="p-8 text-xs font-semibold text-gray-500">Loading…</div>;
  if (!doc) return <div className="p-8 text-xs font-semibold text-gray-500">Document not found.</div>;

  const pipeline = doc.direction === "outbound" ? PIPELINE_OUTBOUND : PIPELINE_INBOUND;
  const current = history[history.length - 1]?.status ?? doc.status;
  const completed = new Set<string>(DB_STATUS_TO_COMPLETED[current] ?? [current]);

  history.forEach(h => {
    const mapped = DB_STATUS_TO_COMPLETED[h.status];
    if (mapped) mapped.forEach(k => completed.add(k));
    else completed.add(h.status);
  });

  if (doc.tdd_generated) { completed.add("tdd_generating"); completed.add("tdd_generated"); }
  if (doc.tdd_sent) { completed.add("fta_connector_not_configured"); completed.add("fta_submitting"); }
  if (doc.mls_status) completed.add("acknowledged");

  const hasC3 = doc.direction === "outbound" && c3?.c3_confirmed;
  if (hasC3) { completed.add("as4_receipt_received"); completed.add("delivered_to_c3"); completed.add("c4_response_not_expected"); }

  const overallStatus = OVERALL_STATUS[current] ?? { label: current.toUpperCase(), color: "bg-gray-100 text-gray-700 border border-gray-200" };

  let lastSection = "";

  return (
    <div className="p-6 max-w-7xl mx-auto text-gray-900">

      {/* Back */}
      <button onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to Invoices
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {doc.invoice_number ?? `DOC-${doc.id.slice(0, 8).toUpperCase()}`}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${doc.direction === "outbound" ? "bg-purple-50 text-[#7C01ED] border border-purple-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
              {doc.direction}
            </span>
            <span className="text-xs text-gray-500">{doc.doc_type.replace("_", " ")}</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-500">{doc.participant_type}</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-400 font-mono">{doc.id.slice(0, 8)}…</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={syncPipeline} disabled={syncing}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 bg-white"
            title="Sync pipeline">
            <RefreshCw size={14} className={syncing ? "animate-spin text-[#7C01ED]" : "text-gray-500"} />
          </button>
          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${overallStatus.color}`}>
            {overallStatus.label}
          </span>
        </div>
      </div>

      {/* ── Two-column layout: LEFT=invoice details, RIGHT=pipeline ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ════════ LEFT — Invoice Details (3/5) ════════ */}
        <div className="xl:col-span-3 space-y-5">

          {/* Parties */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Parties</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-2">
                  <Building2 size={13} className="text-[#7C01ED]" /> Supplier
                </div>
                {[
                  [doc.supplier_name, "Name"],
                  [doc.supplier_tax_id, "TRN"],
                  [doc.seller_peppol_id, "Peppol ID"],
                  [doc.supplier_address, "Address"],
                ].filter(([v]) => v).map(([v, k]) => (
                  <div key={k} className="text-xs">
                    <span className="text-gray-400 text-[10px] block">{k}</span>
                    <span className="text-gray-800 font-medium">{v}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-2">
                  <User size={13} className="text-[#7C01ED]" /> Buyer
                </div>
                {[
                  [doc.buyer_name, "Name"],
                  [doc.buyer_tax_id, "TRN"],
                  [doc.buyer_peppol_id, "Peppol ID"],
                  [doc.buyer_address, "Address"],
                ].filter(([v]) => v).map(([v, k]) => (
                  <div key={k} className="text-xs">
                    <span className="text-gray-400 text-[10px] block">{k}</span>
                    <span className="text-gray-800 font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Invoice metadata */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Invoice Details</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Invoice #", doc.invoice_number, Hash],
                ["Issue Date", doc.issue_date, Calendar],
                ["Due Date", doc.due_date, Calendar],
                ["Received", new Date(doc.received_at).toLocaleDateString("en-AE"), Clock],
                ["Currency", doc.currency_code, FileText],
                ["File", doc.xml_filename, FileText],
              ].filter(([, v]) => v).map(([k, v, Icon]) => (
                <div key={k as string} className="flex items-start gap-2">
                  {/* @ts-ignore */}
                  <Icon size={13} className="text-gray-300 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-gray-400">{k as string}</div>
                    <div className="text-xs font-semibold text-gray-800 truncate">{v as string}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Line items */}
          {lineItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Package size={13} /> Line Items
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-[10px] text-gray-400 font-medium pb-2 pr-3">Description</th>
                      <th className="text-right text-[10px] text-gray-400 font-medium pb-2 px-2">Qty</th>
                      <th className="text-right text-[10px] text-gray-400 font-medium pb-2 px-2">Unit Price</th>
                      <th className="text-right text-[10px] text-gray-400 font-medium pb-2 px-2">VAT %</th>
                      <th className="text-right text-[10px] text-gray-400 font-medium pb-2 pl-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((li, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2 pr-3 text-gray-800 font-medium">{li.description}</td>
                        <td className="py-2 px-2 text-right text-gray-600">{li.quantity} {li.unit_code}</td>
                        <td className="py-2 px-2 text-right text-gray-600 font-mono">{fmt(li.unit_price)}</td>
                        <td className="py-2 px-2 text-right text-gray-600">{li.vat_rate}%</td>
                        <td className="py-2 pl-2 text-right text-gray-800 font-semibold font-mono">{fmt(li.line_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Amounts */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Financial Summary</h2>
            <div className="space-y-2 text-xs max-w-xs ml-auto">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal (excl. VAT)</span>
                <span className="font-mono">{doc.tax_exclusive_amount ? fmt(doc.tax_exclusive_amount) : "—"}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>VAT (5%)</span>
                <span className="font-mono">{doc.tax_amount ? fmt(doc.tax_amount) : "—"}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-gray-900 pt-2 border-t border-gray-200">
                <span>Total Payable</span>
                <span className="text-[#7C01ED] font-mono">
                  {doc.currency_code} {doc.payable_amount ? fmt(doc.payable_amount) : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* C3 / C4 Message Exchange */}
          {doc.direction === "outbound" && (
            <div className={`rounded-2xl border p-5 ${hasC3 ? "bg-emerald-50/40 border-emerald-200" : "bg-gray-50 border-gray-200"}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <Network size={13} className={hasC3 ? "text-emerald-600" : "text-gray-400"} />
                  Network Message Exchange
                </h2>
                {hasC3 && (
                  <button onClick={downloadReceipt}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors">
                    <Download size={12} /> Download NRR
                  </button>
                )}
              </div>

              {hasC3 ? (
                <div className="space-y-3">
                  {/* C2 → C3 message */}
                  <div className="bg-white rounded-xl border border-emerald-100 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-[#7C01ED] rounded-full">C2 → C3</span>
                      <span className="text-xs font-semibold text-gray-700">Invoice Sent via AS4</span>
                      <CheckCircle size={13} className="text-emerald-500 ml-auto" />
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 text-xs">
                      {[
                        ["C3 Timestamp", c3?.timestamp ? new Date(c3.timestamp).toLocaleString("en-AE") : null],
                        ["C3 Message ID", c3?.message_id],
                        ["Protocol", "AS4 / ebMS 3.0 / TLS 1.3"],
                        ["Sender AP", "ap.kasaadvisory.com (PAE001045)"],
                        ["Network", "OpenPeppol TEST Network"],
                      ].filter(([, v]) => v).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-gray-400 shrink-0 w-28">{k}</span>
                          <span className="text-gray-800 font-mono truncate">{v as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* C3 NRR receipt */}
                  <div className="bg-white rounded-xl border border-emerald-100 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">C3 → C2</span>
                      <span className="text-xs font-semibold text-gray-700">Non-Repudiation Receipt (NRR)</span>
                      <CheckCircle size={13} className="text-emerald-500 ml-auto" />
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 text-xs">
                      {[
                        ["NRR Message ID", c3?.message_id],
                        ["Ref To Message ID", c3?.ref_to_message_id ?? doc.c3_message_id],
                        ["Receipt Type", "eb:Receipt / AS4 NRR"],
                        ["Confirmation", "Confirmed received by C3 AP"],
                      ].filter(([, v]) => v).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-gray-400 shrink-0 w-28">{k}</span>
                          <span className={`font-mono truncate ${k === "Ref To Message ID" ? "text-[#7C01ED] font-semibold" : "text-gray-800"}`}>
                            {v as string}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* C4 status */}
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">C4</span>
                      <span className="text-xs font-semibold text-gray-700">Buyer ERP Response (MLR)</span>
                      <Clock size={13} className="text-gray-400 ml-auto" />
                    </div>
                    <p className="text-xs text-gray-500 italic">
                      Staging — C4 MLR response not required for TEST network. C4 response N/A confirmed.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <AlertCircle size={14} />
                  {current === "send_failed"
                    ? "No C3 receipt — document failed to transmit."
                    : "Awaiting AS4 transmission and C3 receipt."}
                </div>
              )}
            </div>
          )}

          {/* Tax reporting */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Tax Reporting (Track B)</h2>
            <div className="space-y-3 text-xs">
              {([
                ["TDD Generated", doc.tdd_generated],
                ["Sent to FTA C5", doc.tdd_sent],
              ] as [string, boolean][]).map(([label, val]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">{label}</span>
                  {val
                    ? <span className="flex items-center gap-1 text-emerald-700 font-bold"><CheckCircle size={13} /> Yes</span>
                    : <span className="flex items-center gap-1 text-gray-400"><Clock size={13} /> Pending</span>}
                </div>
              ))}
              {doc.mls_status && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-gray-600 font-medium">MLS Status</span>
                  <span className="text-emerald-700 font-mono font-bold">{doc.mls_status}</span>
                </div>
              )}
              {doc.tdd_sent && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-[11px] text-gray-400 italic">
                    FTA sandbox credentials pending — TDD queued for C5 submission.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Retry */}
          {doc.direction === "outbound" && current === "send_failed" && (
            <button onClick={resend} disabled={resending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold disabled:opacity-50">
              <RotateCcw size={14} className={resending ? "animate-spin" : ""} />
              {resending ? "Retrying…" : "Retry Send"}
            </button>
          )}
        </div>

        {/* ════════ RIGHT — Pipeline (2/5) ════════ */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-6">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Status Pipeline</h2>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Peppol 5-Corner
              </span>
            </div>

            <div className="relative">
              <div className="absolute left-3.5 top-4 bottom-4 w-px bg-gray-100" />
              <div className="space-y-0.5">
                {pipeline.map((stage) => {
                  if (FAILURE_KEYS.has(stage.key) && current !== stage.key) return null;
                  if (stage.key === "c4_response_not_expected" && (completed.has("accepted_c4") || completed.has("rejected_c4"))) return null;
                  if ((stage.key === "accepted_c4" || stage.key === "awaiting_c4_response") && completed.has("c4_response_not_expected") && !completed.has("accepted_c4")) return null;

                  const done = completed.has(stage.key);
                  const isCurr = stage.key === current;
                  const event = [...history].reverse().find(h => h.status === stage.key);
                  const Icon = stage.icon;
                  const colorCls = done ? COLOR_MAP[stage.color] : "bg-gray-50 text-gray-300";

                  const c3Time = (stage.key === "as4_receipt_received" || stage.key === "delivered_to_c3") && hasC3
                    ? c3?.timestamp ?? null : null;

                  const showSection = stage.section && stage.section !== lastSection;
                  if (stage.section) lastSection = stage.section;

                  return (
                    <div key={stage.key}>
                      {showSection && (
                        <div className="flex items-center gap-2 pt-3 pb-1 pl-9">
                          <span className="text-[9px] font-bold text-[#7C01ED] uppercase tracking-wider whitespace-nowrap">
                            {stage.section}
                          </span>
                          <div className="flex-1 h-px bg-purple-100" />
                        </div>
                      )}
                      <div className="flex items-start gap-3 py-2 relative">
                        <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${colorCls}`}>
                          <Icon size={12} />
                        </div>
                        <div className="flex-1 pt-0.5 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <span className={`text-xs font-semibold leading-tight ${done ? "text-gray-900" : "text-gray-400"}`}>
                              {stage.label}
                            </span>
                            {(event || c3Time) && (
                              <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">
                                {formatTimeOnly(event?.created_at ?? c3Time ?? "")}
                              </span>
                            )}
                          </div>
                          {(stage.key === "as4_receipt_received") && hasC3 && c3?.message_id && (
                            <p className="text-[10px] text-gray-500 font-mono mt-0.5 truncate" title={c3.message_id}>
                              {c3.message_id}
                            </p>
                          )}
                          {stage.key === "fta_connector_not_configured" && done && (
                            <p className="text-[10px] text-gray-400 mt-0.5 italic">FTA sandbox pending</p>
                          )}
                          {event?.notes && (
                            <p className="text-[10px] text-gray-500 mt-0.5 font-mono leading-relaxed truncate" title={event.notes}>
                              {event.notes.slice(0, 80)}
                            </p>
                          )}
                          {isCurr && !done && !FAILURE_KEYS.has(stage.key) && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#7C01ED] mt-0.5">
                              <Clock size={9} /> Current
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Peppol model legend */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                <span className="font-semibold text-gray-600">5-Corner Model:</span>{" "}
                C1 Seller · C2 KASA AP · C3 Buyer AP · C4 Buyer ERP · C5 FTA
              </p>
              <div className="flex gap-3 mt-2">
                {[["Track A", "Peppol Network"], ["Track B", "FTA Reporting"]].map(([t, d]) => (
                  <div key={t} className="text-[10px]">
                    <span className="font-semibold text-[#7C01ED]">{t}</span>
                    <span className="text-gray-400"> — {d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}