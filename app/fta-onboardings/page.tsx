"use client";
import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle, Clock, XCircle, AlertCircle,
  Copy, Link2, RefreshCw, ChevronDown, ChevronUp,
  Building2, Mail, Phone, Hash, Shield, X,
} from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

function getHeaders(): HeadersInit {
  const token = typeof window !== "undefined"
    ? (localStorage.getItem("api_token") || localStorage.getItem("kasa_token") || "")
    : "";
  return { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
}

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
  authcode: string;
  authcode_expires_at: string | null;
  authcode_used: boolean;
}

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "active" || s === "success")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle size={10} /> Active</span>;
  if (s === "pending")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><Clock size={10} /> Pending</span>;
  if (s === "failed" || s === "error")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200"><XCircle size={10} /> Failed</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">{status}</span>;
}

function actionBadge(label: string, action: number) {
  const colors: Record<number, string> = {
    1: "bg-purple-50 text-[#7C01ED] border-purple-200",
    2: "bg-blue-50 text-blue-700 border-blue-200",
    3: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors[action] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {label || "Onboard"}
    </span>
  );
}

function linkStatus(o: Onboarding) {
  if (!o.authcode) return null;
  if (o.authcode_used)
    return <span className="text-[10px] text-gray-400 font-medium">Link used</span>;
  if (o.authcode_expires_at && new Date(o.authcode_expires_at) < new Date())
    return <span className="text-[10px] text-red-400 font-medium">Link expired</span>;
  return <span className="text-[10px] text-emerald-600 font-medium">Link valid</span>;
}

