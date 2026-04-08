"use client";
import { useState } from "react";
import { api, ValidationResult } from "@/lib/api";
import { CheckCircle, XCircle, Upload, AlertCircle } from "lucide-react";

export default function ValidatePage() {
  const [file, setFile]       = useState<File | null>(null);
  const [result, setResult]   = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleValidate = async () => {
    if (!file) return;
    setLoading(true); setResult(null); setError(null);
    try {
      setResult(await api.validate(file));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">XML Validator</h1>
      <p className="text-sm text-gray-500 mb-8">Validate a PINT-AE document against UAE schematron rules before sending</p>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
          <Upload size={24} className="text-gray-400 mb-2" />
          {file ? (
            <><span className="text-sm font-medium text-blue-700">{file.name}</span>
              <span className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</span></>
          ) : (
            <><span className="text-sm text-gray-500">Click to upload XML document</span>
              <span className="text-xs text-gray-400 mt-1">PINT-AE Invoice, Credit Note, or Self-Billing variants</span></>
          )}
          <input type="file" accept=".xml" className="hidden"
            onChange={e => { setFile(e.target.files?.[0] || null); setResult(null); }} />
        </label>

        <button onClick={handleValidate} disabled={!file || loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? "Validating..." : "Validate Document"}
        </button>
      </div>

      {result && (
        <div className={`mt-5 rounded-xl border p-5 ${result.valid ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <div className="flex items-center gap-2 mb-3">
            {result.valid
              ? <CheckCircle size={18} className="text-green-600" />
              : <XCircle size={18} className="text-red-500" />}
            <span className="font-semibold text-sm">{result.valid ? "Valid Document" : `Invalid — ${result.error_count} error(s)`}</span>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
              result.variant === "billing" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
            }`}>{result.variant}</span>
          </div>
          {result.errors.length > 0 && (
            <div className="space-y-2 mt-3">
              {result.errors.map((e, i) => (
                <div key={i} className="flex gap-2 text-xs bg-white rounded p-2 border border-red-100">
                  <AlertCircle size={12} className="text-red-500 mt-0.5 shrink-0" />
                  <span className="font-mono text-red-700 break-all">{e}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {error && <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
    </div>
  );
}
