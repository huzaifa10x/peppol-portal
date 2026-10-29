"use client";
// Taxpayer-requested TDD (AE TDD 1.0.4): the supplier (C1, role 01) or the buyer (C4, role 02)
// asks KASA to submit, revise (R) or withdraw (W) its tax report. C1/C4 never talk to C5: the KASA
// access point (C2/C3, accredited; ReportersRepresentative 0242:001045) sends the TDD to the FTA C5 over Peppol AS4 and
// C5 answers the access point.
// Backend: POST /tdd, GET /tdd?invoice_id=, GET /tdd/{id}
import { useCallback, useEffect, useState } from "react";
import { FileText, RotateCcw, Send, Undo2, RefreshCw } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

export interface TaxpayerSubmission {
  submission_id: string; action: "S" | "R" | "W"; action_label?: string; role: string; scope: string;
  invoice_id: string; reporting_party: string; status: string; mls_code: string | null;
  attempts: number; root_id: string; original_submission_id: string | null; document_id: string | null;
  channel: string | null; last_error: string | null; created_at: string; updated_at: string; hop?: string;
}

export const SUBMISSION_STATUS: Record<string, { label: string; cls: string }> = {
  queued: { label: "Queued", cls: "text-gray-600" },
  held: { label: "Held (C5 not configured)", cls: "text-amber-700" },
  transport_error: { label: "Send failed, will retry", cls: "text-amber-700" },
  awaiting_mls: { label: "Sent, waiting for C5", cls: "text-blue-700" },
  accepted: { label: "Accepted by C5", cls: "text-emerald-700" },
  rejected: { label: "Rejected by C5", cls: "text-rose-700" },
  build_failed: { label: "Build failed", cls: "text-rose-700" },
  gave_up: { label: "Stopped after max retries", cls: "text-rose-700" },
};
export const ACTION_LABEL: Record<string, string> = { S: "Submit", R: "Resubmit", W: "Withdraw" };
const OPEN = new Set(["queued", "held", "transport_error", "awaiting_mls"]);
const DEAD = new Set(["rejected", "build_failed", "gave_up"]);

interface ApiError { message: string; details: string[] }

async function postTdd(body: Record<string, unknown>): Promise<{ ok: true } | { ok: false; error: ApiError }> {
  const r = await fetch(`${BASE}/tdd`, {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify(body),
  });
  if (r.ok) return { ok: true };
  const j = await r.json().catch(() => ({}));
  const d = j?.detail;
  if (d && typeof d === "object") return { ok: false, error: { message: d.message || `HTTP ${r.status}`, details: d.details || [] } };
  return { ok: false, error: { message: typeof d === "string" ? d : `HTTP ${r.status}`, details: [] } };
}