function fmt(dt: string) {
  if (!dt || dt === "None") return "—";
  try { return new Date(dt).toLocaleDateString("en-AE", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return dt.slice(0, 10); }
}

export default function FTAOnboardingsPage() {
  const [records, setRecords] = useState<Onboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Onboarding | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`${BASE}/fta/onboardings`, { headers: getHeaders() });
      const data = await res.json();
      setRecords(data.onboardings ?? []);
    } catch { /* ignore */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const copyLink = (o: Onboarding) => {
    const base = typeof window !== "undefined" ? window.location.origin : "https://portal.kasaadvisory.com";
    const link = `${base}/onboard?authcode=${o.authcode}&TIN=${o.tin}`;
    navigator.clipboard.writeText(link);
    setCopied(o.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newInvite, setNewInvite] = useState<any>(null);
  const [form, setForm] = useState({ tin: "", email: "", mobile: "", action: 1 });

  const createInvite = async () => {
    setCreating(true);
    try {
      const res = await fetch(`${BASE}/fta/create-invite`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      setNewInvite(data);
      await load(true); // refresh table
    } catch (e: any) {
      alert(e.message);
    }
    setCreating(false);
  };

  const filtered = records.filter(o => {
    const matchSearch =
      o.tin.includes(search) ||
      o.email.toLowerCase().includes(search.toLowerCase()) ||
      o.entity_name_en.toLowerCase().includes(search.toLowerCase()) ||
      o.vat_trn.includes(search);
    const matchFilter =
      filter === "all" ? true :
        filter === "active" ? ["active", "success"].includes(o.status.toLowerCase()) :
          filter === "pending" ? o.status.toLowerCase() === "pending" :
            filter === "failed" ? ["failed", "error"].includes(o.status.toLowerCase()) : true;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: records.length,
    active: records.filter(o => ["active", "success"].includes(o.status.toLowerCase())).length,
    pending: records.filter(o => o.status.toLowerCase() === "pending").length,
    failed: records.filter(o => ["failed", "error"].includes(o.status.toLowerCase())).length,
  };

  if (loading) return (
    <div className="p-8 flex items-center gap-2 text-sm text-gray-500">
      <RefreshCw size={14} className="animate-spin" /> Loading onboardings…
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FTA Onboardings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Buyer e-invoicing registrations via EmaraTax
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => load(true)} disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 bg-white">
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button onClick={() => { setShowCreate(true); setNewInvite(null); setForm({ tin: "", email: "", mobile: "", action: 1 }); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#7C01ED] text-white rounded-xl text-sm font-semibold hover:bg-[#6a00cc]">
            <Link2 size={14} /> Create Invite
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget && !newInvite) setShowCreate(false); }}>
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Create Onboarding Invite</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={16} />
              </button>
            </div>

            {!newInvite ? (
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">TIN *</label>
                  <input type="text" value={form.tin} maxLength={10}
                    onChange={e => setForm(f => ({ ...f, tin: e.target.value.replace(/\D/g, "") }))}
                    placeholder="1000000000"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C01ED]/20 focus:border-[#7C01ED]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Email *</label>
                  <input type="email" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="buyer@company.ae"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C01ED]/20 focus:border-[#7C01ED]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Mobile (optional)</label>
                  <input type="tel" value={form.mobile}
                    onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
                    placeholder="+971 50 123 4567"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C01ED]/20 focus:border-[#7C01ED]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Action</label>
                  <select value={form.action} onChange={e => setForm(f => ({ ...f, action: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C01ED]/20 bg-white">
                    <option value={1}>Onboard (new registration)</option>
                    <option value={2}>Reverify (existing)</option>
                    <option value={3}>Offboard (delink)</option>
                  </select>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                  Link expires in <strong>48 hours</strong>. Share it securely with the buyer.
                </div>
                <button onClick={createInvite}
                  disabled={creating || !form.tin || !form.email}
                  className="w-full py-2.5 bg-[#7C01ED] text-white rounded-xl text-sm font-semibold hover:bg-[#6a00cc] disabled:opacity-50 flex items-center justify-center gap-2">
                  {creating ? <><RefreshCw size={14} className="animate-spin" /> Generating…</> : <><Link2 size={14} /> Generate Invite Link</>}
                </button>
              </div>
            ) : (
              // Success — show the link
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <CheckCircle size={20} className="text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Invite created!</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Expires in 48 hours · Single use only</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Invite Link</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-700 truncate">
                      {typeof window !== "undefined" ? window.location.origin : "https://portal.kasaadvisory.com"}
                      {newInvite.invite_url}
                    </code>
                    <button onClick={() => {
                      const url = `${window.location.origin}${newInvite.invite_url}`;
                      navigator.clipboard.writeText(url);
                      setCopied(-1); setTimeout(() => setCopied(null), 2000);
                    }}
                      className="px-3 py-2 bg-[#7C01ED] text-white rounded-lg text-xs font-semibold hover:bg-[#6a00cc] flex items-center gap-1.5">
                      {copied === -1 ? <><CheckCircle size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-gray-400">TIN</span><p className="font-mono font-semibold">{newInvite.tin}</p></div>
                  <div><span className="text-gray-400">Action</span><p className="font-semibold">{newInvite.action}</p></div>
                </div>
                <button onClick={() => setShowCreate(false)}
                  className="w-full py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {([
          ["all", "Total", counts.all, "text-gray-900", "border-gray-200"],
          ["active", "Active", counts.active, "text-emerald-700", "border-emerald-200"],
          ["pending", "Pending", counts.pending, "text-amber-700", "border-amber-200"],
          ["failed", "Failed", counts.failed, "text-red-700", "border-red-200"],
        ] as const).map(([key, label, count, textCls, borderCls]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`bg-white border rounded-xl p-4 text-left transition-all ${filter === key ? `${borderCls} ring-1 ring-offset-1 ring-[#7C01ED]/20` : "border-gray-200"
              }`}>
            <div className={`text-2xl font-bold ${textCls}`}>{count}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-4">
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by TIN, email, entity name, VAT TRN…"
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C01ED]/20 focus:border-[#7C01ED]"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-[11px] text-gray-400 font-semibold uppercase tracking-wider">TIN</th>
              <th className="text-left px-4 py-3 text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Entity</th>
              <th className="text-left px-4 py-3 text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Email</th>
              <th className="text-left px-4 py-3 text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Action</th>
              <th className="text-left px-4 py-3 text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Date</th>
              <th className="text-left px-4 py-3 text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Invite Link</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                  No onboarding records found
                </td>
              </tr>
            ) : filtered.map(o => (
              <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-mono text-gray-700 font-semibold">{o.tin}</td>
                <td className="px-4 py-3">
                  <div className="text-gray-800 font-medium">
                    {o.entity_name_en || <span className="text-gray-400 italic">—</span>}
                  </div>
                  {o.vat_trn && <div className="text-gray-400 text-[10px] font-mono mt-0.5">{o.vat_trn}</div>}
                </td>
                <td className="px-4 py-3 text-gray-600">{o.email || "—"}</td>
                <td className="px-4 py-3">{actionBadge(o.action_label, o.action)}</td>
                <td className="px-4 py-3">{statusBadge(o.status)}</td>
                <td className="px-4 py-3 text-gray-500">{fmt(o.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {linkStatus(o)}
                    {o.authcode && !o.authcode_used && (
                      <button onClick={() => copyLink(o)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy invite link">
                        {copied === o.id
                          ? <CheckCircle size={13} className="text-emerald-500" />
                          : <Copy size={13} />}
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelected(o)}
                    className="px-2.5 py-1 text-[11px] font-medium text-[#7C01ED] border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg max-h-[85vh] overflow-y-auto">

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#7C01ED]/10 flex items-center justify-center">
                  <Shield size={16} className="text-[#7C01ED]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {selected.entity_name_en || `TIN ${selected.tin}`}
                  </h3>
                  <p className="text-[11px] text-gray-400">Onboarding #{selected.id}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-5">

              {/* Status row */}
              <div className="flex items-center gap-3 flex-wrap">
                {statusBadge(selected.status)}
                {actionBadge(selected.action_label, selected.action)}
                {linkStatus(selected)}
              </div>

              {/* Entity details */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Entity Information</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["TIN", selected.tin, Hash],
                    ["VAT TRN", selected.vat_trn, Hash],
                    ["Legal Name (EN)", selected.entity_name_en, Building2],
                    ["Legal Name (AR)", selected.entity_name_ar, Building2],
                    ["Legal Type", selected.legal_type, Building2],
                    ["Peppol ID", selected.peppol_id, Shield],
                  ].filter(([, v]) => v).map(([k, v, Icon]) => (
                    <div key={k as string}>
                      <p className="text-[10px] text-gray-400 mb-0.5">{k as string}</p>
                      <div className="flex items-center gap-1.5">
                        {/* @ts-ignore */}
                        <Icon size={11} className="text-gray-300 shrink-0" />
                        <span className="text-xs text-gray-800 font-medium font-mono truncate">{v as string}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Contact</p>
                <div className="space-y-2">
                  {[
                    ["Email", selected.email, Mail],
                    ["Mobile", selected.mobile, Phone],
                  ].filter(([, v]) => v).map(([k, v, Icon]) => (
                    <div key={k as string} className="flex items-center gap-2">
                      {/* @ts-ignore */}
                      <Icon size={13} className="text-gray-300 shrink-0" />
                      <span className="text-xs text-gray-700">{v as string}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invite link */}
              {selected.authcode && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Invite Link</p>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">Status</span>
                      {linkStatus(selected)}
                    </div>
                    {selected.authcode_expires_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-500">Expires</span>
                        <span className="text-[11px] text-gray-700 font-mono">
                          {fmt(selected.authcode_expires_at)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">Used</span>
                      <span className={`text-[11px] font-medium ${selected.authcode_used ? "text-red-500" : "text-emerald-600"}`}>
                        {selected.authcode_used ? "Yes" : "No"}
                      </span>
                    </div>
                    {!selected.authcode_used && (
                      <button onClick={() => copyLink(selected)}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-[#7C01ED] text-white rounded-lg text-xs font-semibold hover:bg-[#6a00cc] transition-colors mt-1">
                        {copied === selected.id
                          ? <><CheckCircle size={13} /> Copied!</>
                          : <><Copy size={13} /> Copy Invite Link</>}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="pt-3 border-t border-gray-100 flex justify-between text-[10px] text-gray-400">
                <span>Created: {fmt(selected.created_at)}</span>
                <span>Updated: {fmt(selected.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}