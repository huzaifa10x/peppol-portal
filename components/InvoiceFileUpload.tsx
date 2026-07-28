// components/InvoiceFileUpload.tsx
"use client";
import { useState, useRef } from "react";
import { Upload, FileText, AlertCircle, CheckCircle, X, Loader2 } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

const ACCEPTED = ".xml,.csv,.xlsx,.xls,.pdf,.json";
const FORMAT_LABELS: Record<string, string> = {
  ubl_xml: "UBL 2.1 XML",
  csv:     "CSV",
  xlsx:    "Excel",
  pdf:     "PDF",
  json:    "JSON",
};

interface ExtractedInvoice {
  invoice_type:     string;
  invoice_number:   string | null;
  issue_date:       string | null;
  due_date:         string | null;
  currency_code:    string;
  supplier:         { name: string | null; tax_id: string | null; country_code: string; address?: string | null };
  buyer:            { name: string | null; tax_id: string | null; country_code: string; address?: string | null };
  subtotal:         number | null;
  tax_amount:       number | null;
  total_amount:     number | null;
  notes:            string | null;
  buyer_reference:  string | null;
  line_items:       Array<{
    line_id: string; description: string; quantity: number;
    unit_price: number; line_total: number; vat_rate: number;
    vat_amount: number; unit_of_measure: string;
  }>;
  source_format:    string;
  filename:         string;
  confidence:       number;
  warnings:         string[];
}

interface Props {
  onExtracted: (data: ExtractedInvoice) => void;
  onClose: () => void;
}

export default function InvoiceFileUpload({ onExtracted, onClose }: Props) {
  const [dragging, setDragging]   = useState(false);
  const [loading,  setLoading]    = useState(false);
  const [error,    setError]      = useState("");
  const [preview,  setPreview]    = useState<ExtractedInvoice | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setLoading(true);
    setError("");
    setPreview(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch(`${BASE}/invoices/upload-extract`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message || "Extraction failed");
        return;
      }
      setPreview(data.data);
    } catch {
      setError("Upload failed — check your connection");
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const allowed = ["xml","csv","xlsx","xls","pdf","json"];
    if (!allowed.includes(ext)) {
      setError(`File type ".${ext}" is not supported. Use: CSV, Excel, XML, PDF, or JSON.`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 10 MB.");
      return;
    }
    upload(file);
  };

  const fmt = (n: number | null) =>
    n != null ? new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2 }).format(n) : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Upload Invoice File</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              CSV · Excel · UBL XML · PDF · JSON — fields are extracted automatically
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Drop zone */}
          {!preview && (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                dragging ? "border-[#7C01ED] bg-purple-50" : "border-gray-200 hover:border-[#7C01ED] hover:bg-gray-50"
              }`}
            >
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={32} className="animate-spin text-[#7C01ED]" />
                  <p className="text-sm text-gray-500">Extracting invoice data…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center">
                    <Upload size={24} className="text-[#7C01ED]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Drop your invoice file here, or <span className="text-[#7C01ED]">browse</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">CSV · Excel (.xlsx) · UBL XML · PDF · JSON · up to 10 MB</p>
                  </div>
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700">Extraction failed</p>
                <p className="text-xs text-red-600 mt-0.5">{error}</p>
              </div>
              <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-4">
              {/* Confidence bar */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <FileText size={16} className="text-gray-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-gray-700 truncate">{preview.filename}</p>
                    <span className="text-xs font-semibold text-gray-500 ml-2">
                      {FORMAT_LABELS[preview.source_format] || preview.source_format}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${preview.confidence >= 70 ? "bg-green-500" : preview.confidence >= 40 ? "bg-yellow-500" : "bg-red-400"}`}
                        style={{ width: `${preview.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 shrink-0">{preview.confidence}% filled</span>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {preview.warnings.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl space-y-1">
                  <p className="text-xs font-semibold text-yellow-800 mb-1.5">
                    {preview.warnings.length} field{preview.warnings.length > 1 ? "s" : ""} need attention:
                  </p>
                  {preview.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertCircle size={12} className="text-yellow-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-700">{w}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Extracted fields preview */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Type",     preview.invoice_type],
                  ["Number",   preview.invoice_number],
                  ["Date",     preview.issue_date],
                  ["Currency", preview.currency_code],
                  ["Supplier", preview.supplier?.name],
                  ["Buyer",    preview.buyer?.name],
                  ["Subtotal", preview.subtotal != null ? fmt(preview.subtotal) : null],
                  ["VAT",      preview.tax_amount != null ? fmt(preview.tax_amount) : null],
                  ["Total",    preview.total_amount != null ? fmt(preview.total_amount) : null],
                  ["Lines",    preview.line_items?.length ? `${preview.line_items.length} item${preview.line_items.length > 1 ? "s" : ""}` : null],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex gap-2 text-xs">
                    <span className="text-gray-400 w-20 shrink-0">{label}</span>
                    {value ? (
                      <span className="text-gray-800 font-medium flex items-center gap-1">
                        <CheckCircle size={10} className="text-green-500" /> {value}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic flex items-center gap-1">
                        <AlertCircle size={10} className="text-yellow-400" /> Not found
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Line items preview */}
              {preview.line_items?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Line Items</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left p-2 text-gray-500 font-medium">Description</th>
                          <th className="text-right p-2 text-gray-500 font-medium">Qty</th>
                          <th className="text-right p-2 text-gray-500 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.line_items.slice(0, 5).map((l, i) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="p-2 text-gray-700 truncate max-w-[200px]">{l.description}</td>
                            <td className="p-2 text-gray-500 text-right">{l.quantity}</td>
                            <td className="p-2 text-gray-700 text-right font-medium">{fmt(l.line_total)}</td>
                          </tr>
                        ))}
                        {preview.line_items.length > 5 && (
                          <tr>
                            <td colSpan={3} className="p-2 text-center text-gray-400 italic">
                              +{preview.line_items.length - 5} more items
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setPreview(null); setError(""); }}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Upload Different File
                </button>
                <button
                  onClick={() => onExtracted(preview)}
                  className="flex-1 py-2.5 bg-[#7C01ED] text-white rounded-xl text-sm font-bold hover:bg-[#6800CB]"
                >
                  Use This Data →
                </button>
              </div>
            </div>
          )}

          {/* Format guide */}
          {!preview && !loading && (
            <div className="grid grid-cols-5 gap-2">
              {[
                { fmt: "UBL XML", desc: "Peppol PINT-AE", color: "bg-teal-50 text-teal-700 border-teal-200" },
                { fmt: "Excel",  desc: ".xlsx with headers", color: "bg-green-50 text-green-700 border-green-200" },
                { fmt: "CSV",    desc: "Header row required", color: "bg-blue-50 text-blue-700 border-blue-200" },
                { fmt: "PDF",    desc: "Text-based only", color: "bg-orange-50 text-orange-700 border-orange-200" },
                { fmt: "JSON",   desc: "Structured data", color: "bg-purple-50 text-purple-700 border-purple-200" },
              ].map(({ fmt, desc, color }) => (
                <div key={fmt} className={`p-2 rounded-lg border text-center ${color}`}>
                  <p className="text-xs font-bold">{fmt}</p>
                  <p className="text-[10px] mt-0.5 opacity-75">{desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}