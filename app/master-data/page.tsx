"use client";
import { useEffect, useState } from "react";
import { dbApi, Party } from "@/lib/api";
import { Plus, Building2, CheckCircle, XCircle, RefreshCw } from "lucide-react";

export default function MasterDataPage() {
  const [parties, setParties]   = useState<Party[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({
    name: "", tax_id: "", vat_number: "", trade_registry_code: "",
    country_code: "AE", city: "", iban: "", peppol_id: "",
  });

  const load = async () => {
    setLoading(true);
    const r = await dbApi.parties();
    setParties(r.parties);
    setTotal(r.total);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    await dbApi.createParty(form);
    setForm({ name: "", tax_id: "", vat_number: "", trade_registry_code: "",
               country_code: "AE", city: "", iban: "", peppol_id: "" });
    setShowForm(false);
    await load();
    setSaving(false);
  };

  const Field = ({ label, field, placeholder }: { label: string; field: keyof typeof form; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        value={form[field]}
        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Master Data</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} organisations</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load}
            className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50">
            <RefreshCw size={14} className={loading ? "animate-spin text-blue-500" : "text-gray-400"} />
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus size={14} /> Add Organisation
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-800">New Organisation</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="lg:col-span-2">
              <Field label="Organisation Name *" field="name" placeholder="ACME Trading LLC" />
            </div>
            <Field label="Tax ID (TIN)" field="tax_id" placeholder="100000000000003" />
            <Field label="VAT Number" field="vat_number" placeholder="100000000000003" />
            <Field label="Trade Registry Code" field="trade_registry_code" placeholder="TR-12345" />
            <Field label="City" field="city" placeholder="Dubai" />
            <Field label="IBAN" field="iban" placeholder="AE070331234567890123456" />
            <Field label="Peppol ID" field="peppol_id" placeholder="0235:100000000000003" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={save} disabled={saving || !form.name}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving..." : "Save Organisation"}
            </button>
          </div>
        </div>
      )}

      {/* Parties table */}
      {parties.length === 0 && !loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <Building2 size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">No organisations yet</p>
          <p className="text-xs text-gray-400 mt-1">Add your trading partners and clients here</p>
          <button onClick={() => setShowForm(true)}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 mx-auto">
            <Plus size={14} /> Add Organisation
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Name", "Tax ID", "VAT Number", "Trade Reg.", "City", "Peppol ID", "Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">Loading...</td></tr>
              ) : parties.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-blue-700">{p.name[0].toUpperCase()}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-800">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-600">{p.tax_id ?? "—"}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-600">{p.vat_number ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{p.trade_registry_code ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{p.city ?? "—"}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">{p.peppol_id ?? "—"}</td>
                  <td className="px-4 py-3">
                    {p.is_active
                      ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle size={11} />Active</span>
                      : <span className="flex items-center gap-1 text-xs text-red-500"><XCircle size={11} />Inactive</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
