// components/InvoiceFileUpload.tsx
"use client";
import { useState } from "react";
import { Upload, X, FileText, CheckCircle2, AlertCircle } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

interface Props {
  onExtracted: (data: any) => void;
  onClose: () => void;
}

export default function InvoiceFileUpload({ onExtracted, onClose }: Props) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<any>(null);

  const upload = async (file: File) => {
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${BASE}/invoices/upload-extract`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPreview(data);
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  };

  const apply = () => {
    if (preview?.extracted) onExtracted(preview.extracted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Upload size={16} className="text-[#7C01ED]" />
            <h2 className="text-sm font-bold text-gray-900">Upload Invoice File</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Drop Zone */}
          {!preview && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragging ? "border-[#7C01ED] bg-purple-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="animate-spin w-8 h-8 border-2 border-[#7C01ED] border-t-transparent rounded-full inline-block" />
                  <p className="text-xs text-gray-500">Extracting invoice data...</p>
                </div>
              ) : (
                <>
                  <FileText size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    Drop your invoice file here
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    Supports XML (UBL), JSON, CSV
                  </p>
                  <label className="px-4 py-2 bg-[#7C01ED] text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-[#6800CB] transition-colors">
                    Browse Files
                    <input
                      type="file"
                      accept=".xml,.json,.csv"
                      className="hidden"
                      onChange={handleFile}
                    />
                  </label>
                </>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={15} className="text-emerald-600" />
                Extracted from {preview.filename} ({preview.format.toUpperCase()}, {preview.size} bytes)
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2 text-xs max-h-48 overflow-y-auto">
                {[
                  ["Invoice #",   preview.extracted?.invoice_number],
                  ["Issue Date",  preview.extracted?.issue_date],
                  ["Due Date",    preview.extracted?.due_date],
                  ["Currency",    preview.extracted?.currency_code],
                  ["Supplier",    preview.extracted?.supplier?.name ?? preview.extracted?.supplier_name],
                  ["Buyer",       preview.extracted?.buyer?.name ?? preview.extracted?.buyer_name],
                  ["Buyer TRN",   preview.extracted?.buyer?.tax_id ?? preview.extracted?.buyer_tax_id],
                  ["Line Items",  preview.extracted?.line_items?.length
                    ? `${preview.extracted.line_items.length} item(s)`
                    : null],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k as string} className="flex justify-between">
                    <span className="text-gray-500 font-medium">{k}</span>
                    <span className="font-semibold text-gray-800 text-right max-w-[60%] truncate">{v as string}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setPreview(null); setError(""); }}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Upload Different File
                </button>
                <button
                  onClick={apply}
                  className="flex-1 px-4 py-2 bg-[#7C01ED] hover:bg-[#6800CB] text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Apply to Form
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}