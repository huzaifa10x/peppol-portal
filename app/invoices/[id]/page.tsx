"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle, Clock, XCircle,
  Send, FileText, Shield, RefreshCw, RotateCcw
} from "lucide-react";


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
}

const PIPELINE_INBOUND = [
  { key: "received",      label: "Received",        icon: FileText,    color: "blue"   },
  { key: "validated",     label: "Validated",        icon: CheckCircle, color: "blue"   },
  { key: "tdd_generated", label: "TDD Generated",    icon: Shield,      color: "purple" },
  { key: "tdd_sent",      label: "TDD Sent to FTA",  icon: Send,        color: "purple" },
  { key: "acknowledged",  label: "MLS Acknowledged", icon: CheckCircle, color: "green"  },
];

const PIPELINE_OUTBOUND = [
  { key: "draft",         label: "Draft",            icon: FileText,    color: "gray"   },
  { key: "validated",     label: "Validated",        icon: CheckCircle, color: "blue"   },
  { key: "sent",          label: "Sent via Peppol",  icon: Send,        color: "green"  },
  { key: "acknowledged",  label: "Acknowledged",     icon: CheckCircle, color: "green"  },
  { key: "send_failed",   label: "Send Failed",      icon: XCircle,     color: "red"    },
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2 }).format(n);
}

const COLOR_MAP: Record<string, string> = {
  blue:   "bg-blue-100 text-blue-600",
  purple: "bg-purple-100 text-purple-600",
  green:  "bg-green-100 text-green-600",
  red:    "bg-red-100 text-red-500",
  gray:   "bg-gray-100 text-gray-500",
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [doc, setDoc]         = useState<Doc | null>(null);
  const [history, setHistory] = useState<StatusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [docRes, histRes] = await Promise.all([
        fetch(`${BASE}/tenant/documents?limit=200`).then(r => r.json()),
        fetch(`${BASE}/documents/${id}/status-history`).then(r => r.json()),
      ]);
      const found = docRes.documents?.find((d: Doc) => d.id === id);
      setDoc(found ?? null);
      setHistory(histRes.history ?? []);
    } catch {}
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

  if (loading) return <div className="p-8 text-sm text-gray-400">Loading...</div>;
  if (!doc)    return <div className="p-8 text-sm text-gray-500">Document not found.</div>;

  const pipeline  = doc.direction === "outbound" ? PIPELINE_OUTBOUND : PIPELINE_INBOUND;
  const completed = new Set(history.map(h => h.status));
  const current   = history[history.length - 1]?.status ?? doc.status;

  // For inbound, also check tdd flags
  if (doc.tdd_generated) completed.add("tdd_generated");
  if (doc.tdd_sent)      completed.add("tdd_sent");
  if (doc.mls_status)    completed.add("acknowledged");

  const statusColor =
    current === "acknowledged" || current === "sent" ? "bg-green-100 text-green-700" :
    current === "send_failed"                        ? "bg-red-100 text-red-700" :
    current === "tdd_sent"                           ? "bg-purple-100 text-purple-700" :
    current === "validated"                          ? "bg-blue-100 text-blue-700" :
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
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              doc.direction === "outbound" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
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
        {/* Pipeline */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-5">Status Pipeline</h2>
            <div className="relative">
              <div className="absolute left-4 top-4 bottom-4 w-px bg-gray-100" />
              <div className="space-y-1">
                {pipeline.map(stage => {
                  const done    = completed.has(stage.key);
                  const isCurr  = stage.key === current;
                  const event   = history.findLast
                    ? history.findLast(h => h.status === stage.key)
                    : [...history].reverse().find(h => h.status === stage.key);
                  const Icon    = stage.icon;
                  const colorCls = done ? COLOR_MAP[stage.color] : "bg-gray-100 text-gray-400";

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
                          {event && (
                            <span className="text-xs text-gray-400">
                              {new Date(event.created_at).toLocaleString()}
                            </span>
                          )}
                        </div>
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

            {/* Resend button for failed outbound */}
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
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Document</h2>
            <div className="space-y-2.5">
              {[
                ["Invoice #",  doc.invoice_number],
                ["Date",       doc.issue_date],
                ["Supplier",   doc.supplier_name],
                ["Supp. TIN",  doc.supplier_tax_id],
                ["Buyer",      doc.buyer_name],
                ["Buyer TIN",  doc.buyer_tax_id],
                ["Currency",   doc.currency_code],
              ].filter(([,v]) => v).map(([k, v]) => (
                <div key={k as string} className="flex justify-between gap-2 text-xs">
                  <span className="text-gray-400 shrink-0">{k}</span>
                  <span className="text-gray-700 font-medium text-right truncate max-w-[160px]" title={v as string}>{v}</span>
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
              {[
                ["TDD Generated", doc.tdd_generated],
                ["Sent to FTA",   doc.tdd_sent],
              ].map(([label, val]) => (
                <div key={label as string} className="flex items-center justify-between">
                  <span className="text-gray-400">{label as string}</span>
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
        </div>
      </div>
    </div>
  );
}
