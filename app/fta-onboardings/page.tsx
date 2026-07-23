"use client";
import { useEffect, useState, useCallback } from "react";
import { Download, Search, RefreshCw, Users, CheckCircle, XCircle, RotateCcw } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

interface Onboarding {
  id: number;
  tin: string;
  vat_trn: string;
  entity_name_en: string;
  entity_name_ar: string;
  legal_type: string;
  email: string;
  mobile: string;
  peppol_id: string;
  action: number;
  action_label: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function fmt_date(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-AE", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function exportCSV(rows: Onboarding[]) {
  const headers = ["TIN", "Entity Name", "VAT TRN", "Email", "Peppol ID", "Action", "Status", "Date"];
  const data = rows.map(r => [
    r.tin, r.entity_name_en || r.tin, r.vat_trn, r.email,
    r.peppol_id, r.action_label, r.status,
    fmt_date(r.updated_at),
  ]);
  const csv = [headers, ...data].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `fta-onboardings-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

export default function FTAOnboardingsPage() {
  const [rows, setRows] = useState<Onboarding[]>([]);
  const [filtered, setFilt] = useState<Onboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("");
  const [actionF, setActionF] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/fta/onboardings`).then(r => r.json());
      setRows(r.onboardings ?? []);
    } catch {
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let out = rows;
    if (statusF) out = out.filter(r => r.status === statusF);
    if (actionF) out = out.filter(r => String(r.action) === actionF);
    if (search) {
      const s = search.toLowerCase();
      out = out.filter(r =>
        r.tin.includes(s) ||
        r.entity_name_en || r.tin.toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s) ||
        r.vat_trn.includes(s)
      );
    }
    setFilt(out);
  }, [rows, search, statusF, actionF]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const total = rows.length;
  const active = rows.filter(r => r.status === "Active").length;
  const inactive = rows.filter(r => r.status === "Inactive").length;

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FTA Onboardings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Taxpayers linked via EmaraTax · {filtered.length} records
          </p>
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

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
            <Users size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
            <p className="text-xs text-gray-500">Total taxpayers</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
            <CheckCircle size={16} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{active}</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
            <XCircle size={16} className="text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{inactive}</p>
            <p className="text-xs text-gray-500">Offboarded</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-2.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search TIN, name, email..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={statusF} onChange={e => setStatusF(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select value={actionF} onChange={e => setActionF(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Actions</option>
          <option value="1">Onboard</option>
          <option value="2">Reverify</option>
          <option value="3">Offboard</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["TIN", "Entity Name", "VAT TRN", "Email", "Peppol ID", "Action", "Status", "Last Updated"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center">
                  <Users size={24} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No onboarding records found</p>
                </td>
              </tr>
            ) : filtered.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">

                {/* TIN */}
                <td className="px-4 py-3 text-xs font-mono font-medium text-gray-800">
                  {row.tin}
                </td>

                {/* Entity Name */}
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-gray-800">{row.entity_name_en || "—"}</p>
                  {row.entity_name_ar && (
                    <p className="text-xs text-gray-400 text-right" dir="rtl">{row.entity_name_ar}</p>
                  )}
                </td>

                {/* VAT TRN */}
                <td className="px-4 py-3 text-xs font-mono text-gray-500">
                  {row.vat_trn || "—"}
                </td>

                {/* Email */}
                <td className="px-4 py-3 text-xs text-gray-600">
                  {row.email || "—"}
                </td>

                {/* Peppol ID */}
                <td className="px-4 py-3 text-xs font-mono text-gray-500">
                  {row.peppol_id || "—"}
                </td>

                {/* Action */}
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row.action === 1 ? "bg-blue-100 text-blue-700" :
                      row.action === 2 ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                    }`}>
                    {row.action_label}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                    }`}>
                    {row.status}
                  </span>
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-xs text-gray-400">
                  {fmt_date(row.updated_at)}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}