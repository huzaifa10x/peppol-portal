"use client";
import { useEffect, useState } from "react";
import { dbApi, DocStats } from "@/lib/api";
import { Upload, CheckCircle, RefreshCw, AlertCircle, Send, FileText } from "lucide-react";

type Stage = { label: string; count: number; color: string; icon: React.ReactNode; description: string };

export default function ProcessingPage() {
  const [stats, setStats]       = useState<DocStats | null>(null);
  const [syncing, setSyncing]   = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; skipped: number } | null>(null);
  const [file, setFile]         = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [valResult, setValResult]   = useState<{ valid: boolean; error_count: number; errors: string[]; variant: string } | null>(null);
  const [uploading, setUploading]   = useState(false);

  const load = async () => {
    const s = await dbApi.stats().catch(() => null);
    setStats(s);
  };

  useEffect(() => { load(); }, []);

  const stages: Stage[] = [
    {
      label: "Received",
      count: stats?.total ?? 0,
      color: "bg-blue-100 text-blue-700 border-blue-200",
      icon: <FileText size={16} />,
      description: "Documents received via Peppol AS4",
    },
    {
      label: "Invoices",
      count: stats?.invoices ?? 0,
      color: "bg-green-100 text-green-700 border-green-200",
      icon: <CheckCircle size={16} />,
      description: "Standard PINT-AE invoices",
    },
    {
      label: "Credit Notes",
      count: stats?.credit_notes ?? 0,
      color: "bg-amber-100 text-amber-700 border-amber-200",
      icon: <AlertCircle size={16} />,
      description: "Credit and debit notes",
    },
    {
      label: "TDDs Generated",
      count: stats?.tdds_generated ?? 0,
      color: "bg-purple-100 text-purple-700 border-purple-200",
      icon: <CheckCircle size={16} />,
      description: "Tax Data Documents created",
    },
    {
      label: "Sent to FTA",
      count: stats?.tdds_sent ?? 0,
      color: "bg-teal-100 text-teal-700 border-teal-200",
      icon: <Send size={16} />,
      description: "Submitted to UAE FTA C5",
    },
  ];

  const syncDocs = async () => {
    setSyncing(true);
    const r = await dbApi.sync();
    setSyncResult({ synced: r.synced, skipped: r.skipped });
    await load();
    setSyncing(false);
  };

  const validate = async () => {
    if (!file) return;
    setValidating(true);
    setValResult(null);
    const { api } = await import("@/lib/api");
    const r = await api.validate(file).catch(() => null);
    setValResult(r);
    setValidating(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Processing</h1>
          <p className="text-sm text-gray-500 mt-0.5">Document pipeline status and tools</p>
        </div>
        <button onClick={load}
          className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50">
          <RefreshCw size={14} className="text-gray-400" />
        </button>
      </div>

      {/* Stage counters — like Profluo */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stages.map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <div className="flex items-center justify-between mb-2">
              {s.icon}
              <span className="text-2xl font-bold">{s.count}</span>
            </div>
            <div className="text-xs font-semibold">{s.label}</div>
            <div className="text-xs opacity-70 mt-0.5">{s.description}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sync panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">Sync Inbox</h2>
          <p className="text-xs text-gray-400 mb-5">
            Scan inbound folders and parse new XML files into the database.
            Safe to run multiple times — skips already-synced files.
          </p>
          <button onClick={syncDocs} disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 w-full justify-center">
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Scanning folders..." : "Sync Now"}
          </button>
          {syncResult && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-xs">
              <div className="font-medium text-green-700 mb-1">Sync complete</div>
              <div className="text-green-600">
                {syncResult.synced} new documents added · {syncResult.skipped} already in database
              </div>
            </div>
          )}
        </div>

        {/* Validate panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">Validate XML</h2>
          <p className="text-xs text-gray-400 mb-5">
            Check a PINT-AE document against UAE FTA schematron rules before sending.
          </p>
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors mb-4">
            <Upload size={16} className="text-gray-400 mb-1" />
            <span className="text-xs text-gray-500">{file ? file.name : "Click to upload XML"}</span>
            <input type="file" accept=".xml" className="hidden"
              onChange={e => { setFile(e.target.files?.[0] || null); setValResult(null); }} />
          </label>
          <button onClick={validate} disabled={!file || validating}
            className="w-full px-4 py-2.5 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
            {validating ? "Validating..." : "Validate Document"}
          </button>
          {valResult && (
            <div className={`mt-4 p-3 rounded-lg border text-xs ${
              valResult.valid ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }`}>
              <div className={`font-medium mb-1 ${valResult.valid ? "text-green-700" : "text-red-700"}`}>
                {valResult.valid ? "✓ Valid document" : `✗ ${valResult.error_count} error(s) found`}
              </div>
              <div className={valResult.valid ? "text-green-600" : "text-red-600"}>
                Variant: {valResult.variant}
              </div>
              {valResult.errors.slice(0, 3).map((e, i) => (
                <div key={i} className="mt-1 font-mono text-red-600 truncate">{e}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Breakdown table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Processing Breakdown</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Metric", "Count", "Notes"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[
              ["Total received",       stats?.total,          "All inbound documents"],
              ["Billing participant",  stats?.billing,        "Participant 0235:pae001045"],
              ["Self-billing",         stats?.selfbilling,    "Participant 0235:2222"],
              ["Invoices",             stats?.invoices,       "InvoiceTypeCode 380/389"],
              ["Credit notes",         stats?.credit_notes,   "TypeCode 381/261"],
              ["TDDs generated",       stats?.tdds_generated, "Auto-generated by plugin"],
              ["TDDs sent to FTA",     stats?.tdds_sent,      "Delivered to UAE C5"],
              ["Outbound sent",        stats?.outbound,       "Documents sent by this AP"],
            ].map(([label, value, note]) => (
              <tr key={label as string} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-sm font-medium text-gray-700">{label}</td>
                <td className="px-5 py-3 text-sm font-bold text-gray-900">{value ?? "—"}</td>
                <td className="px-5 py-3 text-xs text-gray-400">{note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
