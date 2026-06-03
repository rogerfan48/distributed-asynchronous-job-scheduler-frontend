"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListChecks, Gauge, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
};

const NAV: NavItem[] = [
  { href: "/tasks", label: "執行面板", icon: LayoutDashboard },
  { href: "/jobs", label: "紀錄面板", icon: ListChecks },
  { href: "/monitoring", label: "監控", icon: Gauge },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon, badge }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full transition-all",
                active ? "bg-primary" : "bg-transparent",
              )}
              aria-hidden
            />
            <Icon className={cn("size-4.5 shrink-0", active && "text-primary")} />
            <span className="flex-1">{label}</span>
            {badge && (
              <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
