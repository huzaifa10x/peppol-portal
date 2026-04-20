"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/lib/session";
import { useRouter } from "next/navigation";
import { DBDocument } from "@/lib/api";
import { Download, Search, RefreshCw, FileText } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

function fmt(n: number) {
  return new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2 }).format(n);
}

function exportCSV(docs: DBDocument[]) {
  const headers = ["Invoice #", "Type", "Direction", "Supplier", "Buyer", "Amount", "Status", "Date"];
  const rows = docs.map(d => [
    d.invoice_number ?? "", d.doc_type, d.direction,
    d.supplier_name ?? "", d.buyer_name ?? "",
    d.payable_amount ?? "", d.status, d.issue_date ?? ""
  ]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `invoices-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

export default function InvoicesPage() {
  const { data: session } = useSession();
  const tenantId = (session?.user as any)?.tenant_id ?? "";
  const router = useRouter();

  const [docs, setDocs]         = useState<DBDocument[]>([]);
  const [filtered, setFiltered] = useState<DBDocument[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [docType, setDocType]   = useState("");
  const [participant, setParticipant] = useState("");

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const params = new URLSearchParams({ limit: "200", tenant_id: tenantId });
    if (docType)    params.set("doc_type", docType);
    if (participant) params.set("participant_type", participant);
    const r = await fetch(`${BASE}/tenant/documents?${params}`).then(r => r.json());
    setDocs(r.documents ?? []);
    setLoading(false);
  }, [tenantId, docType, participant]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!search) { setFiltered(docs); return; }
    const s = search.toLowerCase();
    setFiltered(docs.filter(d =>
      d.invoice_number?.toLowerCase().includes(s) ||
      d.supplier_name?.toLowerCase().includes(s) ||
      d.buyer_name?.toLowerCase().includes(s) ||
      d.buyer_tax_id?.toLowerCase().includes(s)
    ));
  }, [search, docs]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} documents</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportCSV(filtered)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={load}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50">
            <RefreshCw size={14} className={loading ? "animate-spin text-blue-500" : "text-gray-400"} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-2.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search invoices..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={docType} onChange={e => setDocType(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Types</option>
          <option value="invoice">Invoice</option>
          <option value="credit_note">Credit Note</option>
        </select>
        <select value={participant} onChange={e => setParticipant(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Participants</option>
          <option value="billing">Billing</option>
          <option value="selfbilling">Self-Billing</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Type", "Invoice #", "Supplier", "Buyer", "Amount (AED)", "Date", "Status", "TDD"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center">
                  <FileText size={24} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No invoices found</p>
                </td>
              </tr>
            ) : filtered.map(doc => (
              <tr key={doc.id} onClick={() => router.push(`/invoices/${doc.id}`)}
                className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      doc.participant_type === "billing" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    }`}>{doc.participant_type === "billing" ? "B" : "SB"}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      doc.direction === "outbound" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"
                    }`}>{doc.direction === "outbound" ? "OUT" : "IN"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs font-mono text-gray-600">{doc.invoice_number ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-gray-700">{doc.supplier_name ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-gray-700">{doc.buyer_name ?? "—"}</td>
                <td className="px-4 py-3 text-xs font-medium">{doc.payable_amount ? fmt(doc.payable_amount) : "—"}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{doc.issue_date ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    doc.status === "sent" || doc.status === "acknowledged" ? "bg-green-100 text-green-700" :
                    doc.status === "send_failed" ? "bg-red-100 text-red-700" :
                    doc.status === "validated" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>{doc.status}</span>
                </td>
                <td className="px-4 py-3">
                  {doc.tdd_sent
                    ? <span className="text-xs text-green-600 font-medium">✓ Sent</span>
                    : <span className="text-xs text-gray-400">—</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
