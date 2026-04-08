"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { dbApi, DBDocument } from "@/lib/api";
import { ArrowLeft, CheckCircle, Clock, XCircle, Send, FileText } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

interface StatusEvent {
  status: string;
  notes: string | null;
  created_at: string;
}

const STATUS_PIPELINE = [
  { key: "draft",          label: "Draft",           icon: FileText,     color: "gray" },
  { key: "received",       label: "Received",        icon: CheckCircle,  color: "blue" },
  { key: "validated",      label: "Validated",       icon: CheckCircle,  color: "blue" },
  { key: "tdd_generated",  label: "TDD Generated",   icon: CheckCircle,  color: "purple" },
  { key: "tdd_sent",       label: "TDD Sent to FTA", icon: Send,         color: "purple" },
  { key: "sent",           label: "Sent",            icon: Send,         color: "green" },
  { key: "acknowledged",   label: "Acknowledged",    icon: CheckCircle,  color: "green" },
  { key: "send_failed",    label: "Send Failed",     icon: XCircle,      color: "red" },
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2 }).format(n);
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [doc, setDoc]         = useState<DBDocument | null>(null);
  const [history, setHistory] = useState<StatusEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [docs, hist] = await Promise.all([
          dbApi.documents({ limit: 200 }),
          fetch(`${BASE}/documents/${id}/status-history`).then(r => r.json()),
        ]);
        const found = docs.documents.find(d => d.id === id);
        setDoc(found ?? null);
        setHistory(hist.history ?? []);
      } catch {}
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return (
    <div className="p-8 text-sm text-gray-400">Loading...</div>
  );
  if (!doc) return (
    <div className="p-8 text-sm text-gray-500">Document not found.</div>
  );

  const completedStatuses = new Set(history.map(h => h.status));
  const currentStatus = history[history.length - 1]?.status ?? doc.status;

  return (
    <div className="p-8 max-w-4xl">
      <button onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to Invoices
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {doc.invoice_number ?? doc.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {doc.doc_type === "invoice" ? "Invoice" : "Credit Note"} ·
            {doc.participant_type} · {doc.direction}
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
          currentStatus === "acknowledged" || currentStatus === "sent"
            ? "bg-green-100 text-green-700"
            : currentStatus === "send_failed"
            ? "bg-red-100 text-red-700"
            : currentStatus === "tdd_sent"
            ? "bg-purple-100 text-purple-700"
            : "bg-blue-100 text-blue-700"
        }`}>{currentStatus}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status pipeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-5">Status Pipeline</h2>
            <div className="relative">
              {/* Pipeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
              <div className="space-y-4">
                {STATUS_PIPELINE.filter(s =>
                  s.key !== "send_failed" || completedStatuses.has("send_failed")
                ).map((stage, idx) => {
                  const completed  = completedStatuses.has(stage.key);
                  const isCurrent  = stage.key === currentStatus;
                  const event      = history.find(h => h.status === stage.key);
                  const Icon       = stage.icon;
                  return (
                    <div key={stage.key} className="flex items-start gap-4 relative">
                      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        completed
                          ? stage.color === "green"  ? "bg-green-100"
                          : stage.color === "purple" ? "bg-purple-100"
                          : stage.color === "red"    ? "bg-red-100"
                          : "bg-blue-100"
                          : "bg-gray-100"
                      }`}>
                        <Icon size={14} className={
                          completed
                            ? stage.color === "green"  ? "text-green-600"
                            : stage.color === "purple" ? "text-purple-600"
                            : stage.color === "red"    ? "text-red-500"
                            : "text-blue-600"
                            : "text-gray-400"
                        } />
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${
                            completed ? "text-gray-800" : "text-gray-400"
                          }`}>{stage.label}</span>
                          {event && (
                            <span className="text-xs text-gray-400">
                              {new Date(event.created_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {event?.notes && (
                          <p className="text-xs text-gray-500 mt-0.5 font-mono">
                            {event.notes.slice(0, 100)}
                          </p>
                        )}
                        {isCurrent && !completed && (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-600 mt-1">
                            <Clock size={10} /> Current status
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Document details */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Document Info</h2>
            <div className="space-y-2.5 text-xs">
              {[
                ["Invoice #",    doc.invoice_number],
                ["Issue Date",   doc.issue_date],
                ["Currency",     doc.currency_code],
                ["Supplier",     doc.supplier_name],
                ["Supplier TIN", doc.supplier_tax_id],
                ["Buyer",        doc.buyer_name],
                ["Buyer TIN",    doc.buyer_tax_id],
              ].filter(([,v]) => v).map(([k, v]) => (
                <div key={k as string} className="flex justify-between gap-2">
                  <span className="text-gray-400 shrink-0">{k}</span>
                  <span className="text-gray-700 font-medium text-right truncate">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Amounts</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-gray-700">
                  {doc.tax_exclusive_amount ? fmt(doc.tax_exclusive_amount) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">VAT</span>
                <span className="text-gray-700">
                  {doc.tax_amount ? fmt(doc.tax_amount) : "—"}
                </span>
              </div>
              <div className="flex justify-between font-semibold pt-1.5 border-t border-gray-100">
                <span className="text-gray-700">Total</span>
                <span className="text-blue-700 text-sm">
                  {doc.currency_code} {doc.payable_amount ? fmt(doc.payable_amount) : "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Tax Reporting</h2>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">TDD Generated</span>
                {doc.tdd_generated
                  ? <span className="text-green-600 flex items-center gap-1"><CheckCircle size={11} /> Yes</span>
                  : <span className="text-gray-400 flex items-center gap-1"><Clock size={11} /> Pending</span>
                }
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Sent to UAE FTA</span>
                {doc.tdd_sent
                  ? <span className="text-green-600 flex items-center gap-1"><CheckCircle size={11} /> Yes</span>
                  : <span className="text-gray-400 flex items-center gap-1"><Clock size={11} /> Pending</span>
                }
              </div>
              {doc.mls_status && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">MLS Status</span>
                  <span className="text-gray-700 font-mono">{doc.mls_status}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
