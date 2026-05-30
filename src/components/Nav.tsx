"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/assets", label: "Master FAR", icon: "▤" },
  { href: "/categories", label: "Categories", icon: "▣" },
  { href: "/setup", label: "Coding Setup", icon: "#" },
  { href: "/depreciation", label: "Depreciation", icon: "↓" },
  { href: "/disposals", label: "Disposals", icon: "⊗" },
  { href: "/transfers", label: "Transfers", icon: "⇄" },
  { href: "/adjustments", label: "Adjustments", icon: "±" },
  { href: "/documents", label: "Documents", icon: "▭" },
  { href: "/reports", label: "Reports", icon: "▥" },
  { href: "/labels", label: "Asset Labels", icon: "▦" },
  { href: "/activity", label: "Activity Log", icon: "≣" },
  { href: "/import", label: "Import", icon: "⇪" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function Nav({ user }: { user: string }) {
  const pathname = usePathname();
  return (
    <aside className="no-print w-60 shrink-0 bg-slate-900 text-slate-200 min-h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-slate-700">
        <div className="text-lg font-bold text-white leading-tight">
          ProSynergy <span className="text-brand-green">FAR</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">Fixed Asset Register</div>
      </div>
      <nav className="flex-1 py-3">
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-brand-green/20 text-white border-l-4 border-brand-green"
                  : "text-slate-300 hover:bg-slate-800 border-l-4 border-transparent"
              }`}
            >
              <span className="w-4 text-center opacity-80">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-slate-700 text-xs text-slate-400">
        <div className="mb-2">
          Signed in as <span className="text-slate-200">{user}</span>
        </div>
        <form action="/api/logout" method="post">
          <button className="text-brand-green hover:underline" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
