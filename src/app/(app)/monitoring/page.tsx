import type { Metadata } from "next";
import { Gauge, Activity, Layers, CheckCircle2, Construction } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "監控" };

const PANELS = [
  { icon: Layers, title: "Queue 長度", desc: "Redis Stream 待處理 run 數量趨勢" },
  { icon: Activity, title: "Worker 負載", desc: "各 worker 並行執行數與處理速率" },
  { icon: CheckCircle2, title: "成功 / 失敗率", desc: "依時間區間的執行結果分佈" },
  { icon: Gauge, title: "執行延遲", desc: "排入佇列到開始執行的等待時間" },
];

export default function MonitoringPage() {
  return (
    <div className="space-y-6">
      <div className="border-primary/20 bg-primary/5 flex items-start gap-3 rounded-xl border px-4 py-3">
        <Construction className="text-primary mt-0.5 size-5 shrink-0" />
        <div className="text-sm">
          <p className="font-medium">監控頁規劃中</p>
          <p className="text-muted-foreground mt-0.5">
            後端已輸出 Prometheus 指標（<code className="font-mono text-xs">/metrics</code>）。
            此頁未來將串接 Prometheus + Grafana，呈現以下面板。
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PANELS.map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="opacity-80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="text-muted-foreground size-4" />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/40 text-muted-foreground/60 grid h-28 place-items-center rounded-lg border border-dashed text-xs">
                即將推出
              </div>
              <p className="text-muted-foreground mt-2 text-xs">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
