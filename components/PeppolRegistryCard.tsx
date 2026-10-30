// Peppol network registration of the taxpayer (participant 0235:<TIN>):
// SML (Peppol network directory) + KASA SMP. Data comes from the backend
// fields "peppol" on /fta/verify and /fta/register.

import { Network, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

export interface PeppolInfo {
  participantId?: string;
  state?: "registered" | "not_registered" | "other_provider"
    | "smp_only" | "sml_only" | "error";
  result?: string;
  error?: string;
  note?: string;
  seatId?: string | null;
  certType?: string | null;
  endpoint?: string | null;
  transportProfile?: string | null;
  checkedAt?: string;
  sml?: { registered?: boolean | null; smp?: string | null; zone?: string };
  smp?: { url?: string; http?: number; registered?: boolean; documentTypes?: string[] };
}

const STATE: Record<string, { text: string; tone: "ok" | "warn" | "bad" | "info" }> = {
  registered: { text: "Registered on the Peppol network (KASA)", tone: "ok" },
  not_registered: { text: "Not registered on the Peppol network", tone: "info" },
  other_provider: { text: "Registered by another service provider", tone: "warn" },
  smp_only: { text: "Published on the KASA SMP, network directory pending", tone: "warn" },
  sml_only: { text: "Network directory entry only", tone: "warn" },
  error: { text: "Peppol registry could not be updated", tone: "bad" },
};

export function docTypeLabel(id: string): string {
  const any = id.includes("@ae-1*") ? " (any version)" : "";
  if (id.includes(":mls:") || id.includes("ApplicationResponse")) return "Message Level Status (MLS)";
  const kind = id.includes("CreditNote") ? "Credit Note" : "Invoice";
  if (id.includes("selfbilling-1@ae-1")) return `PINT AE Self-billing ${kind}${any}`;
  if (id.includes("billing-1@ae-1")) return `PINT AE ${kind}${any}`;
  return id;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-medium text-gray-800 break-all sm:text-right">{value}</span>
    </div>
  );
}

export default function PeppolRegistryCard({ peppol, title }: { peppol?: PeppolInfo | null; title?: string }) {
  if (!peppol) return null;
  const st = STATE[peppol.state || "error"] || STATE.error;
  const tone = {
    ok: "bg-green-50 text-green-700 border-green-200",
    warn: "bg-amber-50 text-amber-800 border-amber-200",
    bad: "bg-red-50 text-red-700 border-red-200",
    info: "bg-gray-50 text-gray-700 border-gray-200",
  }[st.tone];
  const Icon = { ok: CheckCircle, warn: AlertTriangle, bad: XCircle, info: Info }[st.tone];
  const docs = peppol.smp?.documentTypes || [];
  const smlText = peppol.sml?.registered == null ? "Lookup failed"
    : peppol.sml.registered ? `Registered → ${peppol.sml.smp || ""}` : "Not found";

  return (
    <div className="text-left border border-gray-200 rounded-xl p-4 mt-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <Network size={14} /> {title || "Peppol Network Registration"}
      </p>
      <div className={`flex items-start gap-2 text-xs border rounded-lg px-3 py-2 mb-2 ${tone}`}>
        <Icon size={14} className="mt-0.5 shrink-0" />
        <span>{st.text}{peppol.state === "error" && peppol.error ? `: ${peppol.error}` : ""}</span>
      </div>
      <Row label="Peppol participant ID" value={peppol.participantId} />
      <Row label="Peppol network directory (SML)" value={smlText} />
      <Row label="Metadata publisher (SMP)" value={peppol.smp?.registered ? peppol.smp.url : "Not found (HTTP " + (peppol.smp?.http ?? "-") + ")"} />
      <Row label="Access point Seat ID" value={peppol.seatId} />
      <Row label="Access point certificate" value={peppol.certType} />
      <Row label="Access point endpoint" value={peppol.endpoint} />
      <Row label="Checked at (UTC)" value={peppol.checkedAt} />
      {docs.length > 0 && (
        <div className="pt-2">
          <p className="text-xs text-gray-500 mb-1">Document types registered</p>
          <ul className="space-y-0.5">
            {docs.map(d => (
              <li key={d} title={d} className="text-xs text-gray-800">• {docTypeLabel(d)}</li>
            ))}
          </ul>
        </div>
      )}
      {peppol.note && <p className="text-[11px] text-gray-500 pt-2">{peppol.note}</p>}
    </div>
  );
}
