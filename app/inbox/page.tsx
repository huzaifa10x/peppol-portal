"use client";
import { useEffect, useState, useCallback } from "react";
import { dbApi, DBDocument, api } from "@/lib/api";
import { RefreshCw, FileText, Search } from "lucide-react";
import { NEXT_PUBLIC_API_URL } from "@/lib/utils";

function fmt(n: number) {
  return new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2 }).format(n);
}

export default function InboxPage() {
  const [docs, setDocs]         = useState<DBDocument[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [syncing, setSyncing]   = useState(false);
  const [selected, setSelected] = useState<DBDocument | null>(null);
  const [xmlContent, setXml]    = useState("");
  const [filters, setFilters]   = useState({
    direction: "", participant_type: "", doc_type: ""
  });
  const [offset, setOffset]     = useState(0);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const r = await dbApi.documents({
      ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)),
      limit: LIMIT, offset,
    });
    setDocs(r.documents);
    setTotal(r.total);
    setLoading(false);
  }, [filters, offset]);

  useEffect(() => { load(); }, [load]);

  const sync = async () => {
    setSyncing(true);
    await dbApi.sync();
    await load();
    setSyncing(false);
  };

  const viewXml = async (doc: DBDocument) => {
    setSelected(doc);
    setXml("Loading...");
    // Fetch raw XML directly by path via sidecar
    try {
      const res = await fetch(
        `${NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com"}/inbox?limit=200`
      );
      const data = await res.json();
      const match = data.documents?.find((d: { filename: string; id: string }) =>
        d.filename === doc.xml_filename
      );
      if (match) {
        const r = await fetch(
          `${NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com"}/inbox/${match.id}`
        );
        const xml = await r.json();
        setXml(xml.content ?? "No content");
      } else {
        setXml("File not found in inbox index");
      }
    } catch {
      setXml("Could not load XML");
    }
  };

  const FilterBtn = ({ field, value, label }: { field: keyof typeof filters; value: string; label: string }) => (
    <button
      onClick={() => { setFilters(f => ({ ...f, [field]: f[field] === value ? "" : value })); setOffset(0); }}
      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
        filters[field] === value
          ? "bg-blue-600 text-white"
          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
      }`}
    >{label}</button>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Inbox</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} documents</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={sync} disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing..." : "Sync"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="text-xs text-gray-400 self-center">Direction:</span>
        <FilterBtn field="direction" value="inbound" label="Inbound" />
        <FilterBtn field="direction" value="outbound" label="Outbound" />
        <span className="text-xs text-gray-400 self-center ml-2">Type:</span>
        <FilterBtn field="participant_type" value="billing" label="Billing" />
        <FilterBtn field="participant_type" value="selfbilling" label="Self-billing" />
        <span className="text-xs text-gray-400 self-center ml-2">Doc:</span>
        <FilterBtn field="doc_type" value="invoice" label="Invoice" />
        <FilterBtn field="doc_type" value="credit_note" label="Credit Note" />
        {Object.values(filters).some(Boolean) && (
          <button onClick={() => setFilters({ direction: "", participant_type: "", doc_type: "" })}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-red-600 bg-red-50 border border-red-100 hover:bg-red-100">
            Clear filters
          </button>
        )}
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Type", "Invoice #", "Supplier", "Buyer", "Amount (AED)", "Tax (AED)", "Date"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">Loading...</td></tr>
              ) : docs.map(doc => (
                <tr key={doc.id} onClick={() => setSelected(doc)}
                  className={`cursor-pointer hover:bg-blue-50 transition-colors ${selected?.id === doc.id ? "bg-blue-50" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        doc.participant_type === "billing" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                      }`}>{doc.participant_type === "billing" ? "B" : "SB"}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        doc.doc_type === "invoice" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>{doc.doc_type === "invoice" ? "INV" : "CN"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-600 max-w-[100px] truncate">{doc.invoice_number ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-700">{doc.supplier_name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-700">{doc.buyer_name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs font-medium text-gray-800">{doc.payable_amount ? fmt(doc.payable_amount) : "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{doc.tax_amount ? fmt(doc.tax_amount) : "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{doc.issue_date ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setOffset(Math.max(0, offset - LIMIT))} disabled={offset === 0}
                className="px-3 py-1 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">Previous</button>
              <button onClick={() => setOffset(offset + LIMIT)} disabled={offset + LIMIT >= total}
                className="px-3 py-1 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 shrink-0 space-y-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-700">Document Detail</span>
                <button onClick={() => setSelected(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  ["Invoice #",   selected.invoice_number],
                  ["Date",        selected.issue_date],
                  ["Supplier",    selected.supplier_name],
                  ["Supplier TIN",selected.supplier_tax_id],
                  ["Buyer",       selected.buyer_name],
                  ["Buyer TIN",   selected.buyer_tax_id],
                  ["Currency",    selected.currency_code],
                  ["Subtotal",    selected.tax_exclusive_amount ? fmt(selected.tax_exclusive_amount) : null],
                  ["Tax",         selected.tax_amount ? fmt(selected.tax_amount) : null],
                  ["Total",       selected.payable_amount ? fmt(selected.payable_amount) : null],
                  ["TDD sent",    String(selected.tdd_sent)],
                  ["MLS status",  selected.mls_status],
                ].map(([k, v]) => v ? (
                  <div key={k} className="flex justify-between gap-2">
                    <span className="text-gray-400 shrink-0">{k}</span>
                    <span className="text-gray-700 text-right font-mono truncate">{v}</span>
                  </div>
                ) : null)}
              </div>
            </div>
            <button onClick={() => viewXml(selected)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-100">
              <FileText size={12} /> View raw XML
            </button>
            {xmlContent && (
              <div className="bg-white rounded-xl border border-gray-200 p-3">
                <pre className="text-xs font-mono text-gray-600 overflow-auto max-h-64 leading-relaxed">{xmlContent}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
