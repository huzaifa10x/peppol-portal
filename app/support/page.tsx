// app/(dashboard)/support/page.tsx
"use client";
import { Mail, Phone, Clock, ExternalLink, Copy, CheckCheck } from "lucide-react";
import { useState } from "react";

const SUPPORT_EMAIL = "support@kasaadvisory.com";
const SUPPORT_PHONE = "+971 4 123 4567";
const SUPPORT_HOURS = "Sunday – Thursday, 9:00 AM – 6:00 PM (GST)";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      title="Copy"
    >
      {copied
        ? <CheckCheck size={14} className="text-green-500" />
        : <Copy size={14} />}
    </button>
  );
}

export default function SupportPage() {
  return (
    <div className="max-w-2xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Support</h1>
        <p className="text-sm text-gray-500 mt-1">
          Get help with your KASA e-invoicing platform
        </p>
      </div>

      {/* Contact cards */}
      <div className="space-y-3">

        {/* Email */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
            <Mail size={18} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
              Email Support
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
            <p className="text-xs text-gray-400 mt-0.5">
              We respond within 1 business day
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <CopyButton text={SUPPORT_EMAIL} />
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Open email"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Phone */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
            <Phone size={18} className="text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
              Phone Support
            </p>
            <a
              href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}
              className="text-sm font-medium text-green-600 hover:underline"
            >
              {SUPPORT_PHONE}
            </a>
            <p className="text-xs text-gray-400 mt-0.5">
              {SUPPORT_HOURS}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <CopyButton text={SUPPORT_PHONE} />
          </div>
        </div>

        {/* Hours */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
            <Clock size={18} className="text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
              Support Hours
            </p>
            <p className="text-sm font-medium text-gray-800">{SUPPORT_HOURS}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Gulf Standard Time (UTC+4) · UAE public holidays excluded
            </p>
          </div>
        </div>

      </div>

      {/* Footer note */}
      <p className="text-xs text-gray-400 mt-6 text-center">
        KASA Advisory Service FZE · PAE001045 · UAE PINT-AE Peppol Access Point
      </p>

    </div>
  );
}