export default function TaxpayerTdd({ documentId, invoiceNumber, direction }: {
  documentId: string; invoiceNumber: string | null; direction: string;
}) {
  const [subs, setSubs] = useState<TaxpayerSubmission[] | null>(null);
  const [role, setRole] = useState(direction === "inbound" ? "02" : "01");
  const [scope, setScope] = useState("D");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<ApiError | null>(null);

  const load = useCallback(async () => {
    if (!invoiceNumber) { setSubs([]); return; }
    try {
      const r = await fetch(`${BASE}/tdd?invoice_id=${encodeURIComponent(invoiceNumber)}`, { credentials: "include" });
      if (r.ok) setSubs((await r.json()).submissions ?? []); else setSubs([]);
    } catch { setSubs([]); }
  }, [invoiceNumber]);

  useEffect(() => { const t = setTimeout(load, 0); return () => clearTimeout(t); }, [load]);
  useEffect(() => {   // follow open submissions until C5 answers
    if (!subs?.some(s => OPEN.has(s.status))) return;
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [subs, load]);

  const act = async (key: string, body: Record<string, unknown>) => {
    setBusy(key); setErr(null);
    const r = await postTdd({ ...body, document_id: documentId });
    if (!r.ok) setErr(r.error);
    await load();
    setBusy(null);
  };

  // chains (oldest first inside a chain), newest chain first
  const chains: TaxpayerSubmission[][] = [];
  const byRoot: Record<string, TaxpayerSubmission[]> = {};
  for (const s of [...(subs ?? [])].reverse()) (byRoot[s.root_id] ||= []).push(s);
  Object.values(byRoot).forEach(c => chains.push(c));
  chains.sort((a, b) => b[b.length - 1].created_at.localeCompare(a[a.length - 1].created_at));
  const live = (c: TaxpayerSubmission[]) => c.filter(s => !DEAD.has(s.status));
  const activeChain = chains.find(c => {
    const l = live(c);
    return l.length > 0 && !(l[l.length - 1].action === "W" && l[l.length - 1].status === "accepted");
  });
  const canSubmit = !activeChain;
  const lastLive = activeChain ? live(activeChain)[live(activeChain).length - 1] : null;
  const canRevise = !!lastLive && lastLive.status === "accepted" && lastLive.action !== "W";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tax report (TDD) to FTA C5</h2>
        <button onClick={load} className="text-gray-400 hover:text-gray-600" title="Refresh"><RefreshCw size={13} /></button>
      </div>
      <p className="text-[11px] text-gray-400 mb-3">
        Submit, resubmit or withdraw the {role === "01" ? "supplier's (role 01)" : "buyer's (role 02)"} tax report.
        KASA ({role === "01" ? "C2" : "C3"}) sends it to the FTA C5 over Peppol; C5 replies to KASA with a signed receipt and an MLS.
      </p>

      {canSubmit && (
        <div className="space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-gray-500">Reporter
              <select value={role} onChange={e => setRole(e.target.value)} className="border border-gray-200 rounded-md px-2 py-1.5 text-gray-800">
                <option value="01">Supplier (role 01)</option>
                <option value="02">Buyer (role 02)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-gray-500">Scope
              <select value={scope} onChange={e => setScope(e.target.value)} className="border border-gray-200 rounded-md px-2 py-1.5 text-gray-800">
                <option value="D">D — domestic</option>
                <option value="IP">IP — international, Peppol</option>
                <option value="INP">INP — international, non-Peppol</option>
              </select>
            </label>
          </div>
          <button onClick={() => act("S", { action: "S", role, scope })} disabled={!!busy || !invoiceNumber}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#7C01ED] hover:bg-[#6a01cc] text-white rounded-lg text-xs font-bold disabled:opacity-50">
            <Send size={12} /> {busy === "S" ? "Submitting…" : "Submit TDD to C5 (S)"}
          </button>
        </div>
      )}

      {canRevise && lastLive && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button onClick={() => act("R", { action: "R", original_submission_id: lastLive.submission_id, scope: lastLive.scope })}
            disabled={!!busy} title="Sends the invoice as it is stored now (same invoice number) as a revised report"
            className="flex items-center justify-center gap-2 px-3 py-2 border border-purple-300 text-purple-700 hover:bg-purple-50 rounded-lg font-bold disabled:opacity-50">
            <RotateCcw size={12} /> {busy === "R" ? "Sending…" : "Resubmit (R)"}
          </button>
          <button onClick={() => { if (window.confirm("Withdraw this tax report at C5? Nothing can follow a withdrawal.")) act("W", { action: "W", original_submission_id: lastLive.submission_id }); }}
            disabled={!!busy}
            className="flex items-center justify-center gap-2 px-3 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg font-bold disabled:opacity-50">
            <Undo2 size={12} /> {busy === "W" ? "Sending…" : "Withdraw (W)"}
          </button>
        </div>
      )}
      {lastLive && OPEN.has(lastLive.status) && (
        <p className="text-[11px] text-blue-700">Waiting for C5 on {ACTION_LABEL[lastLive.action]} — Resubmit / Withdraw open once C5 accepts it.</p>
      )}

      {err && (
        <div className="mt-3 p-2 rounded-md bg-rose-50 border border-rose-200 text-[11px] text-rose-800">
          <p className="font-semibold break-words">{err.message}</p>
          {err.details.length > 0 && (
            <ul className="mt-1 list-disc pl-4 space-y-0.5 max-h-40 overflow-auto">
              {err.details.map((d, i) => <li key={i} className="break-words">{d}</li>)}
            </ul>
          )}
        </div>
      )}

      {chains.length > 0 && (
        <div className="mt-4 space-y-3">
          {chains.map(c => (
            <div key={c[0].root_id} className="border-t border-gray-100 pt-2">
              {c.map(s => {
                const st = SUBMISSION_STATUS[s.status] ?? { label: s.status, cls: "text-gray-600" };
                return (
                  <div key={s.submission_id} className="flex items-start justify-between gap-2 py-1 text-xs">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-700 flex items-center gap-1">
                        <FileText size={11} className="text-purple-500" />
                        {ACTION_LABEL[s.action] ?? s.action} <span className="font-mono text-gray-400">TDT {s.action}</span>
                        <span className="text-gray-400">· role {s.role} · {s.scope}</span>
                      </p>
                      <p className="font-mono text-[10px] text-gray-400 truncate" title={s.submission_id}>
                        {s.submission_id} · {new Date(s.created_at).toLocaleString()}
                      </p>
                      {s.last_error && s.status !== "accepted" && <p className="text-[10px] text-rose-700 break-words">{s.last_error}</p>}
                    </div>
                    <span className={`shrink-0 font-bold ${st.cls}`}>{st.label}{s.mls_code ? ` · ${s.mls_code}` : ""}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
      {subs && subs.length === 0 && !canSubmit && <p className="text-[11px] text-gray-400">No submissions yet.</p>}
    </div>
  );
}
