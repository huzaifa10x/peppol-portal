"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { tenantApi, DBDocument } from "@/lib/api";
import { Plus, RefreshCw, Send, XCircle, Clock, CheckCircle, RotateCcw } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

function fmt(n: number) {
  return new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2 }).format(n);
}

const STATUS_COLORS: Record<string, string> = {
  sent:        "bg-green-100 text-green-700",
  acknowledged:"bg-green-100 text-green-700",
  send_failed: "bg-red-100 text-red-700",
  draft:       "bg-gray-100 text-gray-600",
  validated:   "bg-blue-100 text-blue-700",
};

export default function OutboundPage() {
  const router  = useRouter();
  const [docs, setDocs]       = useState<DBDocument[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState<string | null>(null);
  const [offset, setOffset]   = useState(0);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const r = await tenantApi.documents({ direction: "outbound", limit: LIMIT, offset });
    setDocs(r.documents);
    setTotal(r.total);
    setLoading(false);
  }, [offset]);

  useEffect(() => { load(); }, [load]);

  const resend = async (doc: DBDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    setResending(doc.id);
    const r = await tenantApi.resendInvoice(doc.id).catch(() => null);
    await load();
    setResending(null);
  };

  const stats = {
    sent:   docs.filter(d => d.status === "sent" || d.status === "acknowledged").length,
    failed: docs.filter(d => d.status === "send_failed").length,
    draft:  docs.filter(d => d.status === "draft").length,
    total:  docs.reduce((s, d) => s + (d.payable_amount ?? 0), 0),
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outbound Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} sent · AED {fmt(stats.total)} total value
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load}
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50">
            <RefreshCw size={14} className={loading ? "animate-spin text-blue-500" : "text-gray-400"} />
          </button>
          <button onClick={() => router.push("/create-invoice")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
            <Plus size={14} /> New Invoice
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Sent",    value: stats.sent,   icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
          { label: "Failed",  value: stats.failed, icon: XCircle,     color: "text-red-500",   bg: "bg-red-50" },
          { label: "Draft",   value: stats.draft,  icon: Clock,       color: "text-gray-500",  bg: "bg-gray-100" },
          { label: "Total docs", value: total,     icon: Send,        color: "text-blue-600",  bg: "bg-blue-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">{label}</span>
              <div className={`${bg} p-1 rounded`}>
                <Icon size={12} className={color} />
              </div>
            </div>
            <div className={`text-xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Invoice #", "Buyer", "Buyer TIN", "Amount (AED)", "Issue Date", "Status", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">Loading...</td></tr>
            ) : docs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <Send size={24} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No outbound invoices yet</p>
                  <button onClick={() => router.push("/create-invoice")}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
                    Create First Invoice
                  </button>
                </td>
              </tr>
            ) : docs.map(doc => (
              <tr key={doc.id}
                onClick={() => router.push(`/invoices/${doc.id}`)}
                className="cursor-pointer hover:bg-blue-50 transition-colors">
                <td className="px-4 py-3 text-xs font-mono font-medium text-blue-700">
                  {doc.invoice_number ?? "—"}
                </td>
                <td className="px-4 py-3 text-xs text-gray-700">{doc.buyer_name ?? "—"}</td>
                <td className="px-4 py-3 text-xs font-mono text-gray-500">{doc.buyer_tax_id ?? "—"}</td>
                <td className="px-4 py-3 text-xs font-semibold text-gray-800">
                  {doc.payable_amount ? fmt(doc.payable_amount) : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{doc.issue_date ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    STATUS_COLORS[doc.status] ?? "bg-gray-100 text-gray-600"
                  }`}>{doc.status}</span>
                </td>
                <td className="px-4 py-3">
                  {doc.status === "send_failed" && (
                    <button
                      onClick={e => resend(doc, e)}
                      disabled={resending === doc.id}
                      className="flex items-center gap-1 px-2 py-1 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg text-xs hover:bg-orange-100 disabled:opacity-50">
                      <RotateCcw size={10} className={resending === doc.id ? "animate-spin" : ""} />
                      {resending === doc.id ? "Sending..." : "Retry"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <span className="text-xs text-gray-400">
            {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setOffset(Math.max(0, offset - LIMIT))} disabled={offset === 0}
              className="px-3 py-1 text-xs border border-gray-200 rounded bg-white disabled:opacity-40 hover:bg-gray-50">
              Previous
            </button>
            <button onClick={() => setOffset(offset + LIMIT)} disabled={offset + LIMIT >= total}
              className="px-3 py-1 text-xs border border-gray-200 rounded bg-white disabled:opacity-40 hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
