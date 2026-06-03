"use client";

import { useEffect } from "react";
import { ServerCrash, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <span className="bg-destructive/10 text-destructive mb-4 grid size-14 place-items-center rounded-2xl">
          <ServerCrash className="size-7" />
        </span>
        <h1 className="text-lg font-semibold tracking-tight">服務暫時無法使用</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          無法連線到後端排程服務，或發生未預期的錯誤。請確認後端服務狀態後重試。
        </p>
        <Button onClick={reset} className="mt-6">
          <RotateCw className="size-4" />
          重新嘗試
        </Button>
      </div>
    </div>
  );
}
