"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, GitBranch, FileText, Send,
  CheckSquare, Shield, Building2, Activity,
  Receipt, FilePlus, ArrowUpRight, Settings
} from "lucide-react";

const nav = [
  { href: "/",               label: "Dashboard",       icon: LayoutDashboard },
  { href: "/processing",     label: "Processing",      icon: GitBranch },
  { href: "/inbox",          label: "Inbox",           icon: FileText },
  { href: "/invoices",       label: "All Invoices",    icon: Receipt },
  { href: "/outbound",       label: "Outbound",        icon: ArrowUpRight },
  { href: "/create-invoice", label: "Create Invoice",  icon: FilePlus },
  { href: "/send",           label: "Send (Template)", icon: Send },
  { href: "/validate",       label: "Validate",        icon: CheckSquare },
  { href: "/tdds",           label: "TDDs / MLS",      icon: Shield },
  { href: "/master-data",    label: "Master Data",     icon: Building2 },
  { href: "/admin",          label: "Admin",           icon: Settings },
  { href: "/system",         label: "System",          icon: Activity },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {nav.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link key={href} href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              active
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}>
            <Icon size={15} className={active ? "text-blue-600" : "text-gray-400"} />
            {label}
          </Link>
        );
      })}
    </>
  );
}
