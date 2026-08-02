// components/BulkUpload.tsx
"use client";
import { useState, useRef } from "react";
import {
    Upload, CheckCircle, XCircle, FileText,
    Send, AlertTriangle, RefreshCw, ChevronDown, ChevronUp
} from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

type InvoiceResult = {
    document_id: string;
    invoice_number: string;
    status: string;
    valid: boolean;
    errors: string[];
    error_count: number;
    supplier: string;
    buyer: string;
    total: number;
    currency: string;
    sent?: boolean;
    c3_message_id?: string;
    sending?: boolean;
};

function getToken() {
    return document.cookie.match(/token=([^;]+)/)?.[1]
        || localStorage.getItem("token") || "";
}

export default function BulkUpload() {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [invoices, setInvoices] = useState<InvoiceResult[]>([]);
    const [sending, setSending] = useState(false);
    const [sendResult, setSendResult] = useState<any>(null);
    const [dragging, setDragging] = useState(false);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const inputRef = useRef<HTMLInputElement>(null);

    const validatedInvoices = invoices.filter(i => i.valid && !i.sent);
    const sentInvoices = invoices.filter(i => i.sent);
    const failedInvoices = invoices.filter(i => !i.valid);

    const handleUpload = async () => {
        if (!files.length) return;
        setUploading(true); setInvoices([]); setSendResult(null);
        const form = new FormData();
        files.forEach(f => form.append("files", f));
        const r = await fetch(`${BASE}/invoices/bulk-upload`, {
            method: "POST",
            credentials: "include",
            body: form
        }).then(r => r.json()).catch(() => null);

        if (r?.results) {
            const all: InvoiceResult[] = r.results.flatMap((f: any) =>
                (f.results || []).map((inv: any) => ({ ...inv, sent: false }))
            );
            setInvoices(all);
        }
        setFiles([]);
        setUploading(false);
    };

    const sendAll = async () => {
        const ids = validatedInvoices.map(i => i.document_id);
        if (!ids.length) return;
        setSending(true);
        setInvoices(prev => prev.map(i =>
            i.valid && !i.sent ? { ...i, sending: true } : i
        ));
        const r = await fetch(`${BASE}/invoices/bulk-send`, {
            method: "POST",
            credentials: "include",
            headers: {
                // Authorization: `Bearer ${getToken()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ document_ids: ids })
        }).then(r => r.json()).catch(() => null);

        if (r?.results) {
            setInvoices(prev => prev.map(inv => {
                const res = r.results.find((x: any) => x.document_id === inv.document_id);
                if (!res) return inv;
                return {
                    ...inv, sent: res.sent, c3_message_id: res.c3_message_id,
                    status: res.status, sending: false
                };
            }));
            setSendResult(r);
        }
        setSending(false);
    };

    const sendOne = async (doc_id: string) => {
        setInvoices(prev => prev.map(i =>
            i.document_id === doc_id ? { ...i, sending: true } : i
        ));
        const r = await fetch(`${BASE}/invoices/bulk-send`, {
            method: "POST",
            credentials: "include",
            headers: {
                // Authorization: `Bearer ${getToken()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ document_ids: [doc_id] })
        }).then(r => r.json()).catch(() => null);

        const res = r?.results?.[0];
        setInvoices(prev => prev.map(i =>
            i.document_id === doc_id
                ? {
                    ...i, sent: res?.sent, c3_message_id: res?.c3_message_id,
                    status: res?.status, sending: false
                }
                : i
        ));
    };

    return (
        <div className="space-y-6 mt-8">
            {/* Upload zone — only show if no results yet */}
            {invoices.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-1">Bulk upload</h2>
                    <p className="text-xs text-gray-400 mb-4">
                        Upload JSON (single invoice or array) or UBL XML files.
                        Each file is validated automatically after upload.
                    </p>

                    <div
                        onDragOver={e => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={e => {
                            e.preventDefault(); setDragging(false);
                            const dropped = Array.from(e.dataTransfer.files)
                                .filter(f =>
                                    f.name.endsWith(".json") ||
                                    f.name.endsWith(".xml") ||
                                    f.name.endsWith(".csv") ||
                                    f.name.endsWith(".xlsx") ||
                                    f.name.endsWith(".pdf")
                                )
                                .filter(f => f.name.endsWith(".json") || f.name.endsWith(".xml"));
                            setFiles(prev => [...prev, ...dropped]);
                        }}
                        onClick={() => inputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-colors mb-4
              ${dragging
                                ? "border-purple-400 bg-purple-50"
                                : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/30"}`}
                    >
                        <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                        <p className="text-sm font-medium text-gray-600">
                            Drop files here or click to browse
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            .json · .csv · .xlsx · .xml · .pdf — multiple files supported
                        </p>
                        <input ref={inputRef} type="file" multiple accept=".json,.xml,.csv,.xlsx,.pdf"
                            className="hidden"
                            onChange={e => {
                                setFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
                            }} />
                    </div>

                    {files.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {files.map((f, i) => {
                                const ext = f.name.split(".").pop()?.toLowerCase() || "";
                                const extColor: Record<string, string> = {
                                    json: "bg-purple-100 text-purple-700",
                                    csv: "bg-green-100 text-green-700",
                                    xlsx: "bg-emerald-100 text-emerald-700",
                                    xml: "bg-blue-100 text-blue-700",
                                    pdf: "bg-red-100 text-red-700",
                                };
                                return (
                                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <FileText size={14} className="text-purple-600" />
                                            <span className="text-sm text-gray-700">{f.name}</span>
                                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${extColor[ext] || "bg-gray-100 text-gray-600"}`}>
                                                {ext}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {(f.size / 1024).toFixed(1)} KB
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setFiles(files.filter((_, j) => j !== i))}
                                            className="text-xs text-gray-400 hover:text-red-500"
                                        >
                                            remove
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <button onClick={handleUpload}
                        disabled={!files.length || uploading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5
              bg-purple-600 text-white rounded-xl text-sm font-medium
              hover:bg-purple-700 disabled:opacity-50">
                        {uploading
                            ? <><RefreshCw size={14} className="animate-spin" />Uploading and validating...</>
                            : <><Upload size={14} />Upload and validate {files.length || ""} file{files.length !== 1 ? "s" : ""}</>}
                    </button>
                </div>
            )}

            {/* Results */}
            {invoices.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

                    {/* Summary bar */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center
            justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-500">{invoices.length} invoices</span>
                            {validatedInvoices.length > 0 && (
                                <span className="flex items-center gap-1 text-green-700">
                                    <CheckCircle size={13} />
                                    {validatedInvoices.length} ready to send
                                </span>
                            )}
                            {failedInvoices.length > 0 && (
                                <span className="flex items-center gap-1 text-red-600">
                                    <XCircle size={13} />
                                    {failedInvoices.length} validation failed
                                </span>
                            )}
                            {sentInvoices.length > 0 && (
                                <span className="flex items-center gap-1 text-blue-600">
                                    <Send size={13} />
                                    {sentInvoices.length} sent
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { setInvoices([]); setFiles([]); setSendResult(null); }}
                                className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200
                  rounded-lg hover:bg-gray-50">
                                Upload more
                            </button>
                            {validatedInvoices.length > 0 && (
                                <button onClick={sendAll} disabled={sending}
                                    className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-600
                    text-white text-xs font-medium rounded-lg hover:bg-purple-700
                    disabled:opacity-50">
                                    {sending
                                        ? <><RefreshCw size={12} className="animate-spin" />Sending...</>
                                        : <><Send size={12} />Send all ({validatedInvoices.length})</>}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Send result banner */}
                    {sendResult && (
                        <div className={`px-6 py-3 text-sm flex items-center gap-2
              ${sendResult.failed === 0
                                ? "bg-green-50 text-green-700 border-b border-green-100"
                                : "bg-amber-50 text-amber-700 border-b border-amber-100"}`}>
                            {sendResult.failed === 0
                                ? <CheckCircle size={14} />
                                : <AlertTriangle size={14} />}
                            {sendResult.sent} of {sendResult.total} invoices sent successfully
                            {sendResult.failed > 0 && ` · ${sendResult.failed} failed`}
                        </div>
                    )}

                    {/* Invoice list */}
                    <div className="divide-y divide-gray-50">
                        {invoices.map((inv) => (
                            <div key={inv.document_id} className="px-6 py-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {inv.sent
                                            ? <Send size={15} className="text-blue-500 flex-shrink-0" />
                                            : inv.valid
                                                ? <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
                                                : <XCircle size={15} className="text-red-500 flex-shrink-0" />}
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {inv.invoice_number}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${inv.sent
                                                        ? "bg-blue-100 text-blue-700"
                                                        : inv.valid
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"}`}>
                                                    {inv.sent ? "sent" : inv.status.replace("_", " ")}
                                                </span>
                                                {inv.c3_message_id && (
                                                    <span className="text-xs text-gray-400 font-mono truncate max-w-[140px]">
                                                        C3: {inv.c3_message_id.slice(0, 8)}...
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                {inv.supplier} → {inv.buyer}
                                                <span className="ml-2 font-medium text-gray-700">
                                                    {inv.currency} {Number(inv.total).toLocaleString("en-AE",
                                                        { minimumFractionDigits: 2 })}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {!inv.valid && inv.error_count > 0 && (
                                            <button
                                                onClick={() => setExpanded(prev => ({
                                                    ...prev, [inv.document_id]: !prev[inv.document_id]
                                                }))}
                                                className="flex items-center gap-1 text-xs text-red-500
                          hover:text-red-700">
                                                {inv.error_count} error{inv.error_count > 1 ? "s" : ""}
                                                {expanded[inv.document_id]
                                                    ? <ChevronUp size={12} />
                                                    : <ChevronDown size={12} />}
                                            </button>
                                        )}
                                        {inv.valid && !inv.sent && (
                                            <button
                                                onClick={() => sendOne(inv.document_id)}
                                                disabled={inv.sending || sending}
                                                className="flex items-center gap-1 px-3 py-1 text-xs
                          border border-purple-200 text-purple-600 rounded-lg
                          hover:bg-purple-50 disabled:opacity-40">
                                                {inv.sending
                                                    ? <RefreshCw size={11} className="animate-spin" />
                                                    : <Send size={11} />}
                                                Send
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Validation errors */}
                                {expanded[inv.document_id] && inv.errors?.length > 0 && (
                                    <div className="mt-3 pl-6 space-y-1">
                                        {inv.errors.map((err, i) => (
                                            <p key={i} className="text-xs text-red-600 font-mono
                        bg-red-50 rounded px-2 py-1">
                                                {err}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}