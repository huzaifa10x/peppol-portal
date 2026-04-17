"use client";
import { useEffect, useState } from "react";
import { api, HealthResponse } from "@/lib/api";
import { CheckCircle, XCircle, RefreshCw, Play, Wrench, AlertTriangle } from "lucide-react";


const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

interface ScriptStatus {
  scripts: Record<string, "present" | "missing">;
}

export default function SystemPage() {
  const [health, setHealth]         = useState<HealthResponse | null>(null);
  const [logs, setLogs]             = useState("");
  const [loading, setLoading]       = useState(true);
  const [starting, setStarting]     = useState(false);
  const [restoring, setRestoring]   = useState(false);
  const [scripts, setScripts]       = useState<ScriptStatus | null>(null);
  const [restoreResult, setRestoreResult] = useState<Record<string, string> | null>(null);

  const load = async () => {
    setLoading(true);
    const [h, l, s] = await Promise.all([
      api.health(),
      api.oxalisLogs(80),
      fetch(`${BASE}/admin/script-status`).then(r => r.json()).catch(() => null),
    ]);
    setHealth(h);
    setLogs(l.log);
    setScripts(s);
    setLoading(false);
  };

  const startWatcher = async () => {
    setStarting(true);
    await api.startWatcher();
    await load();
    setStarting(false);
  };

  const restoreScripts = async () => {
    setRestoring(true);
    setRestoreResult(null);
    const r = await fetch(`${BASE}/admin/restore-scripts`, { method: "POST" })
      .then(res => res.json()).catch(() => null);
    setRestoreResult(r?.restored ?? null);
    await load();
    setRestoring(false);
  };

  useEffect(() => { load(); }, []);

  const allScriptsPresent = scripts
    ? Object.values(scripts.scripts).every(v => v === "present")
    : null;

  const StatusRow = ({ label, ok, detail }: { label: string; ok: boolean; detail: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3">
        {ok
          ? <CheckCircle size={15} className="text-green-500 shrink-0" />
          : <XCircle size={15} className="text-red-500 shrink-0" />}
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <span className={`text-xs font-mono ${ok ? "text-green-600" : "text-red-500"}`}>{detail}</span>
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
          <p className="text-sm text-gray-500 mt-0.5">Container status, scripts, and logs</p>
        </div>
        <button onClick={load}
          className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50">
          <RefreshCw size={14} className={loading ? "animate-spin text-blue-500" : "text-gray-400"} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">

          {/* Core status */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Service Status</h2>
            {health ? (
              <>
                <StatusRow
                  label="Docker container"
                  ok={health.container_running}
                  detail={health.container_running ? "oxalis-ng-ap running" : "STOPPED"} />
                <StatusRow
                  label="AP certificate"
                  ok={health.cert_exists}
                  detail={health.cert_exists ? "AP_PAE001045.p12 found" : "MISSING"} />
                <StatusRow
                  label="MLS watcher"
                  ok={!!health.mls_watcher_pid}
                  detail={health.mls_watcher_pid ? `PID ${health.mls_watcher_pid}` : "NOT RUNNING"} />
                <StatusRow
                  label="Send scripts"
                  ok={allScriptsPresent === true}
                  detail={allScriptsPresent === true ? "All 4 present" : allScriptsPresent === false ? "Some missing" : "Checking..."} />
              </>
            ) : <p className="text-sm text-gray-400">Loading...</p>}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Recovery Actions</h2>

            {health && !health.mls_watcher_pid && (
              <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle size={14} className="text-orange-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-medium text-orange-700">MLS watcher is not running</div>
                  <div className="text-xs text-orange-600 mt-0.5">MLS acknowledgements will not be sent automatically</div>
                </div>
              </div>
            )}

            {allScriptsPresent === false && (
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-red-700">Send scripts missing from container</div>
                  <div className="text-xs text-red-600 mt-0.5">The Send page will return 503 errors until restored</div>
                </div>
              </div>
            )}

            <button onClick={restoreScripts} disabled={restoring}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              <Wrench size={14} className={restoring ? "animate-spin" : ""} />
              {restoring ? "Restoring..." : "Restore Send Scripts"}
            </button>

            {restoreResult && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-xs font-medium text-gray-700 mb-2">Restore result:</div>
                {Object.entries(restoreResult).map(([script, status]) => (
                  <div key={script} className="flex items-center justify-between text-xs py-0.5">
                    <span className="font-mono text-gray-600">{script}</span>
                    <span className={status === "ok" ? "text-green-600" : "text-red-500"}>{status}</span>
                  </div>
                ))}
              </div>
            )}

            {health && !health.mls_watcher_pid && (
              <button onClick={startWatcher} disabled={starting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors">
                <Play size={14} />
                {starting ? "Starting..." : "Start MLS Watcher"}
              </button>
            )}
          </div>

          {/* Script detail */}
          {scripts && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Send Scripts</h2>
              <div className="space-y-2">
                {Object.entries(scripts.scripts).map(([script, status]) => (
                  <div key={script} className="flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-600">{script}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      status === "present"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>{status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">System Info</h2>
            <div className="space-y-2 text-xs">
              {[
                ["Seat ID",       "PAE001045"],
                ["Organisation",  "KASA Advisory Service FZE"],
                ["Jurisdiction",  "United Arab Emirates"],
                ["AP Endpoint",   "ap.kasaadvisory.com/as4"],
                ["API",           "api.kasaadvisory.com"],
                ["SMP",           "smp.kasaadvisory.com"],
                ["Software",      "Oxalis-NG 1.2.0"],
                ["Certificate",   "Expires 2028-03-04"],
                ["Last check",    health?.timestamp ? new Date(health.timestamp).toLocaleString() : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-gray-400 shrink-0">{k}</span>
                  <span className="font-mono text-gray-700 text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Oxalis logs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Oxalis Container Logs</span>
            <span className="text-xs text-gray-400">Last 80 lines</span>
          </div>
          <pre className="text-xs font-mono text-gray-600 overflow-auto max-h-[600px] p-4 bg-gray-50 leading-relaxed whitespace-pre-wrap">
            {logs || "Loading..."}
          </pre>
        </div>
      </div>
    </div>
  );
}
