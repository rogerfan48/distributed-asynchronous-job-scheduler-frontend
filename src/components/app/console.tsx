"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Terminal, Trash2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ConsoleLevel = "info" | "success" | "error" | "system";

export type ConsoleEntry = {
  id: string;
  ts: number;
  level: ConsoleLevel;
  message: string;
};

type ConsoleContextValue = {
  entries: ConsoleEntry[];
  open: boolean;
  unseen: number;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  push: (level: ConsoleLevel, message: string) => void;
  clear: () => void;
};

const ConsoleContext = createContext<ConsoleContextValue | null>(null);

const MAX_ENTRIES = 200;

export function ConsoleProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [open, setOpenState] = useState(false);
  const [unseen, setUnseen] = useState(0);
  const seq = useRef(0);

  const push = useCallback((level: ConsoleLevel, message: string) => {
    seq.current += 1;
    const entry: ConsoleEntry = {
      id: `${Date.now()}-${seq.current}`,
      ts: Date.now(),
      level,
      message,
    };
    setEntries((prev) => {
      const next = [...prev, entry];
      return next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next;
    });
    setUnseen((n) => (open ? n : n + 1));
  }, [open]);

  const setOpen = useCallback((value: boolean) => {
    setOpenState(value);
    if (value) setUnseen(0);
  }, []);

  const toggle = useCallback(() => setOpen(!open), [open, setOpen]);
  const clear = useCallback(() => setEntries([]), []);

  const value = useMemo(
    () => ({ entries, open, unseen, setOpen, toggle, push, clear }),
    [entries, open, unseen, setOpen, toggle, push, clear],
  );

  return <ConsoleContext.Provider value={value}>{children}</ConsoleContext.Provider>;
}

export function useConsole(): ConsoleContextValue {
  const ctx = useContext(ConsoleContext);
  if (!ctx) throw new Error("useConsole must be used within a ConsoleProvider");
  return ctx;
}

const LEVEL_STYLES: Record<ConsoleLevel, { dot: string; text: string; label: string }> = {
  info: { dot: "bg-status-running", text: "text-foreground", label: "INFO" },
  success: { dot: "bg-status-succeeded", text: "text-status-succeeded", label: "OK" },
  error: { dot: "bg-status-failed", text: "text-status-failed", label: "ERR" },
  system: { dot: "bg-status-canceled", text: "text-muted-foreground", label: "SYS" },
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("zh-TW", { hour12: false });
}

/** The bottom-docked console panel. Rendered once in the app shell. */
export function ConsolePanel() {
  const { entries, open, setOpen, clear } = useConsole();
  if (!open) return null;

  return (
    <section
      className="bg-card/95 supports-[backdrop-filter]:bg-card/80 absolute inset-x-0 bottom-0 z-20 flex h-72 flex-col border-t backdrop-blur"
      aria-label="Console"
    >
      <header className="flex h-10 shrink-0 items-center justify-between border-b px-3">
        <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
          <Terminal className="size-4" />
          <span className="uppercase tracking-wide">Console</span>
          <span className="text-muted-foreground/60">{entries.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="xs" onClick={clear} disabled={entries.length === 0}>
            <Trash2 className="size-3.5" />
            清空
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={() => setOpen(false)} aria-label="收合 Console">
            <ChevronDown className="size-4" />
          </Button>
        </div>
      </header>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-2 font-mono text-xs">
        {entries.length === 0 ? (
          <p className="text-muted-foreground/60 py-6 text-center">尚無訊息</p>
        ) : (
          <ul className="space-y-0.5">
            {entries.map((e) => {
              const s = LEVEL_STYLES[e.level];
              return (
                <li key={e.id} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-muted-foreground/50 tabular-nums shrink-0">
                    {formatTime(e.ts)}
                  </span>
                  <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", s.dot)} aria-hidden />
                  <span className={cn("shrink-0 font-semibold", s.text)}>{s.label}</span>
                  <span className="break-all whitespace-pre-wrap">{e.message}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

/** Topbar toggle button with an unseen-count badge. */
export function ConsoleToggle({ className }: { className?: string }) {
  const { toggle, open, unseen } = useConsole();
  return (
    <Button
      variant={open ? "secondary" : "ghost"}
      size="sm"
      onClick={toggle}
      className={cn("relative", className)}
    >
      <Terminal className="size-4" />
      Console
      {unseen > 0 && !open && (
        <span className="bg-primary text-primary-foreground ml-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold tabular-nums">
          {unseen > 99 ? "99+" : unseen}
        </span>
      )}
    </Button>
  );
}
