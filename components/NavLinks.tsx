// components/NavLinks.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session";
import {
  LayoutDashboard, GitBranch, FileText, Send, CheckSquare,
  Shield, Building2, Activity, Receipt, FilePlus,
  ArrowUpRight, Settings, SlidersHorizontal, Users, Headset,
} from "lucide-react";

// Roles: super_admin | admin | invoice_manager | accountant | viewer | api_user
// api_user has no portal access — never appears in nav

const allNav = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "admin", "invoice_manager", "accountant", "viewer"],
  },
  {
    href: "/processing",
    label: "Processing",
    icon: GitBranch,
    roles: ["super_admin"],
  },
  {
    href: "/inbox",
    label: "Inbox",
    icon: FileText,
    roles: ["super_admin", "admin", "invoice_manager", "accountant", "viewer"],
  },
  {
    href: "/invoices",
    label: "All Invoices",
    icon: Receipt,
    roles: ["super_admin", "admin", "invoice_manager", "accountant", "viewer"],
  },
  {
    href: "/outbound",
    label: "Outbound",
    icon: ArrowUpRight,
    roles: ["super_admin", "admin", "invoice_manager"],
  },
  {
    href: "/create-invoice",
    label: "Create Invoice",
    icon: FilePlus,
    roles: ["super_admin", "admin", "invoice_manager"],
  },
  // {
  //   href: "/validate",
  //   label: "Validate",
  //   icon: CheckSquare,
  //   roles: ["super_admin", "admin", "invoice_manager"],
  // },
  {
    href: "/fta-onboardings",
    label: "FTA Onboardings",
    icon: Users,
    roles: ["super_admin"],
  },
  {
    href: "/tdds",
    label: "TDDs / MLS",
    icon: Shield,
    roles: ["super_admin", "admin"],
  },
  {
    href: "/master-data",
    label: "Master Data",
    icon: Building2,
    roles: ["super_admin"],
  },
  {
    href: "/admin",
    label: "Admin",
    icon: Settings,
    roles: ["super_admin"],
  },
  {
    href: "/settings",
    label: "Settings",
    icon: SlidersHorizontal,
    roles: ["super_admin", "admin", "invoice_manager", "accountant", "viewer"],
  },
  {
    href: "/system",
    label: "System",
    icon: Activity,
    roles: ["super_admin"],
  },
  {
    href: "/support",
    label: "Support",
    icon: Headset,
    roles: ["super_admin", "admin", "invoice_manager", "accountant", "viewer"],
  },
];

export default function NavLinks() {
  const pathname  = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role ?? "viewer";

  const nav = allNav.filter(item => item.roles.includes(role));

  return (
    <nav className="space-y-1">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              active
                ? "bg-[#7C01ED]/10 text-[#7C01ED]"
                : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
            }`}
          >
            <Icon
              size={16}
              className={`shrink-0 transition-colors ${
                active ? "text-[#7C01ED]" : "text-gray-400"
              }`}
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}