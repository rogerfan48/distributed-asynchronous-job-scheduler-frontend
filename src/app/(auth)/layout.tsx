import { Brand } from "@/components/brand";
import { Activity, GitBranch, ShieldCheck } from "lucide-react";

const HIGHLIGHTS = [
  { icon: Activity, title: "即時執行狀態", desc: "pending / running / completed / error 一目了然" },
  { icon: GitBranch, title: "依賴與排程", desc: "cron / interval 排程，任務間相依自動串接" },
  { icon: ShieldCheck, title: "安全的工作階段", desc: "Token 以 httpOnly cookie 保存，前端無法讀取" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand / marketing pane (desktop) */}
      <aside className="bg-sidebar relative hidden overflow-hidden border-r lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -top-32 -left-24 size-96 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(closest-side, var(--primary), transparent)" }}
          aria-hidden
        />
        <div className="relative">
          <Brand size="lg" />
        </div>
        <div className="relative space-y-8">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              分散式任務排程控制台
            </h2>
            <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
              提交、排程與監控你的任務。集中管理 jobs、runs 與 logs，
              手動干預隨時可用。
            </p>
          </div>
          <ul className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="bg-primary/10 text-primary mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg">
                  <Icon className="size-4.5" />
                </span>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-muted-foreground text-xs">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-muted-foreground relative text-xs">
          © {new Date().getFullYear()} Job Scheduler
        </div>
      </aside>

      {/* Form pane */}
      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Brand size="md" />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
