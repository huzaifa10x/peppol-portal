"use client";

import Link from "next/link";
import {
    Sparkles,
    Clock,
    ArrowLeft,
    BellRing,
    ShieldCheck,
    FileText,
} from "lucide-react";

export default function Dashboard() {
    return (
        <div className="min-h-[85vh] flex flex-col justify-center items-center text-right dir-rtl space-y-8 py-8" dir="rtl">
            {/* Page Header Header / Badge */}
            <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-[#7C01ED] text-xs font-bold">
                    <Sparkles size={14} />
                    <span>ميزة جديدة قادمة قريباً</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                    نعمل على تطوير هذه الصفحة
                </h1>

                <p className="text-base text-gray-600 leading-relaxed max-w-lg">
                    نحن نعمل حالياً على إتاحة هذه الخدمة لتوفير تجربة متكاملة متوافقة مع متطلبات الفوترة الإلكترونية والهيئة الاتحادية للضرائب (UAE FTA).
                </p>
            </div>

            {/* Feature Cards Preview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-4xl">
                <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#7C01ED]/40 transition-all shadow-xs">
                    <div className="bg-purple-50 p-2.5 rounded-lg w-fit mb-3">
                        <Clock size={20} className="text-[#7C01ED]" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">التحديثات المباشرة</h3>
                    <p className="text-xs text-gray-500 leading-normal">
                        متابعة حالة المستندات والتقارير الضرورية بشكل لحظي عبر النظام.
                    </p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#7C01ED]/40 transition-all shadow-xs">
                    <div className="bg-emerald-50 p-2.5 rounded-lg w-fit mb-3">
                        <ShieldCheck size={20} className="text-emerald-700" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">الامتثال الضريبي</h3>
                    <p className="text-xs text-gray-500 leading-normal">
                        ضمان التوافق الكامل مع معايير شبكة PINT-AE وشروط الفوترة.
                    </p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#7C01ED]/40 transition-all shadow-xs">
                    <div className="bg-purple-50 p-2.5 rounded-lg w-fit mb-3">
                        <FileText size={20} className="text-[#7C01ED]" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">تقارير أوتوماتيكية</h3>
                    <p className="text-xs text-gray-500 leading-normal">
                        توليد وتصدير ملفات التقرير الضريبي والتكامل السلس مع C5.
                    </p>
                </div>
            </div>

            {/* Action / Back Section */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-gray-200 w-full max-w-md">
                <Link
                    href="/"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#7C01ED] text-white rounded-lg text-sm font-semibold hover:bg-[#6801C8] transition-colors shadow-xs"
                >
                    <ArrowLeft size={16} /> العودة للوحة التحكم
                </Link>
                <button
                    disabled
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-400 rounded-lg text-sm font-semibold cursor-not-allowed border border-gray-200"
                >
                    <BellRing size={16} /> تفعيل التنبيهات
                </button>
            </div>
        </div>
    );
}