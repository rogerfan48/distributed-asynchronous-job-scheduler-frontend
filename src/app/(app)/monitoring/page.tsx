import type { Metadata } from "next";
import { Gauge, Activity, Layers, CheckCircle2, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { grafanaDashboardUrl, isGrafanaHealthy } from "@/lib/grafana";

export const metadata: Metadata = { title: "監控" };

const PANELS = [
  { icon: Layers, title: "Queue 長度", desc: "Redis Stream 待處理 run 數量趨勢" },
  { icon: Activity, title: "Worker 負載", desc: "各 worker 並行執行數與處理速率" },
  { icon: CheckCircle2, title: "成功 / 失敗率", desc: "依時間區間的執行結果分佈" },
  { icon: Gauge, title: "執行延遲", desc: "排入佇列到開始執行的等待時間" },
];

export default async function MonitoringPage() {
  const dashboardUrl = grafanaDashboardUrl();
  const healthy = dashboardUrl ? await isGrafanaHealthy() : false;

  if (!healthy) {
    return (
      <div className="space-y-6">
        <div className="border-status-failed/30 bg-status-failed/10 flex items-start gap-3 rounded-xl border px-4 py-3">
          <Wrench className="text-status-failed mt-0.5 size-5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium">後端監控頁面維護中</p>
            <p className="text-muted-foreground mt-0.5">
              暫時無法載入監控 dashboard，請聯繫{" "}
              <a href="mailto:roger@roger.tw" className="text-primary hover:underline">roger@roger.tw</a>。
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {PANELS.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="opacity-70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="text-muted-foreground size-4" />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/40 text-muted-foreground/60 grid h-28 place-items-center rounded-lg border border-dashed text-xs">
                  暫時無法顯示
                </div>
                <p className="text-muted-foreground mt-2 text-xs">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Full-bleed: fill the content area (below the h-14 navbar, right of the
  // w-64 sidebar; hidden on mobile so left-0 there). The insets go on a wrapper
  // div — an <iframe> is a replaced element and won't stretch from insets alone.
  return (
    <div className="fixed top-14 right-0 bottom-0 left-0 lg:left-64">
      <iframe
        title="cloudNative Grafana dashboard"
        src={dashboardUrl}
        className="size-full border-0"
      />
    </div>
  );
}
