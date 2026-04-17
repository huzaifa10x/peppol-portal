import { tenantApi, api } from "@/lib/api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { FileText, TrendingUp, Shield, CheckCircle, XCircle, Send, AlertTriangle } from "lucide-react";
import Link from "next/link";

export const revalidate = 15;

function fmt(n: number) {
  return new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2 }).format(n);
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenant_id;

  const [stats, health, smp] = await Promise.all([
    tenantApi.stats(tenantId).catch(() => null),
    api.health().catch(() => null),
    api.smp().catch(() => null),
  ]);

  const recentDocs = await tenantApi.documents({
    limit: 8,
    ...(tenantId ? { tenant_id: tenantId } : {}),
  }).catch(() => null);

  const cards = [
    {
      label:  "Total Documents",
      value:  stats?.total ?? 0,
      sub:    `${stats?.inbound ?? 0} inbound · ${stats?.outbound ?? 0} outbound`,
      icon:   FileText,
      color:  "text-blue-600",
      bg:     "bg-blue-50",
      href:   "/invoices",
    },
    {
      label:  "Total Value (AED)",
      value:  fmt(stats?.total_amount ?? 0),
      sub:    `${fmt(stats?.outbound_amount ?? 0)} AED sent outbound`,
      icon:   TrendingUp,
      color:  "text-green-600",
      bg:     "bg-green-50",
      href:   "/invoices",
    },
    {
      label:  "Outbound Sent",
      value:  stats?.outbound_sent ?? 0,
      sub:    `${stats?.outbound_failed ?? 0} failed · ${stats?.outbound_draft ?? 0} draft`,
      icon:   Send,
      color:  "text-purple-600",
      bg:     "bg-purple-50",
      href:   "/outbound",
    },
    {
      label:  "System",
      value:  health?.container_running ? "Healthy" : "Down",
      sub:    health?.mls_watcher_pid ? `MLS PID ${health.mls_watcher_pid}` : "MLS watcher stopped",
      icon:   health?.container_running ? CheckCircle : XCircle,
      color:  health?.container_running ? "text-green-600" : "text-red-500",
      bg:     health?.container_running ? "bg-green-50" : "bg-red-50",
      href:   "/system",
    },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            KASA Advisory Service FZE · PAE001045 · UAE PINT-AE
          </p>
        </div>
        <Link href="/create-invoice"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
          <Send size={14} /> New Invoice
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, sub, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-200 hover:shadow-sm transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
              <div className={`${bg} p-1.5 rounded-lg`}>
                <Icon size={14} className={color} />
              </div>
            </div>
            <div className={`text-2xl font-bold ${color} mb-1`}>{String(value)}</div>
            <div className="text-xs text-gray-400">{sub}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Document Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: "Billing (0235:pae001045)",  value: stats?.billing ?? 0,     color: "bg-blue-500" },
              { label: "Self-Billing (0235:2222)",  value: stats?.selfbilling ?? 0, color: "bg-purple-500" },
              { label: "Invoices",                  value: stats?.invoices ?? 0,    color: "bg-green-500" },
              { label: "Credit Notes",              value: stats?.credit_notes ?? 0, color: "bg-amber-500" },
            ].map(({ label, value, color }) => {
              const pct = stats?.total ? Math.round((value / stats.total) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium text-gray-800">{value}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tax reporting */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Tax Reporting (UAE FTA)</h2>
          <div className="space-y-3">
            {[
              { label: "TDDs Generated", value: stats?.tdds_generated ?? 0, total: stats?.inbound ?? 0, color: "bg-purple-500" },
              { label: "TDDs Sent to C5", value: stats?.tdds_sent ?? 0,     total: stats?.inbound ?? 0, color: "bg-teal-500" },
            ].map(({ label, value, total, color }) => {
              const pct = total ? Math.round((value / total) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium text-gray-800">{value} / {total}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Outbound sent</span>
                <span className="font-medium text-green-700">{stats?.outbound_sent ?? 0} invoices</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-500">Send failures</span>
                <span className={`font-medium ${(stats?.outbound_failed ?? 0) > 0 ? "text-red-600" : "text-gray-500"}`}>
                  {stats?.outbound_failed ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SMP */}
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
                    ? <><CheckCircle size={12} className="text-green-500" /><span className="text-xs text-green-600">{p.services} svc</span></>
                    : <XCircle size={12} className="text-red-500" />
                  }
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <Link href="/admin" className="text-xs text-blue-600 hover:underline">
              Manage tenants →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent docs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Recent Documents</h2>
          <Link href="/invoices" className="text-xs text-blue-600 hover:underline">View all →</Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Type","Invoice #","Supplier","Buyer","Amount (AED)","Date","Status"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {recentDocs?.documents.map(doc => (
              <Link key={doc.id} href={`/invoices/${doc.id}`} legacyBehavior>
                <tr className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        doc.participant_type === "billing" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                      }`}>{doc.participant_type === "billing" ? "B" : "SB"}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        doc.direction === "outbound" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"
                      }`}>{doc.direction === "outbound" ? "OUT" : "IN"}</span>
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
                  <td className="px-4 py-3 text-xs text-gray-500">{doc.issue_date ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      doc.status === "sent" || doc.status === "acknowledged" ? "bg-green-100 text-green-700" :
                      doc.status === "send_failed" ? "bg-red-100 text-red-700" :
                      doc.status === "draft" ? "bg-gray-100 text-gray-600" :
                      "bg-blue-100 text-blue-700"
                    }`}>{doc.status}</span>
                  </td>
                </tr>
              </Link>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
