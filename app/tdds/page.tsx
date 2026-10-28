"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { RefreshCw, Shield, Send } from "lucide-react";
import Link from "next/link";
import { TaxpayerSubmission, SUBMISSION_STATUS, ACTION_LABEL } from "@/components/TaxpayerTdd";

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

export default function TddsPage() {
  const [tddFiles, setTddFiles] = useState<string[]>([]);
  const [mlsLog, setMlsLog]     = useState<string>("");
  const [loading, setLoading]   = useState(true);
  const [subs, setSubs]         = useState<TaxpayerSubmission[] | null>(null);

  const load = async () => {
    setLoading(true);
    fetch(`${BASE}/tdd?limit=200`, { credentials: "include" })
      .then(r => (r.ok ? r.json() : { submissions: [] }))
      .then(j => setSubs(j.submissions ?? []))
      .catch(() => setSubs([]));
    const r = await api.tdds();
    const lines = r.tdd_files.trim().split("\n").filter(l => l.includes(".xml"));
    setTddFiles(lines);
    setMlsLog(r.mls_log);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const parseFileLine = (line: string) => {
    const parts = line.trim().split(/\s+/);
    return { size: parts[4], date: `${parts[5]} ${parts[6]} ${parts[7]}`, name: parts[8] };
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">TDDs & MLS</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tax Data Documents and Message Level Status log</p>
        </div>
        <button onClick={load} className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50">
          <RefreshCw size={14} className={loading ? "animate-spin text-blue-500" : "text-gray-400"} />
        </button>
      </div>

      {/* Taxpayer-requested TDDs (sent by KASA C2/C3 to C5) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Send size={14} className="text-[#7C01ED]" />
          <span className="text-sm font-semibold text-gray-700">Taxpayer TDD submissions ({subs?.length ?? 0})</span>
          <span className="text-xs text-gray-400 ml-2">Requested by the supplier (C1) or buyer (C4), sent by KASA (C2/C3) to the FTA C5 · Submit / Resubmit / Withdraw from the invoice page</span>
        </div>
        <div className="overflow-auto max-h-[420px]">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {["Created", "Invoice", "Action", "Reporter", "Scope", "Status", "C5 MLS", "Attempts", "Submission"].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(subs ?? []).map(s => {
                const st = SUBMISSION_STATUS[s.status] ?? { label: s.status, cls: "text-gray-600" };
                return (
                  <tr key={s.submission_id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{new Date(s.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2 font-mono text-gray-700">
                      {s.document_id ? <Link href={`/invoices/${s.document_id}`} className="hover:underline">{s.invoice_id}</Link> : s.invoice_id}
                    </td>
                    <td className="px-4 py-2 text-gray-700">{ACTION_LABEL[s.action] ?? s.action} <span className="font-mono text-gray-400">({s.action})</span></td>
                    <td className="px-4 py-2 text-gray-600">{s.role === "01" ? "C1 supplier" : "C4 buyer"} <span className="font-mono text-gray-400">{s.reporting_party}</span></td>
                    <td className="px-4 py-2 font-mono text-gray-600">{s.scope}</td>
                    <td className={`px-4 py-2 font-semibold ${st.cls}`}>{st.label}</td>
                    <td className="px-4 py-2 font-mono">{s.mls_code ?? "—"}</td>
                    <td className="px-4 py-2 font-mono text-gray-500">{s.attempts}</td>
                    <td className="px-4 py-2 font-mono text-gray-400 truncate max-w-[140px]" title={s.submission_id}>{s.submission_id}</td>
                  </tr>
                );
              })}
              {subs && subs.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-4 text-gray-400">No taxpayer submissions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TDD files */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Shield size={14} className="text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">Generated TDDs ({tddFiles.length})</span>
          </div>
          <div className="overflow-auto max-h-[500px]">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {["Filename", "Size", "Date"].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tddFiles.map((line, i) => {
                  const f = parseFileLine(line);
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-gray-600 truncate max-w-[180px]">{f.name}</td>
                      <td className="px-4 py-2 text-gray-500">{f.size}</td>
                      <td className="px-4 py-2 text-gray-500">{f.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* MLS Log */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-700">MLS Watcher Log</span>
          </div>
          <pre className="text-xs font-mono text-gray-600 overflow-auto max-h-[500px] p-4 bg-gray-50 leading-relaxed">
            {mlsLog || "No log entries"}
          </pre>
        </div>
      </div>
    </div>
  );
}
