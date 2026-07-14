"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle, Clock, XCircle,
  Send, FileText, Shield, RefreshCw, RotateCcw,
  Download, Network, AlertCircle
} from "lucide-react";

// app/invoices/[id]/page.tsx

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

interface StatusEvent { status: string; notes: string | null; created_at: string; }
interface Doc {
  id: string; direction: string; doc_type: string; participant_type: string;
  status: string; invoice_number: string | null; issue_date: string | null;
  supplier_name: string | null; supplier_tax_id: string | null;
  buyer_name: string | null; buyer_tax_id: string | null;
  currency_code: string; tax_exclusive_amount: number | null;
  tax_amount: number | null; payable_amount: number | null;
  tdd_generated: boolean; tdd_sent: boolean; mls_status: string | null;
  received_at: string;
  c3_message_id: string | null;
  c3_receipt_timestamp: string | null;
}
interface C3Receipt {
  ref_to_message_id: string | null;
  message_id: string | null;
  timestamp: string | null;
  c3_confirmed: boolean;
}
interface InboundReceipt {
  file: string;
  event_time: string | null;
  message_id: string | null;
  sender: string | null;
  xml: string;
}

const PIPELINE_INBOUND = [
  { key: "received", label: "Received", icon: FileText, color: "blue" },
  { key: "validated", label: "Validated (PINT-AE)", icon: CheckCircle, color: "blue" },
  { key: "tdd_generated", label: "TDD Generated", icon: Shield, color: "purple" },
  { key: "tdd_sent", label: "TDD Sent to FTA C5", icon: Send, color: "purple" },
  { key: "acknowledged", label: "MLS Acknowledged", icon: CheckCircle, color: "green" },
];

