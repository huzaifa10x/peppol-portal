"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText, Send, CheckSquare, Shield,
  Activity, LayoutDashboard, Building2, GitBranch, Receipt, FilePlus
} from "lucide-react";

const nav = [
  { href: "/",            label: "Dashboard",   icon: LayoutDashboard },
  { href: "/processing",  label: "Processing",  icon: GitBranch },
  { href: "/inbox",       label: "Inbox",       icon: FileText },
  { href: "/send",        label: "Send",        icon: Send },
  { href: "/validate",    label: "Validate",    icon: CheckSquare },
  { href: "/tdds",        label: "TDDs / MLS",  icon: Shield },
  { href: "/master-data", label: "Master Data", icon: Building2 },
  { href: "/system",      label: "System",      icon: Activity },
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
            <Icon size={16} className={active ? "text-blue-600" : "text-gray-400"} />
            {label}
          </Link>
        );
      })}
    </>
  );
}
