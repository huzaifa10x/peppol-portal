"use client";
import { useSession } from "@/lib/session";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { tenantApi, api } from "@/lib/api";
import {
  FileText,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Send,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Plus
} from "lucide-react";
import Link from "next/link";

function fmt(n: number) {
  return new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2 }).format(n);
}

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const tenantId = (session?.user as any)?.tenant_id;

  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [smp, setSmp] = useState<any>(null);
  const [recentDocs, setRecent] = useState<any>(null);

  useEffect(() => {
    if (!tenantId) return;
    tenantApi.stats(tenantId).then(setStats).catch(() => null);
    api.health().then(setHealth).catch(() => null);
    api.smp().then(setSmp).catch(() => null);
    tenantApi.documents({ tenant_id: tenantId, limit: 8 }).then(setRecent).catch(() => null);
  }, [tenantId]);

  if (status === "loading" || status === "unauthenticated") return null;

  // Stat Cards Config with KASA Brand & Fixed Status Palette
  const cards = [
    {
      label: "Total Documents",
      value: stats?.total ?? 0,
      sub: `${stats?.inbound ?? 0} inbound · ${stats?.outbound ?? 0} outbound`,
      icon: FileText,
      color: "text-[#7C01ED]",
      bg: "bg-purple-50",
      href: "/invoices",
    },
    {
      label: "Total Value (AED)",
      value: fmt(stats?.total_amount ?? 0),
      sub: `${fmt(stats?.outbound_amount ?? 0)} AED sent outbound`,
      icon: TrendingUp,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      href: "/invoices",
    },
    {
      label: "Outbound Sent",
      value: stats?.outbound_sent ?? 0,
      sub: `${stats?.outbound_failed ?? 0} failed · ${stats?.outbound_draft ?? 0} draft`,
      icon: Send,
      color: "text-[#7C01ED]",
      bg: "bg-purple-50",
      href: "/outbound",
    },
    {
      label: "System Health",
      value: health?.container_running == true ? "Healthy" : "Down",
      sub: health?.mls_watcher_pid ? `MLS PID ${health.mls_watcher_pid}` : "MLS watcher stopped",
      icon: health?.container_running ? CheckCircle2 : XCircle,
      color: health?.container_running ? "text-emerald-700" : "text-rose-700",
      bg: health?.container_running ? "bg-emerald-50" : "bg-rose-50",
      href: "/system",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            KASA Advisory Service FZE · PAE001045 · UAE PINT-AE
          </p>
        </div>
        <Link
          href="/create-invoice"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-[#7C01ED] border text-[#7C01ED] rounded-lg text-sm font-semibold transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7C01ED]/50"
        >
          <Plus size={16} /> New Invoice
        </Link>
      </div>

      {/* Stat Cards */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats && health && cards?.map(({ label, value, sub, icon: Icon, color, bg, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#7C01ED]/40 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{label}</span>
              <div className={`${bg} p-2 rounded-lg`}>
                <Icon size={18} className={color} />
              </div>
            </div>
            <div className={`text-2xl font-bold ${color} tracking-tight mb-1`}>{String(value)}</div>
            <div className="text-xs text-gray-500 font-medium">{sub}</div>
          </Link>
        ))}
      </div>

      {/* Middle Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Document Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center justify-between">
            Document Breakdown
          </h2>
          <div className="space-y-4">
            {[
              { label: "Billing (0235:pae001045)", value: stats?.billing ?? 0, color: "bg-[#7C01ED]" },
              { label: "Self-Billing (0235:2222)", value: stats?.selfbilling ?? 0, color: "bg-purple-400" },
              { label: "Invoices", value: stats?.invoices ?? 0, color: "bg-emerald-600" },
              { label: "Credit Notes", value: stats?.credit_notes ?? 0, color: "bg-amber-500" },
            ].map(({ label, value, color }) => {
              const pct = stats?.total ? Math.round((value / stats.total) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-700">{label}</span>
                    <span className="text-gray-900">{value} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tax Reporting */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
          <h2 className="text-base font-bold text-gray-900 mb-4">Tax Reporting (UAE FTA)</h2>
          <div className="space-y-4">
            {[
              { label: "TDDs Generated", value: stats?.tdds_generated ?? 0, total: stats?.inbound ?? 0, color: "bg-[#7C01ED]" },
              { label: "TDDs Sent to C5", value: stats?.tdds_sent ?? 0, total: stats?.inbound ?? 0, color: "bg-emerald-600" },
            ].map(({ label, value, total, color }) => {
              const pct = total ? Math.round((value / total) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-700">{label}</span>
                    <span className="text-gray-900">{value} / {total} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}

            <div className="pt-3 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-600">Outbound Sent Success</span>
                <span className="font-bold text-emerald-700">{stats?.outbound_sent ?? 0} invoices</span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-600">Send Failures</span>
                <span className={`font-bold ${(stats?.outbound_failed ?? 0) > 0 ? "text-rose-700" : "text-gray-700"}`}>
                  {stats?.outbound_failed ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SMP Participants */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-4">SMP Participants</h2>
            <div className="space-y-3">
              {smp?.participants?.map((p: any) => (
                <div key={p.participant} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <div>
                    <div className="text-xs font-bold text-gray-800">{p.label}</div>
                    <div className="text-[11px] text-gray-500 font-mono mt-0.5">{p.participant}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {p.registered ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={12} /> {p.services} svc
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle size={12} /> Unregistered
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100">
            <Link href="/admin" className="inline-flex items-center gap-1 text-xs font-semibold text-[#7C01ED] hover:underline">
              Manage Tenants & Participants <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Documents Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Recent Documents</h2>
          <Link href="/invoices" className="text-xs font-semibold text-[#7C01ED] hover:underline flex items-center gap-1">
            View All <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-600">
              <tr>
                {["Type", "Invoice #", "Supplier", "Buyer", "Amount (AED)", "Date", "Status"].map((h) => (
                  <th key={h} className="px-6 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {recentDocs?.documents?.map((doc: any) => (
                <tr
                  key={doc.id}
                  onClick={() => router.push(`/invoices/${doc.id}`)}
                  className="hover:bg-purple-50/40 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5">
                      <span className={`text-[11px] px-2 py-0.5 rounded font-bold uppercase ${doc.participant_type === "billing" ? "bg-purple-100 text-[#7C01ED]" : "bg-purple-50 text-purple-800"
                        }`}>
                        {doc.participant_type === "billing" ? "Billing" : "Self-Bill"}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded font-bold uppercase ${doc.direction === "outbound" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700"
                        }`}>
                        {doc.direction === "outbound" ? "OUT" : "IN"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono font-bold text-gray-900 max-w-[140px] truncate">
                    {doc.invoice_number ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-800">{doc.supplier_name ?? "—"}</td>
                  <td className="px-6 py-4 text-xs text-gray-800">{doc.buyer_name ?? "—"}</td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-900">
                    {doc.payable_amount ? fmt(doc.payable_amount) : "—"}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600">{doc.issue_date ?? "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-bold border ${doc.status === "sent" || doc.status === "acknowledged"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : doc.status === "send_failed"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : doc.status === "draft"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-purple-50 text-[#7C01ED] border-purple-200"
                      }`}>
                      {doc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}