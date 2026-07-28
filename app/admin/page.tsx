"use client";
import { useEffect, useState } from "react";
import { tenantApi, Tenant, TenantUser } from "@/lib/api";
import { Building2, Users, Plus, ChevronDown, ChevronRight, CheckCircle, XCircle, Settings } from "lucide-react";


const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

export default function AdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", name: "", password: "", role: "viewer" });
  const [newTenant, setNewTenant] = useState({
    company_name: "", slug: "", email: "", name: "", password: "", peppol_id: ""
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
    setNewUser({ email: "", name: "", password: "", role: "viewer" });
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

  const toggleActive = async (tenant: Tenant) => {
    await tenantApi.updateTenant(tenant.id, { is_active: !tenant.is_active } as any);
    await load();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage tenants and users</p>
        </div>
        <button onClick={() => setShowAddTenant(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#7C01ED] text-white rounded-xl text-sm font-medium hover:bg-[#7C01ED]">
          <Plus size={14} /> Add Tenant
        </button>
      </div>

      {/* Add tenant form */}
      {showAddTenant && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">New Tenant</h2>
            <button onClick={() => setShowAddTenant(false)} className="text-gray-400 hover:text-gray-600">✕</button>
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
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAddTenant(false)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={addTenant} disabled={saving}
              className="px-4 py-2 text-sm bg-[#7C01ED] text-white rounded-lg hover:bg-[#7C01ED] disabled:opacity-50">
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
                      <div className="text-xs text-gray-400 font-mono">{t.peppol_id || "No Peppol ID"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
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

        {/* Tenant detail */}
        {selected ? (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700">{selected.name}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleActive(selected)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium border ${selected.is_active
                        ? "border-red-200 text-red-600 hover:bg-red-50"
                        : "border-green-200 text-green-600 hover:bg-green-50"
                      }`}>
                    {selected.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ["ID", selected.id.slice(0, 16) + "..."],
                  ["Slug", selected.slug],
                  ["Peppol ID", selected.peppol_id || "—"],
                  ["Plan", selected.plan],
                  ["Email", selected.notification_email || "—"],
                  ["Billing AP", selected.billing_participant_id],
                  ["Self-bill AP", selected.selfbilling_participant_id],
                  ["Documents", String(selected.document_count)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-gray-400 mb-0.5">{k}</div>
                    <div className="text-gray-700 font-mono truncate">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Users */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">Users ({users.length})</span>
                </div>
                <button onClick={() => setShowAddUser(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100">
                  <Plus size={11} /> Add User
                </button>
              </div>

              {showAddUser && (
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { label: "Name", field: "name", type: "text" },
                      { label: "Email", field: "email", type: "email" },
                      { label: "Password", field: "password", type: "password" },
                    ].map(({ label, field, type }) => (
                      <div key={field}>
                        <label className="block text-xs text-gray-500 mb-1">{label}</label>
                        <input type={type} value={(newUser as any)[field]}
                          onChange={e => setNewUser(u => ({ ...u, [field]: e.target.value }))}
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Role</label>
                      <select value={newUser.role}
                        onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="admin">Admin</option>
                        <option value="sender">Sender</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowAddUser(false)}
                      className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-white">Cancel</button>
                    <button onClick={addUser} disabled={saving}
                      className="px-3 py-1.5 text-xs bg-[#7C01ED] text-white rounded-lg hover:bg-[#7C01ED] disabled:opacity-50">
                      {saving ? "Adding..." : "Add User"}
                    </button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-gray-50">
                {users.map(u => (
                  <div key={u.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-600">{u.name[0]}</span>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-800">{u.name}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === "admin" ? "bg-purple-100 text-purple-700" :
                          u.role === "sender" ? "bg-blue-100 text-blue-700" :
                            "bg-gray-100 text-gray-600"
                        }`}>{u.role}</span>
                      {u.is_active
                        ? <CheckCircle size={12} className="text-green-500" />
                        : <XCircle size={12} className="text-red-400" />
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <Building2 size={24} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Select a tenant to manage users</p>
          </div>
        )}
      </div>
    </div>
  );
}
