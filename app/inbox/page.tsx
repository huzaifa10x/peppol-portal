"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/lib/session";
import { useRouter } from "next/navigation";
import { DBDocument } from "@/lib/api";
import { RefreshCw, FileText, Search } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

function fmt(n: number) {
  return new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2 }).format(n);
}

interface FilterBtnProps {
  label: string;
  active: boolean;
  onClick: () => void;
}
function FilterBtn({ label, active, onClick }: FilterBtnProps) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${active ? "bg-[#7C01ED] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}>
      {label}
    </button>
  );
}

export default function InboxPage() {
  const { data: session } = useSession();
  const tenantId = (session?.user as any)?.tenant_id ?? "";
  const router = useRouter();

  const [docs, setDocs] = useState<DBDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filters, setFilters] = useState({ direction: "inbound", participant_type: "", doc_type: "" });
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const params = new URLSearchParams({ limit: String(LIMIT), offset: String(offset), tenant_id: tenantId });
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const r = await fetch(`${BASE}/tenant/documents?${params}`, {
      credentials: "include",
    }).then(r => r.json());
    setDocs(r.documents ?? []);
    setTotal(r.total ?? 0);
    setLoading(false);
  }, [filters, offset, tenantId]);

  useEffect(() => { load(); }, [load]);

  const sync = async () => {
    setSyncing(true);
    await fetch(`${BASE}/sync/inbox`, { method: "POST", credentials: "include" },);
    await load();
    setSyncing(false);
  };

  const setFilter = (field: string, value: string) =>
    setFilters(f => ({ ...f, [field]: f[field as keyof typeof f] === value ? "" : value }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} documents</p>
        </div>
        <button onClick={sync} disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border-[#7C01ED] border text-[#7C01ED] disabled:opacity-50">
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing..." : "Sync Inbox"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <FilterBtn label="Inbound" active={filters.direction === "inbound"} onClick={() => setFilter("direction", "inbound")} />
        <FilterBtn label="Outbound" active={filters.direction === "outbound"} onClick={() => setFilter("direction", "outbound")} />
        <FilterBtn label="Billing" active={filters.participant_type === "billing"} onClick={() => setFilter("participant_type", "billing")} />
        <FilterBtn label="Self-Billing" active={filters.participant_type === "selfbilling"} onClick={() => setFilter("participant_type", "selfbilling")} />
        <FilterBtn label="Invoice" active={filters.doc_type === "invoice"} onClick={() => setFilter("doc_type", "invoice")} />
        <FilterBtn label="Credit Note" active={filters.doc_type === "credit_note"} onClick={() => setFilter("doc_type", "credit_note")} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Type", "Invoice #", "Supplier", "Buyer", "Amount (AED)", "Date", "Status"].map(h => (
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
                  <FileText size={24} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No documents found</p>
                </td>
              </tr>
            ) : docs.map(doc => (
              <tr key={doc.id} onClick={() => router.push(`/invoices/${doc.id}`)}
                className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${doc.participant_type === "billing" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                      }`}>{doc.participant_type === "billing" ? "B" : "SB"}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${doc.direction === "outbound" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"
                      }`}>{doc.direction === "outbound" ? "OUT" : "IN"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs font-mono text-gray-600">{doc.invoice_number ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-gray-700">{doc.supplier_name ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-gray-700">{doc.buyer_name ?? "—"}</td>
                <td className="px-4 py-3 text-xs font-medium">{doc.payable_amount ? fmt(doc.payable_amount) : "—"}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{doc.issue_date ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${doc.status === "validated" ? "bg-blue-100 text-blue-700" :
                    doc.status === "send_failed" || doc.status === "rejected" ? "bg-red-100 text-red-700" :
                      doc.status === "received" ? "bg-sky-100 text-sky-700" :
                      doc.status === "sent" || doc.status === "acknowledged" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-600"
                    }`}>{doc.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <span className="text-xs text-gray-400">{offset + 1}–{Math.min(offset + LIMIT, total)} of {total}</span>
          <div className="flex gap-2">
            <button onClick={() => setOffset(Math.max(0, offset - LIMIT))} disabled={offset === 0}
              className="px-3 py-1 text-xs border border-gray-200 rounded bg-white disabled:opacity-40 hover:bg-gray-50">Previous</button>
            <button onClick={() => setOffset(offset + LIMIT)} disabled={offset + LIMIT >= total}
              className="px-3 py-1 text-xs border border-gray-200 rounded bg-white disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
