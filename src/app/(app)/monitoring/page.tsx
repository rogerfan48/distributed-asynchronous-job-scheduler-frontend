import type { Metadata } from "next";
import { ExternalLink, MonitorDot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { grafanaDashboardUrl } from "@/lib/grafana";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "監控" };

export default async function MonitoringPage() {
  const dashboardUrl = grafanaDashboardUrl();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">CloudNative 監控</h2>
          <p className="text-muted-foreground text-sm">
            Grafana dashboard：<span className="font-medium text-foreground">cloudNative</span>
          </p>
        </div>
        <a
          href={dashboardUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <ExternalLink />
          開啟 Grafana
        </a>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <MonitorDot className="text-muted-foreground size-4" />
            cloudNative dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <iframe
            title="cloudNative Grafana dashboard"
            src={dashboardUrl}
            className="h-[72vh] w-full border-0"
          />
        </CardContent>
      </Card>
    </div>
  );
}