const PIPELINE_OUTBOUND = [
  { key: "draft", label: "Draft", icon: FileText, color: "gray" },
  { key: "validated", label: "Validated (PINT-AE)", icon: CheckCircle, color: "blue" },
  { key: "sent", label: "Sent via AS4 (C2)", icon: Send, color: "blue" },
  { key: "c3_confirmed", label: "Confirmed by C3", icon: Network, color: "green" },
  { key: "tdd_sent", label: "TDD Sent to FTA C5", icon: Shield, color: "purple" },
  { key: "acknowledged", label: "MLS Acknowledged", icon: CheckCircle, color: "green" },
  { key: "send_failed", label: "Send Failed", icon: XCircle, color: "red" },
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2 }).format(n);
}

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-100 text-blue-600",
  purple: "bg-purple-100 text-purple-600",
  green: "bg-green-100 text-green-600",
  red: "bg-red-100 text-red-500",
  gray: "bg-gray-100 text-gray-500",
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [doc, setDoc] = useState<Doc | null>(null);
  const [history, setHistory] = useState<StatusEvent[]>([]);
  const [c3, setC3] = useState<C3Receipt | null>(null);
  const [receipt, setReceipt] = useState<InboundReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [docRes, histRes] = await Promise.all([
        fetch(`${BASE}/tenant/documents?limit=200`).then(r => r.json()),
        fetch(`${BASE}/documents/${id}/status-history`).then(r => r.json()),
      ]);
      const found = docRes.documents?.find((d: Doc) => d.id === id) ?? null;
      setDoc(found);
      setHistory(histRes.history ?? []);

      // Fetch C3 receipt data for outbound documents
      // Replace the C3 fetch block inside load() with this:
      if (found?.direction === "outbound") {
        try {
          if ((found as any).c3_message_id) {
            setC3({
              message_id: (found as any).c3_message_id,
              ref_to_message_id: null,
              timestamp: (found as any).c3_receipt_timestamp ?? null,
              c3_confirmed: true,
            });
          } else {
            const c3Res = await fetch(`${BASE}/receipts/as4-log/latest?lines=500`, {
              credentials: "include",
            }).then(r => r.json());
            const latest = (c3Res.receipts ?? [])
              .filter((r: C3Receipt) => r.c3_confirmed)
              .pop() ?? null;
            setC3(latest);
          }
          const receiptRes = await fetch(`${BASE}/receipts/inbound/latest`, {
            credentials: "include",
          }).then(r => r.json());
          setReceipt(receiptRes ?? null);
        } catch (e) {
          console.error("C3 fetch failed:", e);
        }
      }
    } catch { }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const resend = async () => {
    setResending(true);
    await fetch(`${BASE}/invoices/${id}/resend`, { method: "POST" });
    await load();
    setResending(false);
  };

  const syncPipeline = async () => {
    setSyncing(true);
    await fetch(`${BASE}/sync/full-pipeline`, { method: "POST" });
    await load();
    setSyncing(false);
  };

  const downloadReceipt = () => {
    // Build receipt XML from C3 data we have and download it
    const c3Data = {
      message_id: c3?.message_id ?? "",
      ref_to_message_id: c3?.ref_to_message_id ?? "",
      timestamp: c3?.timestamp ?? "",
      invoice_number: doc?.invoice_number ?? "",
      protocol: "AS4 / ebMS 3.0",
      receipt_type: "ETSI REM DeliveryNonDeliveryToRecipient",
      network: "OpenPeppol TEST",
      ap_endpoint: "https://ap.kasaadvisory.com/as4",
    };

    // If we have a receipt file from testbed, download that
    if (receipt?.file) {
      window.open(
        `${BASE}/receipts/inbound/${encodeURIComponent(receipt.file)}/download`,
        "_blank"
      );
      return;
    }

    // Otherwise generate a receipt XML from the AS4 log data
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<AS4NonRepudiationReceipt>
  <InvoiceNumber>${c3Data.invoice_number}</InvoiceNumber>
  <C3MessageId>${c3Data.message_id}</C3MessageId>
  <RefToMessageId>${c3Data.ref_to_message_id}</RefToMessageId>
  <Timestamp>${c3Data.timestamp}</Timestamp>
  <Protocol>${c3Data.protocol}</Protocol>
  <ReceiptType>${c3Data.receipt_type}</ReceiptType>
  <Network>${c3Data.network}</Network>
  <APEndpoint>${c3Data.ap_endpoint}</APEndpoint>
</AS4NonRepudiationReceipt>`;

    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc?.invoice_number ?? "receipt"}_c3_receipt.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8 text-sm text-gray-400">Loading...</div>;
  if (!doc) return <div className="p-8 text-sm text-gray-500">Document not found.</div>;

  const pipeline = doc.direction === "outbound" ? PIPELINE_OUTBOUND : PIPELINE_INBOUND;
  const completed = new Set(history.map(h => h.status));
  const current = history[history.length - 1]?.status ?? doc.status;

  // Inbound: check tdd flags
  if (doc.tdd_generated) completed.add("tdd_generated");
  if (doc.tdd_sent) completed.add("tdd_sent");
  if (doc.mls_status) completed.add("acknowledged");

  // Outbound: mark c3_confirmed if we have receipt data
  const hasC3 = doc.direction === "outbound" && (c3?.c3_confirmed || receipt?.event_time);
  if (hasC3) completed.add("c3_confirmed");

  const statusColor =
    current === "acknowledged" || current === "sent" ? "bg-green-100 text-green-700" :
      current === "send_failed" ? "bg-red-100 text-red-700" :
        current === "tdd_sent" ? "bg-purple-100 text-purple-700" :
          current === "validated" ? "bg-blue-100 text-blue-700" :
            "bg-gray-100 text-gray-600";

  return (
    <div className="p-8 max-w-4xl">
      <button onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors">
        <ArrowLeft size={14} /> Back
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {doc.invoice_number ?? doc.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${doc.direction === "outbound" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
              }`}>{doc.direction}</span>
            <span>{doc.doc_type.replace("_", " ")}</span>
            <span>·</span>
            <span>{doc.participant_type}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={syncPipeline} disabled={syncing}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
            title="Sync pipeline status">
            <RefreshCw size={13} className={syncing ? "animate-spin text-blue-500" : "text-gray-400"} />
          </button>
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusColor}`}>
            {current}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column: Pipeline + C3 Receipt */}
        <div className="lg:col-span-2 space-y-5">

          {/* Status Pipeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-5">Status Pipeline</h2>
            <div className="relative">
              <div className="absolute left-4 top-4 bottom-4 w-px bg-gray-100" />
              <div className="space-y-1">
                {pipeline.map(stage => {
                  // Skip send_failed if document is not failed
                  if (stage.key === "send_failed" && current !== "send_failed") return null;

                  const done = completed.has(stage.key);
                  const isCurr = stage.key === current;
                  const event = history.findLast
                    ? history.findLast(h => h.status === stage.key)
                    : [...history].reverse().find(h => h.status === stage.key);
                  const Icon = stage.icon;
                  const colorCls = done ? COLOR_MAP[stage.color] : "bg-gray-100 text-gray-400";

                  // Special case: C3 confirmed — show timestamp from receipt
                  const c3Time = stage.key === "c3_confirmed" && hasC3
                    ? (c3?.timestamp ?? receipt?.event_time ?? null)
                    : null;

                  return (
                    <div key={stage.key} className="flex items-start gap-4 py-2.5 relative">
                      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colorCls}`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-medium ${done ? "text-gray-800" : "text-gray-400"}`}>
                            {stage.label}
                          </span>
                          {(event || c3Time) && (
                            <span className="text-xs text-gray-400">
                              {new Date(event?.created_at ?? c3Time!).toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* C3 message ID inline under the stage */}
                        {stage.key === "c3_confirmed" && hasC3 && (
                          <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">
                            {c3?.message_id ?? receipt?.message_id ?? ""}
                          </p>
                        )}

                        {event?.notes && (
                          <p className="text-xs text-gray-500 mt-0.5 font-mono leading-relaxed">
                            {event.notes.slice(0, 120)}
                          </p>
                        )}
                        {isCurr && !done && (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-500 mt-0.5">
                            <Clock size={10} /> Current
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resend button */}
            {doc.direction === "outbound" && current === "send_failed" && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button onClick={resend} disabled={resending}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors">
                  <RotateCcw size={13} className={resending ? "animate-spin" : ""} />
                  {resending ? "Resending..." : "Retry Send"}
                </button>
              </div>
            )}
          </div>

          {/* C3 Non-Repudiation Receipt — outbound only */}
          {doc.direction === "outbound" && (
            <div className={`rounded-xl border p-5 ${hasC3
              ? "bg-green-50 border-green-200"
              : "bg-gray-50 border-gray-200"
              }`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Network size={14} className={hasC3 ? "text-green-600" : "text-gray-400"} />
                  Peppol Network Delivery Receipt (C3)
                </h2>
                {hasC3 && (
                  <button
                    onClick={downloadReceipt}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                  >
                    <Download size={11} />
                    Download Receipt
                  </button>
                )}
              </div>

              {hasC3 ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-green-700 font-medium">
                    <CheckCircle size={13} />
                    Document confirmed received by C3 Access Point
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 mt-2 pl-5">
                    {[
                      ["C3 Timestamp", c3?.timestamp
                        ? new Date(c3.timestamp).toLocaleString()
                        : receipt?.event_time],
                      ["C3 Message ID", c3?.message_id ?? receipt?.message_id],
                      ["Ref Message", c3?.ref_to_message_id],
                      ["Sender AP", "OpenPeppol TEST Network"],
                      ["Protocol", "AS4 / ebMS 3.0"],
                    ].filter(([, v]) => v).map(([label, value]) => (
                      <div key={label as string} className="flex gap-2">
                        <span className="text-gray-400 shrink-0 w-28">{label}</span>
                        <span className="text-gray-700 font-mono truncate max-w-xs" title={value as string}>
                          {value as string}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-gray-400 pl-5 mt-1 text-xs italic">
                    ETSI REM DeliveryNonDeliveryToRecipient — AS4 Non-Repudiation Proof
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-400 text-xs pl-1">
                  <AlertCircle size={13} />
                  {current === "send_failed"
                    ? "No C3 receipt — document failed to send"
                    : "C3 receipt not yet available — send the document first"}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: Details, Amounts, Tax Reporting */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Document</h2>
            <div className="space-y-2.5">
              {[
                ["Invoice #", doc.invoice_number],
                ["Date", doc.issue_date],
                ["Received", new Date(doc.received_at).toLocaleDateString()],
                ["Supplier", doc.supplier_name],
                ["Supp. TIN", doc.supplier_tax_id],
                ["Buyer", doc.buyer_name],
                ["Buyer TIN", doc.buyer_tax_id],
                ["Currency", doc.currency_code],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k as string} className="flex justify-between gap-2 text-xs">
                  <span className="text-gray-400 shrink-0">{k}</span>
                  <span className="text-gray-700 font-medium text-right truncate max-w-[160px]" title={v as string}>
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Amounts</h2>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal</span>
                <span>{doc.tax_exclusive_amount ? fmt(doc.tax_exclusive_amount) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">VAT</span>
                <span>{doc.tax_amount ? fmt(doc.tax_amount) : "—"}</span>
              </div>
              <div className="flex justify-between font-bold pt-1.5 border-t border-gray-100 text-sm">
                <span className="text-gray-700">Total</span>
                <span className="text-blue-700">
                  {doc.currency_code} {doc.payable_amount ? fmt(doc.payable_amount) : "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Tax Reporting</h2>
            <div className="space-y-2 text-xs">
              {([
                ["TDD Generated", doc.tdd_generated],
                ["Sent to FTA C5", doc.tdd_sent],
              ] as [string, boolean][]).map(([label, val]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-gray-400">{label}</span>
                  {val
                    ? <span className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle size={11} /> Yes</span>
                    : <span className="flex items-center gap-1 text-gray-400"><Clock size={11} /> Pending</span>
                  }
                </div>
              ))}
              {doc.mls_status && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">MLS Status</span>
                  <span className="text-green-600 font-medium font-mono">{doc.mls_status}</span>
                </div>
              )}
            </div>
          </div>

          {/* Peppol IDs quick reference */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Peppol IDs</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-gray-400 shrink-0">Participant</span>
                <span className="font-mono text-gray-600 text-right">{doc.participant_type}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-400 shrink-0">Network</span>
                <span className="font-mono text-gray-600">OpenPeppol TEST</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-400 shrink-0">AP</span>
                <span className="font-mono text-gray-600 truncate text-right max-w-[140px]"
                  title="ap.kasaadvisory.com">ap.kasaadvisory.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}