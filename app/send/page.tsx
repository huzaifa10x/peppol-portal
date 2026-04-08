"use client";
import { useState } from "react";
import { api, SendResult } from "@/lib/api";
import { Send, CheckCircle, XCircle, Upload, Info } from "lucide-react";

const DOC_TYPES = [
  { value: "invoice",        label: "PINT-AE Invoice",          badge: "billing",     color: "blue" },
  { value: "credit_note",    label: "PINT-AE Credit Note",      badge: "billing",     color: "blue" },
  { value: "sb_invoice",     label: "Self-Billing Invoice",     badge: "selfbilling", color: "purple" },
  { value: "sb_credit_note", label: "Self-Billing Credit Note", badge: "selfbilling", color: "purple" },
];

const RECEIVERS = [
  { value: "9922:OPTBCNTRLP2007", label: "Testbed exact match (OPTBCNTRLP2007)", env: "test" },
  { value: "9922:OPTBCNTRLP2005", label: "Testbed wildcard (OPTBCNTRLP2005)",    env: "test" },
  { value: "custom",              label: "Custom receiver ID",                   env: "prod" },
];

export default function SendPage() {
  const [docType, setDocType]     = useState("invoice");
  const [receiver, setReceiver]   = useState("9922:OPTBCNTRLP2007");
  const [customRcv, setCustomRcv] = useState("");
  const [result, setResult]       = useState<SendResult | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [rawFile, setRawFile]     = useState<File | null>(null);
  const [mode, setMode]           = useState<"template" | "raw">("template");

  const handleSend = async () => {
    setLoading(true); setResult(null); setError(null);
    try {
      const r = mode === "raw" && rawFile
        ? await api.sendRaw(rawFile)
        : await api.send(docType);
      setResult(r);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Send Document</h1>
      <p className="text-sm text-gray-500 mb-6">Send a PINT-AE document outbound via Oxalis-NG AS4</p>

      {/* Info banner */}
      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
        <Info size={15} className="text-blue-500 mt-0.5 shrink-0" />
        <div className="text-xs text-blue-700">
          <span className="font-semibold">Testbed mode active.</span> Sending to the OpenPeppol testbed requires
          an active test case to be running on the testbed portal. For production sending, use a real
          Peppol participant receiver ID.
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-5">
        {(["template", "raw"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === m
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}>
            {m === "template" ? "Use Template" : "Upload XML"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {mode === "template" ? (
          <>
            {/* Document type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Document Type</label>
              <div className="grid grid-cols-2 gap-2">
                {DOC_TYPES.map(t => (
                  <button key={t.value} onClick={() => setDocType(t.value)}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 text-left transition-all ${
                      docType === t.value
                        ? t.color === "blue" ? "border-blue-500 bg-blue-50" : "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}>
                    <span className="text-sm font-medium text-gray-800">{t.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      t.color === "blue"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}>{t.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Receiver */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Receiver</label>
              <div className="space-y-2">
                {RECEIVERS.map(r => (
                  <label key={r.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      receiver === r.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}>
                    <input type="radio" name="receiver" value={r.value}
                      checked={receiver === r.value}
                      onChange={() => setReceiver(r.value)}
                      className="text-blue-600" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-800">{r.label}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.env === "test"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                    }`}>{r.env}</span>
                  </label>
                ))}
              </div>
              {receiver === "custom" && (
                <input
                  value={customRcv}
                  onChange={e => setCustomRcv(e.target.value)}
                  placeholder="e.g. 0235:123456789000003"
                  className="mt-2 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              )}
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload XML File</label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <Upload size={20} className="text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">{rawFile ? rawFile.name : "Click to upload XML"}</span>
              <input type="file" accept=".xml" className="hidden"
                onChange={e => setRawFile(e.target.files?.[0] || null)} />
            </label>
          </div>
        )}

        <button onClick={handleSend}
          disabled={loading || (mode === "raw" && !rawFile) || (receiver === "custom" && !customRcv)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {loading
            ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Sending...</>
            : <><Send size={15} /> Send Document</>}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`mt-4 p-4 rounded-xl border ${
          result.invoice_sent ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        }`}>
          <div className="flex items-center gap-2 mb-3">
            {result.invoice_sent
              ? <CheckCircle size={16} className="text-green-600" />
              : <XCircle size={16} className="text-red-500" />}
            <span className="font-semibold text-sm text-gray-800">{result.status}</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Invoice sent</span>
              <span className={result.invoice_sent ? "text-green-600 font-medium" : "text-red-500"}>
                {result.invoice_sent ? "✓ Yes" : "✗ No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">TDD sent to FTA</span>
              <span className={result.tdd_sent ? "text-green-600 font-medium" : "text-amber-600"}>
                {result.tdd_sent ? "✓ Yes" : "— No"}
              </span>
            </div>
            {result.tdd_error && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-700 font-mono">
                {result.tdd_error.slice(0, 200)}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <XCircle size={14} className="text-red-500" />
            <span className="text-sm font-medium text-red-700">Send failed</span>
          </div>
          <p className="text-xs text-red-600 font-mono">{error}</p>
          {error.includes("503") && (
            <p className="text-xs text-red-500 mt-2">
              Send scripts may be missing from the container.
              Go to System → Restore Send Scripts.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
