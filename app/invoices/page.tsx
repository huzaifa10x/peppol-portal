"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { dbApi, DBDocument } from "@/lib/api";
import { Download, Search, RefreshCw, FileText, X } from "lucide-react";

function fmt(n: number) {
  return new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2 }).format(n);
}

function exportCSV(docs: DBDocument[]) {
  const headers = [
    "ID", "Type", "Participant", "Invoice #", "Issue Date",
    "Supplier Name", "Supplier TIN", "Buyer Name", "Buyer TIN",
    "Currency", "Subtotal", "Tax", "Total", "Status", "TDD Sent"
  ];
  const rows = docs.map(d => [
    d.id, d.doc_type, d.participant_type, d.invoice_number ?? "",
    d.issue_date ?? "", d.supplier_name ?? "", d.supplier_tax_id ?? "",
    d.buyer_name ?? "", d.buyer_tax_id ?? "", d.currency_code,
    d.tax_exclusive_amount ?? "", d.tax_amount ?? "", d.payable_amount ?? "",
    d.status, d.tdd_sent
  ]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a"); a.href = url;
  a.download = `peppol-invoices-${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

export default function InvoicesPage() {
  const [docs, setDocs]           = useState<DBDocument[]>([]);
  const [allDocs, setAllDocs]     = useState<DBDocument[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<DBDocument | null>(null);
  const [search, setSearch]       = useState("");
  const [docType, setDocType]     = useState<"" | "invoice" | "credit_note">("");
  const [participant, setParticipant] = useState<"" | "billing" | "selfbilling">("");
  const [offset, setOffset]       = useState(0);
  const LIMIT = 25;
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number> = { limit: 200 };
    if (docType)      params.doc_type = docType;
    if (participant)  params.participant_type = participant;
    const r = await dbApi.documents(params);
    setAllDocs(r.documents);
    setTotal(r.total);
    setLoading(false);
  }, [docType, participant]);

  useEffect(() => { load(); }, [load]);

  // Client-side search filter
  useEffect(() => {
    if (!search) {
      setDocs(allDocs);
      return;
    }
    const q = search.toLowerCase();
    setDocs(allDocs.filter(d =>
      d.invoice_number?.toLowerCase().includes(q) ||
      d.supplier_name?.toLowerCase().includes(q) ||
      d.buyer_name?.toLowerCase().includes(q) ||
      d.supplier_tax_id?.toLowerCase().includes(q) ||
      d.buyer_tax_id?.toLowerCase().includes(q)
    ));
  }, [search, allDocs]);

  const paginated = docs.slice(offset, offset + LIMIT);

  const totalSelected = docs.reduce((s, d) => s + (d.payable_amount ?? 0), 0);
  const taxSelected   = docs.reduce((s, d) => s + (d.tax_amount ?? 0), 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {docs.length} documents · {fmt(totalSelected)} AED total · {fmt(taxSelected)} AED tax
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50">
            <RefreshCw size={14} className={loading ? "animate-spin text-blue-500" : "text-gray-400"} />
          </button>
          <button onClick={() => exportCSV(docs)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setOffset(0); }}
            placeholder="Search invoice #, supplier, buyer, TIN..."
            className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Doc type filter */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(["", "invoice", "credit_note"] as const).map(t => (
            <button key={t} onClick={() => { setDocType(t); setOffset(0); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                docType === t
                  ? "bg-white shadow-sm text-gray-800"
                  : "text-gray-500 hover:text-gray-700"
              }`}>
              {t === "" ? "All" : t === "invoice" ? "Invoices" : "Credit Notes"}
            </button>
          ))}
        </div>

        {/* Participant filter */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(["", "billing", "selfbilling"] as const).map(p => (
            <button key={p} onClick={() => { setParticipant(p); setOffset(0); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                participant === p
                  ? "bg-white shadow-sm text-gray-800"
                  : "text-gray-500 hover:text-gray-700"
              }`}>
              {p === "" ? "All" : p === "billing" ? "Billing" : "Self-billing"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        {/* Main table */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden min-w-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  "Type", "Invoice #", "Supplier Name", "Supplier TIN",
                  "Buyer Name", "Buyer TIN", "Amount (AED)", "Tax (AED)", "Date", "Status"
                ].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-3 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-gray-400">
                    No documents match your filters
                  </td>
                </tr>
              ) : paginated.map(doc => (
                <tr key={doc.id} onClick={() => router.push(`/invoices/${doc.id}`)}
                  className={`cursor-pointer hover:bg-blue-50 transition-colors ${
                    selected?.id === doc.id ? "bg-blue-50" : ""
                  }`}>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        doc.participant_type === "billing"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}>{doc.participant_type === "billing" ? "B" : "SB"}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        doc.doc_type === "invoice"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>{doc.doc_type === "invoice" ? "INV" : "CN"}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs font-mono text-gray-600 max-w-[100px]">
                    <span className="truncate block">{doc.invoice_number ?? "—"}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-700">{doc.supplier_name ?? "—"}</td>
                  <td className="px-3 py-2.5 text-xs font-mono text-gray-500">{doc.supplier_tax_id ?? "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-700">{doc.buyer_name ?? "—"}</td>
                  <td className="px-3 py-2.5 text-xs font-mono text-gray-500">{doc.buyer_tax_id ?? "—"}</td>
                  <td className="px-3 py-2.5 text-xs font-semibold text-gray-800 text-right">
                    {doc.payable_amount ? fmt(doc.payable_amount) : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-600 text-right">
                    {doc.tax_amount ? fmt(doc.tax_amount) : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{doc.issue_date ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      doc.tdd_sent
                        ? "bg-purple-100 text-purple-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {doc.tdd_sent ? "TDD sent" : doc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <span className="text-xs text-gray-400">
              Showing {Math.min(offset + 1, docs.length)}–{Math.min(offset + LIMIT, docs.length)} of {docs.length}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setOffset(Math.max(0, offset - LIMIT))} disabled={offset === 0}
                className="px-3 py-1 text-xs border border-gray-200 rounded bg-white disabled:opacity-40 hover:bg-gray-50">
                Previous
              </button>
              <button onClick={() => setOffset(offset + LIMIT)} disabled={offset + LIMIT >= docs.length}
                className="px-3 py-1 text-xs border border-gray-200 rounded bg-white disabled:opacity-40 hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-72 shrink-0 bg-white rounded-xl border border-gray-200 p-5 self-start sticky top-0">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <FileText size={13} /> Document Detail
              </span>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-2.5">
              {[
                ["Invoice #",     selected.invoice_number],
                ["Issue Date",    selected.issue_date],
                ["Due Date",      null],
                ["Supplier",      selected.supplier_name],
                ["Supplier TIN",  selected.supplier_tax_id],
                ["Buyer",         selected.buyer_name],
                ["Buyer TIN",     selected.buyer_tax_id],
                ["Currency",      selected.currency_code],
                ["Subtotal",      selected.tax_exclusive_amount ? fmt(selected.tax_exclusive_amount) : null],
                ["Tax",           selected.tax_amount ? fmt(selected.tax_amount) : null],
                ["Total",         selected.payable_amount ? fmt(selected.payable_amount) : null],
                ["TDD generated", selected.tdd_generated ? "Yes" : "No"],
                ["TDD sent",      selected.tdd_sent ? "Yes" : "No"],
                ["MLS status",    selected.mls_status],
              ].filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => (
                <div key={k as string} className="flex justify-between gap-2 text-xs">
                  <span className="text-gray-400 shrink-0">{k}</span>
                  <span className="text-gray-800 font-medium text-right">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Participant</div>
              <div className="flex gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  selected.participant_type === "billing"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-purple-100 text-purple-700"
                }`}>{selected.participant_type}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  selected.doc_type === "invoice"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}>{selected.doc_type}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
