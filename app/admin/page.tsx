// app/(dashboard)/admin/page.tsx
"use client";
import { useEffect, useState } from "react";
import { tenantApi, Tenant, TenantUser } from "@/lib/api";
import {
  Building2, Users, Plus, ChevronRight, CheckCircle,
  XCircle, Pencil, X, Save, Loader2, ShieldCheck,
} from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

// ── Peppol platform roles ──────────────────────────────────────────────────
const ROLES = [
  {
    value: "super_admin",
    label: "Super Admin",
    color: "bg-red-100 text-red-700",
    desc: "Full platform access — KASA staff only",
  },
  {
    value: "admin",
    label: "Admin",
    color: "bg-purple-100 text-purple-700",
    desc: "Full tenant access — manage users and settings",
  },
  {
    value: "invoice_manager",
    label: "Invoice Manager",
    color: "bg-blue-100 text-blue-700",
    desc: "Create, validate, and send invoices",
  },
  {
    value: "accountant",
    label: "Accountant",
    color: "bg-teal-100 text-teal-700",
    desc: "View invoices and download reports — no sending",
  },
  {
    value: "viewer",
    label: "Viewer",
    color: "bg-gray-100 text-gray-600",
    desc: "Read-only — dashboards and invoice status",
  },
  {
    value: "api_user",
    label: "API User",
    color: "bg-orange-100 text-orange-700",
    desc: "ERP integration only — no portal access",
  },
] as const;

type RoleValue = typeof ROLES[number]["value"];

