"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import { ConsoleProvider, ConsolePanel, ConsoleToggle } from "./console";
import type { User } from "@/lib/types";

const ROUTE_TITLES: { prefix: string; title: string }[] = [
  { prefix: "/tasks", title: "任務執行" },
  { prefix: "/jobs", title: "Job 狀態" },
  { prefix: "/monitoring", title: "監控" },
];

function titleFor(pathname: string): string {
  const match = ROUTE_TITLES.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`),
  );
  return match?.title ?? "Job Scheduler";
}

export function AppShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <ConsoleProvider>
      <div className="flex h-dvh overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="bg-sidebar hidden w-64 shrink-0 flex-col border-r lg:flex">
          <div className="flex h-14 items-center px-5">
            <Brand size="sm" />
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3">
            <SidebarNav />
          </div>
          <div className="text-muted-foreground/60 px-5 py-3 text-[11px]">
            v0.1.0
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="bg-background/80 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="開啟選單"
            >
              <Menu className="size-5" />
            </Button>
            <h1 className="text-sm font-semibold tracking-tight">{titleFor(pathname)}</h1>
            <div className="flex-1" />
            <ConsoleToggle />
            <UserMenu user={user} />
          </header>

          {/* Content + docked console */}
          <div className="relative min-h-0 flex-1">
            <main className="scrollbar-thin h-full overflow-y-auto">
              <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
                {children}
              </div>
            </main>
            <ConsolePanel />
          </div>
        </div>
      </div>

      {/* Mobile nav drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="h-14 justify-center border-b px-5">
            <SheetTitle className="sr-only">導覽選單</SheetTitle>
            <Brand size="sm" />
          </SheetHeader>
          <div className="px-3 py-3">
            <SidebarNav />
          </div>
        </SheetContent>
      </Sheet>

      <Toaster theme="dark" position="top-right" richColors closeButton />
    </ConsoleProvider>
  );
}
