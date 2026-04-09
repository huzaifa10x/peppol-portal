"use client";
import { useEffect, useState } from "react";
import { tenantApi, TenantStats, api } from "@/lib/api";
import {
  Upload, CheckCircle, RefreshCw, AlertCircle,
  Send, FileText, Shield, Wifi, RotateCcw
} from "lucide-react";
import { NEXT_PUBLIC_API_URL } from "@/lib/utils";

const BASE = NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

export default function ProcessingPage() {
  const [stats, setStats]         = useState<TenantStats | null>(null);
  const [syncing, setSyncing]     = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [file, setFile]           = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [valResult, setValResult] = useState<any>(null);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineResult, setPipelineResult]   = useState<any>(null);

  const load = async () => {
    const s = await tenantApi.stats().catch(() => null);
    setStats(s);
  };

  useEffect(() => { load(); }, []);

  const syncInbox = async () => {
    setSyncing(true); setSyncResult(null);
    const r = await fetch(`${BASE}/sync/inbox`, { method: "POST" })
      .then(r => r.json()).catch(() => null);
    setSyncResult(r);
    await load();
    setSyncing(false);
  };

  const runPipeline = async () => {
    setPipelineRunning(true); setPipelineResult(null);
    const r = await fetch(`${BASE}/sync/full-pipeline`, { method: "POST" })
      .then(r => r.json()).catch(() => null);
    setPipelineResult(r);
    await load();
    setPipelineRunning(false);
  };

  const validate = async () => {
    if (!file) return;
    setValidating(true); setValResult(null);
    const form = new FormData();
    form.append("file", file);
    const r = await fetch(`${BASE}/validate`, { method: "POST", body: form })
      .then(r => r.json()).catch(() => null);
    setValResult(r);
    setValidating(false);
  };

  // Pipeline stages with real counts
  const stages = [
    {
      label: "Received",
      count: stats?.inbound ?? 0,
      icon: FileText,
      color: "border-blue-200 bg-blue-50 text-blue-700",
      desc: "Via Peppol AS4",
    },
    {
      label: "Validated",
      count: stats?.validated ?? 0,
      icon: CheckCircle,
      color: "border-green-200 bg-green-50 text-green-700",
      desc: "PINT-AE schematron passed",
    },
    {
      label: "TDD Generated",
      count: stats?.tdds_generated ?? 0,
      icon: Shield,
      color: "border-purple-200 bg-purple-50 text-purple-700",
      desc: "Tax Data Documents created",
    },
    {
      label: "TDD Sent to FTA",
      count: stats?.tdds_sent ?? 0,
      icon: Send,
      color: "border-teal-200 bg-teal-50 text-teal-700",
      desc: "Delivered to UAE FTA C5",
    },
    {
      label: "MLS Acknowledged",
      count: stats?.mls_acknowledged ?? 0,
      icon: Wifi,
      color: "border-indigo-200 bg-indigo-50 text-indigo-700",
      desc: "MLS acknowledgement received",
    },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Processing</h1>
          <p className="text-sm text-gray-500 mt-0.5">Document pipeline status and tools</p>
        </div>
        <button onClick={load}
          className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50">
          <RefreshCw size={14} className="text-gray-400" />
        </button>
      </div>

      {/* Pipeline stages */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        {stages.map((s, i) => {
          const Icon = s.icon;
          const pct  = stats?.inbound
            ? Math.round((s.count / stats.inbound) * 100)
            : 0;
          return (
            <div key={s.label}
              className={`rounded-xl border-2 p-4 ${s.color} relative overflow-hidden`}>
              <div className="flex items-center justify-between mb-2">
                <Icon size={16} />
                <span className="text-2xl font-bold">{s.count}</span>
              </div>
              <div className="text-xs font-semibold mb-0.5">{s.label}</div>
              <div className="text-xs opacity-70 mb-2">{s.desc}</div>
              <div className="h-1 bg-white/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-current rounded-full opacity-50 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-xs opacity-60 mt-0.5">{pct}% of inbound</div>
              {i < stages.length - 1 && (
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-gray-400 text-sm">›</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Outbound summary */}
      {(stats?.outbound ?? 0) > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Outbound Sent",   value: stats?.outbound_sent ?? 0,   color: "text-green-600",  bg: "bg-green-50",  border: "border-green-200" },
            { label: "Send Failed",     value: stats?.outbound_failed ?? 0, color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200" },
            { label: "Draft / Pending", value: stats?.outbound_draft ?? 0,  color: "text-gray-600",   bg: "bg-gray-50",   border: "border-gray-200" },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} className={`rounded-xl border ${border} ${bg} p-4`}>
              <div className={`text-2xl font-bold ${color} mb-1`}>{value}</div>
              <div className={`text-xs font-medium ${color} opacity-80`}>{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sync inbox */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">Sync Inbox</h2>
          <p className="text-xs text-gray-400 mb-4">
            Scan inbound folders and parse new XML files into the database.
          </p>
          <button onClick={syncInbox} disabled={syncing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Scanning..." : "Sync Inbox"}
          </button>
          {syncResult && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
              <span className="font-medium">Done: </span>
              {syncResult.synced} new · {syncResult.skipped} already synced
            </div>
          )}
        </div>

        {/* Run pipeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">Update Pipeline</h2>
          <p className="text-xs text-gray-400 mb-4">
            Correlate TDDs, update MLS statuses, and progress document stages.
          </p>
          <button onClick={runPipeline} disabled={pipelineRunning}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
            <RotateCcw size={13} className={pipelineRunning ? "animate-spin" : ""} />
            {pipelineRunning ? "Running..." : "Run Pipeline Sync"}
          </button>
          {pipelineResult && (
            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-700 space-y-1">
              <div className="font-medium">Pipeline results:</div>
              <div>TDDs correlated: {pipelineResult.tdd_correlated}</div>
              <div>MLS updated: {pipelineResult.mls_updated}</div>
              <div>Docs validated: {pipelineResult.validated}</div>
              <div>Notifications fired: {pipelineResult.notifications}</div>
            </div>
          )}
        </div>

        {/* Validate XML */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">Validate XML</h2>
          <p className="text-xs text-gray-400 mb-4">
            Check a PINT-AE document against UAE FTA schematron rules.
          </p>
          <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors mb-3">
            <Upload size={14} className="text-gray-400 mb-0.5" />
            <span className="text-xs text-gray-500">{file ? file.name : "Upload XML"}</span>
            <input type="file" accept=".xml" className="hidden"
              onChange={e => { setFile(e.target.files?.[0] || null); setValResult(null); }} />
          </label>
          <button onClick={validate} disabled={!file || validating}
            className="w-full px-4 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
            {validating ? "Validating..." : "Validate"}
          </button>
          {valResult && (
            <div className={`mt-3 p-3 rounded-lg border text-xs ${
              valResult.valid
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}>
              <div className="font-medium mb-1">
                {valResult.valid ? "✓ Valid" : `✗ ${valResult.error_count} error(s)`}
              </div>
              <div>Variant: {valResult.variant}</div>
              {valResult.errors?.slice(0, 2).map((e: string, i: number) => (
                <div key={i} className="mt-1 font-mono truncate opacity-80">{e}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Breakdown table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Full Breakdown</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Stage", "Count", "% of Inbound", "Notes"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[
              ["Received (inbound)",     stats?.inbound,           stats?.inbound,     "All received via Peppol AS4"],
              ["Billing participant",    stats?.billing,           stats?.inbound,     "Participant 0235:pae001045"],
              ["Self-billing",          stats?.selfbilling,        stats?.inbound,     "Participant 0235:2222"],
              ["Invoices",              stats?.invoices,           stats?.inbound,     "Type codes 380/389"],
              ["Credit Notes",          stats?.credit_notes,       stats?.inbound,     "Type codes 381/261"],
              ["Validated",             stats?.validated,          stats?.inbound,     "Passed PINT-AE schematron"],
              ["TDDs Generated",        stats?.tdds_generated,     stats?.inbound,     "Tax Data Documents created"],
              ["TDDs Sent to FTA",      stats?.tdds_sent,          stats?.inbound,     "Delivered to UAE C5"],
              ["MLS Acknowledged",      stats?.mls_acknowledged,   stats?.inbound,     "MLS AP response sent"],
              ["Outbound Sent",         stats?.outbound_sent,      stats?.outbound,    "Successfully sent outbound"],
              ["Outbound Failed",       stats?.outbound_failed,    stats?.outbound,    "Failed to send"],
            ].map(([label, value, base, note]) => {
              const pct = base && (base as number) > 0
                ? Math.round(((value as number) / (base as number)) * 100)
                : 0;
              return (
                <tr key={label as string} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-700">{label}</td>
                  <td className="px-5 py-3 text-sm font-bold text-gray-900">{value ?? "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[80px]">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">{note}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
