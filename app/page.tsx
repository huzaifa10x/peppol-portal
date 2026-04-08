import { dbApi, api } from "@/lib/api";
import { FileText, CreditCard, Shield, CheckCircle, XCircle, TrendingUp, RefreshCw } from "lucide-react";

export const revalidate = 10;

function fmt(n: number) {
  return new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export default async function Dashboard() {
  const [stats, health, smp] = await Promise.all([
    dbApi.stats().catch(() => null),
    api.health().catch(() => null),
    api.smp().catch(() => null),
  ]);

  const recentDocs = await dbApi.documents({ limit: 8 }).catch(() => null);

  const statCards = [
    {
      label: "Total Documents",
      value: stats?.total ?? 0,
      sub: `${stats?.inbound ?? 0} inbound · ${stats?.outbound ?? 0} outbound`,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Amount (AED)",
      value: fmt(stats?.total_amount ?? 0),
      sub: `${stats?.invoices ?? 0} invoices · ${stats?.credit_notes ?? 0} credit notes`,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "TDDs Generated",
      value: stats?.tdds_generated ?? 0,
      sub: `${stats?.tdds_sent ?? 0} sent to UAE FTA`,
      icon: Shield,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Container",
      value: health?.container_running ? "Healthy" : "Down",
      sub: health?.mls_watcher_pid ? `MLS watcher PID ${health.mls_watcher_pid}` : "MLS watcher stopped",
      icon: health?.container_running ? CheckCircle : XCircle,
      color: health?.container_running ? "text-green-600" : "text-red-500",
      bg: health?.container_running ? "bg-green-50" : "bg-red-50",
    },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            KASA Advisory Service FZE · Seat PAE001045 · UAE PINT-AE
          </p>
        </div>
        <div className="text-xs text-gray-400">
          {health?.timestamp ? new Date(health.timestamp).toLocaleString() : "—"}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
              <div className={`${bg} p-1.5 rounded-lg`}>
                <Icon size={14} className={color} />
              </div>
            </div>
            <div className={`text-2xl font-bold ${color} mb-1`}>{String(value)}</div>
            <div className="text-xs text-gray-400">{sub}</div>
          </div>
        ))}
      </div>

      {/* Participant breakdown + SMP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">By Participant</h2>
          <div className="space-y-3">
            {[
              { label: "Billing (0235:pae001045)", value: stats?.billing ?? 0, color: "bg-blue-500" },
              { label: "Self-Billing (0235:2222)", value: stats?.selfbilling ?? 0, color: "bg-purple-500" },
            ].map(({ label, value, color }) => {
              const pct = stats?.total ? Math.round((value / stats.total) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium text-gray-800">{value}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Document Types</h2>
          <div className="space-y-3">
            {[
              { label: "Invoices", value: stats?.invoices ?? 0, color: "bg-green-500" },
              { label: "Credit Notes", value: stats?.credit_notes ?? 0, color: "bg-amber-500" },
            ].map(({ label, value, color }) => {
              const pct = stats?.total ? Math.round((value / stats.total) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium text-gray-800">{value}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">SMP Participants</h2>
          <div className="space-y-3">
            {smp?.participants.map(p => (
              <div key={p.participant} className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-gray-700">{p.label}</div>
                  <div className="text-xs text-gray-400 font-mono">{p.participant}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  {p.registered
                    ? <><CheckCircle size={12} className="text-green-500" /><span className="text-xs text-green-600">{p.services}</span></>
                    : <XCircle size={12} className="text-red-500" />
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent documents table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Recent Documents</h2>
          <span className="text-xs text-gray-400">{stats?.total} total</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Type", "Invoice #", "Supplier", "Buyer", "Amount (AED)", "Date", "Status"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {recentDocs?.documents.map(doc => (
              <tr key={doc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      doc.participant_type === "billing"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}>{doc.participant_type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      doc.doc_type === "invoice"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>{doc.doc_type === "credit_note" ? "CN" : "INV"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs font-mono text-gray-600 max-w-[120px] truncate">
                  {doc.invoice_number ?? "—"}
                </td>
                <td className="px-4 py-3 text-xs text-gray-700">{doc.supplier_name ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-gray-700">{doc.buyer_name ?? "—"}</td>
                <td className="px-4 py-3 text-xs font-medium text-gray-800">
                  {doc.payable_amount ? fmt(doc.payable_amount) : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {doc.issue_date ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                    {doc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