function RoleBadge({ role }: { role: string }) {
  const r = ROLES.find(r => r.value === role);
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r?.color ?? "bg-gray-100 text-gray-600"}`}>
      {r?.label ?? role}
    </span>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder = "",
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-[#7C01ED]/30 focus:border-[#7C01ED]"
      />
    </div>
  );
}

// ── Edit Tenant Panel ──────────────────────────────────────────────────────
function EditTenantPanel({
  tenant, onSave, onClose,
}: {
  tenant: Tenant;
  onSave: (t: Tenant) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: tenant.name,
    slug: tenant.slug,
    peppol_id: tenant.peppol_id ?? "",
    notification_email: tenant.notification_email ?? "",
    billing_participant_id: tenant.billing_participant_id,
    selfbilling_participant_id: tenant.selfbilling_participant_id,
    plan: tenant.plan,
    is_active: tenant.is_active,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await tenantApi.updateTenant(tenant.id, form as any);
      onSave({ ...tenant, ...form });
    } catch (e: any) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Panel header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pencil size={13} className="text-[#7C01ED]" />
          <span className="text-sm font-semibold text-gray-800">Edit Tenant</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="p-5 space-y-3">
        <Field label="Company Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="ACME Trading LLC" />
        <Field label="Slug" value={form.slug} onChange={v => setForm(f => ({ ...f, slug: v }))} placeholder="acme-trading" />
        <Field label="Peppol ID" value={form.peppol_id} onChange={v => setForm(f => ({ ...f, peppol_id: v }))} placeholder="0235:100000000000003" />
        <Field label="Notification Email" value={form.notification_email} onChange={v => setForm(f => ({ ...f, notification_email: v }))} type="email" placeholder="admin@company.ae" />
        <Field label="Billing AP" value={form.billing_participant_id} onChange={v => setForm(f => ({ ...f, billing_participant_id: v }))} placeholder="0235:pae001045" />
        <Field label="Self-billing AP" value={form.selfbilling_participant_id} onChange={v => setForm(f => ({ ...f, selfbilling_participant_id: v }))} placeholder="0235:2222" />

        {/* Plan */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Plan</label>
          <select
            value={form.plan}
            onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-[#7C01ED]/30 focus:border-[#7C01ED]"
          >
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between py-2 border-t border-gray-100">
          <div>
            <p className="text-xs font-medium text-gray-700">Active</p>
            <p className="text-xs text-gray-400">Inactive tenants cannot log in or submit invoices</p>
          </div>
          <button
            onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
            className={`relative w-10 h-5 rounded-full transition-colors ${form.is_active ? "bg-green-500" : "bg-gray-300"
              }`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? "translate-x-5" : "translate-x-0.5"
              }`} />
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2 text-sm bg-[#7C01ED] text-white rounded-lg
                       hover:bg-[#6800CB] disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "", name: "", password: "", role: "invoice_manager" as RoleValue,
  });
  const [newTenant, setNewTenant] = useState({
    company_name: "", slug: "", email: "", name: "", password: "", peppol_id: "",
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const r = await tenantApi.listTenants();
    setTenants(r.tenants);
    setLoading(false);
  };

  const loadUsers = async (tenant: Tenant) => {
    setSelected(tenant);
    setEditing(false);
    const r = await tenantApi.users(tenant.id);
    setUsers(r.users);
  };

  useEffect(() => { load(); }, []);

  const addUser = async () => {
    if (!selected || !newUser.email || !newUser.name || !newUser.password) return;
    setSaving(true);
    await tenantApi.addUser(selected.id, newUser);
    const r = await tenantApi.users(selected.id);
    setUsers(r.users);
    setNewUser({ email: "", name: "", password: "", role: "invoice_manager" });
    setShowAddUser(false);
    setSaving(false);
  };

  const addTenant = async () => {
    setSaving(true);
    try {
      await fetch(`${BASE}/auth/register-tenant`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTenant),
      });
      await load();
      setNewTenant({ company_name: "", slug: "", email: "", name: "", password: "", peppol_id: "" });
      setShowAddTenant(false);
    } catch { }
    setSaving(false);
  };

  const handleTenantSaved = (updated: Tenant) => {
    setSelected(updated);
    setTenants(ts => ts.map(t => t.id === updated.id ? updated : t));
    setEditing(false);
  };

  function UserRow({
    user, tenantId, onUpdated,
  }: {
    user: TenantUser;
    tenantId: string;
    onUpdated: (u: TenantUser) => void;
  }) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
      name: user.name,
      role: user.role,
      is_active: user.is_active,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const save = async () => {
      setSaving(true);
      setError("");
      try {
        await tenantApi.updateUser(tenantId, user.id, form);
        onUpdated({ ...user, ...form });
        setEditing(false);
      } catch (e: any) {
        setError(e.message || "Save failed");
      } finally {
        setSaving(false);
      }
    };

    if (editing) {
      return (
        <div className="px-5 py-3 bg-blue-50 border-l-2 border-[#7C01ED] space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-1 focus:ring-[#7C01ED]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Role</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-1 focus:ring-[#7C01ED]"
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
                {user.role == 'super_admin' &&
                  <option value={'super_admin'}>{'super admin'}</option>
                }
              </select>
            </div>
          </div>

          {/* Role description */}
          <div className="flex items-start gap-2 px-2.5 py-2 bg-white rounded-lg border border-blue-100">
            <ShieldCheck size={11} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              {ROLES.find(r => r.value === form.role)?.desc}
            </p>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 font-medium">Active</span>
            <button
              onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              className={`relative w-9 h-5 rounded-full transition-colors ${form.is_active ? "bg-green-500" : "bg-gray-300"
                }`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? "translate-x-4" : "translate-x-0.5"
                }`} />
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setEditing(false); setError(""); }}
              className="flex-1 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-white"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 py-1.5 text-xs bg-[#7C01ED] text-white rounded-lg
                       hover:bg-[#6800CB] disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {saving && <Loader2 size={11} className="animate-spin" />}
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="px-5 py-3 flex items-center justify-between group">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-gray-600">{user.name[0]}</span>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-800">{user.name}</div>
            <div className="text-xs text-gray-400">{user.email}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RoleBadge role={user.role} />
          {user.is_active
            ? <CheckCircle size={12} className="text-green-500" />
            : <XCircle size={12} className="text-red-400" />
          }
          <button
            onClick={() => setEditing(true)}
            className="p-1 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100
                     opacity-0 group-hover:opacity-100 transition-all"
            title="Edit user"
          >
            <Pencil size={11} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage tenants and users</p>
        </div>
        <button onClick={() => setShowAddTenant(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border-[#7C01ED] border text-[#7C01ED] rounded-lg transition-colors">
          <Plus size={14} /> Add Tenant
        </button>
      </div>

      {/* Add tenant form */}
      {showAddTenant && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">New Tenant</h2>
            <button onClick={() => setShowAddTenant(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Company Name", field: "company_name", placeholder: "ACME Trading LLC" },
              { label: "Slug", field: "slug", placeholder: "acme-trading" },
              { label: "Peppol ID", field: "peppol_id", placeholder: "0235:100000000000003" },
              { label: "Admin Name", field: "name", placeholder: "Ahmed Al Mansoori" },
              { label: "Admin Email", field: "email", placeholder: "admin@acme.ae" },
              { label: "Password", field: "password", placeholder: "••••••••" },
            ].map(({ label, field, placeholder }) => (
              <div key={field}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  type={field === "password" ? "password" : "text"}
                  value={(newTenant as any)[field]}
                  onChange={e => setNewTenant(t => ({ ...t, [field]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-[#7C01ED]/30"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAddTenant(false)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={addTenant} disabled={saving}
              className="px-4 py-2 text-sm bg-[#7C01ED] text-white rounded-lg
                         hover:bg-[#6800CB] disabled:opacity-50">
              {saving ? "Creating..." : "Create Tenant"}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Tenants list */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Building2 size={14} className="text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">
              Tenants ({tenants.length})
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">Loading...</div>
            ) : tenants.map(t => (
              <div key={t.id}
                onClick={() => loadUsers(t)}
                className={`px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${selected?.id === t.id ? "bg-blue-50 border-l-2 border-blue-500" : ""
                  }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-blue-700">{t.name[0]}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{t.name}</div>
                      <div className="text-xs text-gray-400 font-mono">
                        {t.peppol_id || "No Peppol ID"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                      }`}>{t.is_active ? "Active" : "Inactive"}</span>
                    <ChevronRight size={14} className="text-gray-400" />
                  </div>
                </div>
                <div className="flex gap-4 mt-2 ml-11">
                  <span className="text-xs text-gray-400">{t.user_count} users</span>
                  <span className="text-xs text-gray-400">{t.document_count} documents</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${t.plan === "enterprise" ? "bg-purple-100 text-purple-700" :
                    t.plan === "pro" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>{t.plan}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        {selected ? (
          <div className="space-y-4">

            {/* Edit or view */}
            {editing ? (
              <EditTenantPanel
                tenant={selected}
                onSave={handleTenantSaved}
                onClose={() => setEditing(false)}
              />
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-700">{selected.name}</h2>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200
                               rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    ["ID", selected.id.slice(0, 16) + "…"],
                    ["Slug", selected.slug],
                    ["Peppol ID", selected.peppol_id || "—"],
                    ["Plan", selected.plan],
                    ["Email", selected.notification_email || "—"],
                    ["Billing AP", selected.billing_participant_id],
                    ["Self-bill AP", selected.selfbilling_participant_id],
                    ["Documents", String(selected.document_count)],
                    ["Status", selected.is_active ? "Active" : "Inactive"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div className="text-gray-400 mb-0.5">{k}</div>
                      <div className="text-gray-700 font-mono truncate">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    Users ({users.length})
                  </span>
                </div>
                <button onClick={() => setShowAddUser(!showAddUser)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 border border-blue-200
                             text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100">
                  <Plus size={11} /> Add User
                </button>
              </div>

              {/* Add user form */}
              {showAddUser && (
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {(["name", "email", "password"] as const).map(field => (
                      <div key={field}>
                        <label className="block text-xs text-gray-500 mb-1 capitalize">{field}</label>
                        <input
                          type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                          value={newUser[field]}
                          onChange={e => setNewUser(u => ({ ...u, [field]: e.target.value }))}
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg
                                     focus:outline-none focus:ring-1 focus:ring-[#7C01ED]"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Role</label>
                      <select
                        value={newUser.role}
                        onChange={e => setNewUser(u => ({ ...u, role: e.target.value as RoleValue }))}
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg
                                   focus:outline-none focus:ring-1 focus:ring-[#7C01ED]"
                      >
                        {ROLES.filter(r => r.value !== "super_admin").map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Role description */}
                  <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                    <ShieldCheck size={12} className="text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700">
                      {ROLES.find(r => r.value === newUser.role)?.desc}
                    </p>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowAddUser(false)}
                      className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-white">
                      Cancel
                    </button>
                    <button onClick={addUser} disabled={saving}
                      className="px-3 py-1.5 text-xs bg-[#7C01ED] text-white rounded-lg
                                 hover:bg-[#6800CB] disabled:opacity-50 flex items-center gap-1.5">
                      {saving && <Loader2 size={11} className="animate-spin" />}
                      {saving ? "Adding…" : "Add User"}
                    </button>
                  </div>
                </div>
              )}

              {/* User list */}
              <div className="divide-y divide-gray-50">
                {users.length === 0 ? (
                  <div className="px-5 py-8 text-center text-xs text-gray-400">No users yet</div>
                ) : users.map(u => (
                  <UserRow
                    key={u.id}
                    user={u}
                    tenantId={selected!.id}
                    onUpdated={updated => setUsers(us => us.map(x => x.id === updated.id ? updated : x))}
                  />
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <Building2 size={24} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Select a tenant to manage</p>
          </div>
        )}
      </div>
    </div>
  );
}