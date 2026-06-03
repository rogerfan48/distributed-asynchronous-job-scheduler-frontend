"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, FileText, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { api, errorMessage } from "@/lib/api-client";
import { useConsole } from "@/components/app/console";
import type { Job, JobCreate, JobUpdate, JobDraft, TaskType, ScheduleType } from "@/lib/types";

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: "shell", label: "Shell（容器內指令）" },
  { value: "http", label: "HTTP（呼叫一次 API）" },
  { value: "http_async", label: "HTTP Async（送出後輪詢）" },
];

const SCHEDULE_TYPES: { value: ScheduleType; label: string }[] = [
  { value: "manual", label: "手動觸發" },
  { value: "cron", label: "Cron 排程" },
  { value: "interval", label: "固定間隔" },
];

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function parseEnv(text: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of parseLines(text)) {
    const idx = line.indexOf("=");
    if (idx > 0) env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return env;
}

const EMPTY = {
  name: "",
  category: "",
  description: "",
  taskType: "shell" as TaskType,
  scheduleType: "manual" as ScheduleType,
  scheduleExpr: "",
  timezone: "Asia/Taipei",
  enabled: true,
  maxRetries: "0",
  retryBackoff: "30",
  timeoutSec: "300",
  // shell
  command: "",
  argsText: "",
  envText: "",
  useFileScript: false,
  // http / http_async
  url: "",
  method: "GET",
  headersText: "",
  bodyText: "",
  expectText: "",
  statusUrl: "",
  statusField: "status",
  successText: "succeeded\ncompleted",
  failureText: "failed\nerror",
  pollInterval: "30",
  resultField: "",
  // file
  fileContent: "",
  sourceFilename: "",
};

type FormState = typeof EMPTY;

export function SubmitJobModal({
  open,
  onOpenChange,
  existingJobs,
  onCreated,
  editJob,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingJobs: Job[];
  onCreated?: (job: Job) => void;
  /** When provided, the modal edits this job (PUT) instead of creating one. */
  editJob?: Job | null;
}) {
  const router = useRouter();
  const isEdit = !!editJob;
  const { push } = useConsole();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [f, setF] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dependsOn, setDependsOn] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(existingJobs.map((j) => j.category?.trim()).filter(Boolean)),
      ) as string[],
    [existingJobs],
  );

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setF((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    setF(EMPTY);
    setDependsOn([]);
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next && !submitting) reset();
    onOpenChange(next);
  }

  async function onUploadFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      // Don't set Content-Type — the browser adds the multipart boundary.
      const res = await fetch("/api/jobs/drafts/from-file", {
        method: "POST",
        body: form,
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? "檔案解析失敗");
      }
      const draft = (await res.json()) as JobDraft;
      applyDraft(draft);
      push("info", `已從檔案匯入草稿：${draft.source_filename ?? file.name}`);
      toast.success("已匯入檔案草稿，可繼續編輯");
    } catch (err) {
      const msg = errorMessage(err, "檔案上傳失敗");
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function applyDraft(draft: JobDraft) {
    const spec = (draft.task_spec ?? {}) as Record<string, unknown>;
    const tt = (draft.task_type as TaskType) ?? "shell";
    setF((prev) => ({
      ...prev,
      name: draft.name ?? prev.name,
      category: draft.category ?? "",
      description: draft.description ?? "",
      taskType: tt,
      scheduleType: (draft.schedule_type as ScheduleType) ?? "manual",
      scheduleExpr: draft.schedule_expr ?? "",
      timezone: draft.timezone ?? prev.timezone,
      enabled: draft.enabled ?? true,
      maxRetries: String(draft.max_retries ?? 0),
      retryBackoff: String(draft.retry_backoff_sec ?? 30),
      timeoutSec: String(draft.timeout_sec ?? 300),
      sourceFilename: draft.source_filename ?? "",
      fileContent: draft.file_content ?? "",
      useFileScript: tt === "shell" && !!draft.file_content,
      command: typeof spec.command === "string" ? spec.command : prev.command,
      argsText: Array.isArray(spec.args) ? (spec.args as string[]).join("\n") : "",
      envText: spec.env && typeof spec.env === "object"
        ? Object.entries(spec.env as Record<string, string>).map(([k, v]) => `${k}=${v}`).join("\n")
        : "",
      url: typeof spec.url === "string" ? spec.url : prev.url,
      method: typeof spec.method === "string" ? spec.method : prev.method,
      headersText: spec.headers ? JSON.stringify(spec.headers, null, 2) : "",
      bodyText: spec.body ? JSON.stringify(spec.body, null, 2) : "",
    }));
    if (draft.depends_on?.length) setDependsOn(draft.depends_on);
  }

  function applyJob(job: Job) {
    const spec = (job.task_spec ?? {}) as Record<string, unknown>;
    const tt = (job.task_type as TaskType) ?? "shell";
    setF({
      ...EMPTY,
      name: job.name,
      category: job.category ?? "",
      description: job.description ?? "",
      taskType: tt,
      scheduleType: (job.schedule_type as ScheduleType) ?? "manual",
      scheduleExpr: job.schedule_expr ?? "",
      timezone: job.timezone || "Asia/Taipei",
      enabled: job.enabled,
      maxRetries: String(job.max_retries ?? 0),
      retryBackoff: String(job.retry_backoff_sec ?? 30),
      timeoutSec: String(job.timeout_sec ?? 300),
      command: typeof spec.command === "string" ? spec.command : "",
      argsText: Array.isArray(spec.args) ? (spec.args as string[]).join("\n") : "",
      envText:
        spec.env && typeof spec.env === "object"
          ? Object.entries(spec.env as Record<string, string>).map(([k, v]) => `${k}=${v}`).join("\n")
          : "",
      url: typeof spec.url === "string" ? spec.url : "",
      method: typeof spec.method === "string" ? spec.method : "GET",
      headersText: spec.headers ? JSON.stringify(spec.headers, null, 2) : "",
      bodyText: spec.body ? JSON.stringify(spec.body, null, 2) : "",
      expectText: Array.isArray(spec.expect) ? (spec.expect as number[]).join(", ") : "",
      statusUrl: typeof spec.status_url === "string" ? spec.status_url : "",
      statusField: typeof spec.status_field === "string" ? spec.status_field : "status",
      successText: Array.isArray(spec.success_values)
        ? (spec.success_values as string[]).join("\n")
        : EMPTY.successText,
      failureText: Array.isArray(spec.failure_values)
        ? (spec.failure_values as string[]).join("\n")
        : EMPTY.failureText,
      pollInterval: spec.poll_interval_sec != null ? String(spec.poll_interval_sec) : "30",
      resultField: typeof spec.result_field === "string" ? spec.result_field : "",
    });
    setDependsOn(job.depends_on ?? []);
    setError(null);
  }

  // Prefill on open: edit → load the job; create → fresh form.
  useEffect(() => {
    if (!open) return;
    if (editJob) applyJob(editJob);
    else reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editJob]);

  function buildTaskSpec(): Record<string, unknown> {
    if (f.taskType === "shell") {
      if (f.useFileScript && f.fileContent) {
        const spec: Record<string, unknown> = {
          command: "sh",
          args: ["-c", f.fileContent],
        };
        const env = parseEnv(f.envText);
        if (Object.keys(env).length) spec.env = env;
        return spec;
      }
      if (!f.command.trim()) throw new Error("Shell 任務需要 command");
      const spec: Record<string, unknown> = { command: f.command.trim() };
      const args = parseLines(f.argsText);
      if (args.length) spec.args = args;
      const env = parseEnv(f.envText);
      if (Object.keys(env).length) spec.env = env;
      return spec;
    }

    // http / http_async
    if (!f.url.trim()) throw new Error("HTTP 任務需要 url");
    const spec: Record<string, unknown> = { url: f.url.trim(), method: f.method };
    if (f.headersText.trim()) {
      try {
        spec.headers = JSON.parse(f.headersText);
      } catch {
        throw new Error("headers 不是有效的 JSON");
      }
    }
    if (f.bodyText.trim()) {
      try {
        spec.body = JSON.parse(f.bodyText);
      } catch {
        throw new Error("body 不是有效的 JSON");
      }
    }
    if (f.taskType === "http" && f.expectText.trim()) {
      const codes = f.expectText
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n));
      if (codes.length) spec.expect = codes;
    }
    if (f.taskType === "http_async") {
      if (!f.statusUrl.trim()) throw new Error("HTTP Async 任務需要 status_url");
      spec.status_url = f.statusUrl.trim();
      spec.status_field = f.statusField.trim() || "status";
      spec.success_values = parseLines(f.successText);
      spec.failure_values = parseLines(f.failureText);
      spec.poll_interval_sec = Number(f.pollInterval) || 30;
      if (f.resultField.trim()) spec.result_field = f.resultField.trim();
    }
    return spec;
  }

  function buildPayload(): JobCreate {
    if (!f.name.trim()) throw new Error("請輸入任務名稱");
    if (f.scheduleType === "cron" && parseLines(f.scheduleExpr).join(" ").split(/\s+/).length !== 5) {
      throw new Error("Cron 表達式需為 5 個欄位，例如 0 2 * * *");
    }
    if (f.scheduleType === "interval" && !(Number(f.scheduleExpr) > 0)) {
      throw new Error("間隔需為正整數秒數");
    }
    const payload: JobCreate = {
      name: f.name.trim(),
      category: f.category.trim() || null,
      description: f.description.trim() || null,
      task_type: f.taskType,
      task_spec: buildTaskSpec(),
      schedule_type: f.scheduleType,
      schedule_expr: f.scheduleType === "manual" ? null : f.scheduleExpr.trim(),
      timezone: f.timezone.trim() || "UTC",
      enabled: f.enabled,
      max_retries: Number(f.maxRetries) || 0,
      retry_backoff_sec: Number(f.retryBackoff) || 0,
      timeout_sec: Number(f.timeoutSec) || 300,
      depends_on: dependsOn,
    };
    return payload;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    let payload: JobCreate;
    try {
      payload = buildPayload();
    } catch (err) {
      const msg = errorMessage(err, "表單驗證失敗");
      setError(msg);
      return;
    }
    setSubmitting(true);
    try {
      let job: Job;
      if (editJob) {
        // `name` is immutable on the backend (JobUpdate has no name field).
        const update: JobUpdate = {
          category: payload.category,
          description: payload.description,
          task_type: payload.task_type,
          task_spec: payload.task_spec,
          schedule_type: payload.schedule_type,
          schedule_expr: payload.schedule_expr,
          timezone: payload.timezone,
          enabled: payload.enabled,
          max_retries: payload.max_retries,
          retry_backoff_sec: payload.retry_backoff_sec,
          timeout_sec: payload.timeout_sec,
          depends_on: payload.depends_on,
        };
        job = await api.put<Job>(`/api/jobs/${editJob.id}`, update);
        push("success", `已更新任務 #${job.id}「${job.name}」`);
        toast.success(`任務「${job.name}」已更新`);
      } else {
        job = await api.post<Job>("/api/jobs", payload);
        push("success", `已建立任務 #${job.id}「${job.name}」`);
        toast.success(`任務「${job.name}」已建立`);
      }
      reset();
      onOpenChange(false);
      onCreated?.(job);
      router.refresh();
    } catch (err) {
      const msg = errorMessage(err, isEdit ? "更新任務失敗" : "建立任務失敗");
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedDeps = existingJobs.filter((j) => dependsOn.includes(j.id));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{isEdit ? "編輯任務" : "新任務"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "修改任務設定後儲存。名稱建立後無法變更。"
              : "手動填寫，或上傳文字檔自動帶入草稿後再編輯。"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex max-h-[calc(90vh-8rem)] flex-col">
          <div className="scrollbar-thin space-y-5 overflow-y-auto px-6 py-5">
            {/* Upload */}
            <div className="bg-muted/40 flex items-center justify-between gap-3 rounded-lg border border-dashed p-3">
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <FileText className="text-muted-foreground size-4 shrink-0" />
                <span className="text-muted-foreground truncate">
                  {f.sourceFilename ? `已匯入：${f.sourceFilename}` : "從文字檔匯入（UTF-8，≤128KiB）"}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
                上傳檔案
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".sh,.txt,.json,.py,.yaml,.yml,text/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onUploadFile(file);
                }}
              />
            </div>

            {/* Basics */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="任務名稱" required htmlFor="name" hint={isEdit ? "建立後不可變更" : undefined}>
                <Input
                  id="name"
                  value={f.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="daily-report"
                  required
                  disabled={isEdit}
                />
              </Field>
              <Field label="分類" htmlFor="category" hint="空白歸入「未分類」">
                <Input
                  id="category"
                  list="category-suggestions"
                  value={f.category}
                  onChange={(e) => set("category", e.target.value)}
                  placeholder="例如：系統維運"
                />
                <datalist id="category-suggestions">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
            </div>

            <Field label="說明" htmlFor="description">
              <Textarea id="description" value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="這個任務的用途…" rows={2} />
            </Field>

            <Separator />

            {/* Task type + spec */}
            <Field label="任務型態" required>
              <Select value={f.taskType} onValueChange={(v) => set("taskType", v as TaskType)}>
                <SelectTrigger className="w-full">
                  <span>{TASK_TYPES.find((t) => t.value === f.taskType)?.label}</span>
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {f.taskType === "shell" && (
              <div className="space-y-4">
                {f.fileContent && (
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={f.useFileScript} onCheckedChange={(c) => set("useFileScript", c === true)} />
                    以檔案內容作為 shell 腳本執行（sh -c）
                  </label>
                )}
                {f.useFileScript ? (
                  <Field label="腳本內容（可編輯）" htmlFor="fileContent">
                    <Textarea id="fileContent" value={f.fileContent} onChange={(e) => set("fileContent", e.target.value)} rows={8} className="font-mono text-xs" />
                  </Field>
                ) : (
                  <>
                    <Field label="Command" required htmlFor="command">
                      <Input id="command" value={f.command} onChange={(e) => set("command", e.target.value)} placeholder="python /scripts/backup.py" className="font-mono text-sm" />
                    </Field>
                    <Field label="Args（每行一個）" htmlFor="args">
                      <Textarea id="args" value={f.argsText} onChange={(e) => set("argsText", e.target.value)} rows={3} placeholder={"--full\n--verbose"} className="font-mono text-xs" />
                    </Field>
                  </>
                )}
                <Field label="環境變數（每行 KEY=VALUE）" htmlFor="env">
                  <Textarea id="env" value={f.envText} onChange={(e) => set("envText", e.target.value)} rows={2} placeholder="DB_HOST=postgres" className="font-mono text-xs" />
                </Field>
              </div>
            )}

            {(f.taskType === "http" || f.taskType === "http_async") && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
                  <Field label="URL" required htmlFor="url">
                    <Input id="url" value={f.url} onChange={(e) => set("url", e.target.value)} placeholder="https://api.example.com/report" className="font-mono text-sm" />
                  </Field>
                  <Field label="Method">
                    <Select value={f.method} onValueChange={(v) => set("method", v ?? "GET")}>
                      <SelectTrigger className="w-full"><span>{f.method}</span></SelectTrigger>
                      <SelectContent>
                        {HTTP_METHODS.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label="Headers（JSON）" htmlFor="headers">
                  <Textarea id="headers" value={f.headersText} onChange={(e) => set("headersText", e.target.value)} rows={2} placeholder={'{ "Authorization": "Bearer ..." }'} className="font-mono text-xs" />
                </Field>
                <Field label="Body（JSON）" htmlFor="body">
                  <Textarea id="body" value={f.bodyText} onChange={(e) => set("bodyText", e.target.value)} rows={3} placeholder={'{ "date": "2026-05-31" }'} className="font-mono text-xs" />
                </Field>
                {f.taskType === "http" && (
                  <Field label="預期狀態碼（逗號分隔，留空為 2xx）" htmlFor="expect">
                    <Input id="expect" value={f.expectText} onChange={(e) => set("expectText", e.target.value)} placeholder="200, 201" className="font-mono text-sm" />
                  </Field>
                )}
                {f.taskType === "http_async" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Status URL" required htmlFor="statusUrl">
                      <Input id="statusUrl" value={f.statusUrl} onChange={(e) => set("statusUrl", e.target.value)} className="font-mono text-sm" />
                    </Field>
                    <Field label="Status 欄位" htmlFor="statusField">
                      <Input id="statusField" value={f.statusField} onChange={(e) => set("statusField", e.target.value)} className="font-mono text-sm" />
                    </Field>
                    <Field label="成功值（每行一個）" htmlFor="success">
                      <Textarea id="success" value={f.successText} onChange={(e) => set("successText", e.target.value)} rows={2} className="font-mono text-xs" />
                    </Field>
                    <Field label="失敗值（每行一個）" htmlFor="failure">
                      <Textarea id="failure" value={f.failureText} onChange={(e) => set("failureText", e.target.value)} rows={2} className="font-mono text-xs" />
                    </Field>
                    <Field label="輪詢間隔（秒）" htmlFor="poll">
                      <Input id="poll" type="number" min={1} value={f.pollInterval} onChange={(e) => set("pollInterval", e.target.value)} />
                    </Field>
                    <Field label="Result 欄位" htmlFor="resultField">
                      <Input id="resultField" value={f.resultField} onChange={(e) => set("resultField", e.target.value)} className="font-mono text-sm" />
                    </Field>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Schedule */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="排程方式">
                <Select value={f.scheduleType} onValueChange={(v) => set("scheduleType", v as ScheduleType)}>
                  <SelectTrigger className="w-full">
                    <span>{SCHEDULE_TYPES.find((s) => s.value === f.scheduleType)?.label}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_TYPES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {f.scheduleType === "cron" && (
                <Field label="Cron 表達式" required htmlFor="cron" hint="分 時 日 月 週">
                  <Input id="cron" value={f.scheduleExpr} onChange={(e) => set("scheduleExpr", e.target.value)} placeholder="0 2 * * *" className="font-mono text-sm" />
                </Field>
              )}
              {f.scheduleType === "interval" && (
                <Field label="間隔（秒）" required htmlFor="interval">
                  <Input id="interval" type="number" min={1} value={f.scheduleExpr} onChange={(e) => set("scheduleExpr", e.target.value)} placeholder="300" />
                </Field>
              )}
            </div>

            {f.scheduleType !== "manual" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="時區" htmlFor="tz">
                  <Input id="tz" value={f.timezone} onChange={(e) => set("timezone", e.target.value)} placeholder="Asia/Taipei" />
                </Field>
                <label className="flex items-end gap-2 pb-2 text-sm">
                  <Switch checked={f.enabled} onCheckedChange={(c) => set("enabled", c)} />
                  啟用自動排程
                </label>
              </div>
            )}

            <Separator />

            {/* Advanced */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="最大重試" htmlFor="retries">
                <Input id="retries" type="number" min={0} max={100} value={f.maxRetries} onChange={(e) => set("maxRetries", e.target.value)} />
              </Field>
              <Field label="重試間隔（秒）" htmlFor="backoff">
                <Input id="backoff" type="number" min={0} value={f.retryBackoff} onChange={(e) => set("retryBackoff", e.target.value)} />
              </Field>
              <Field label="逾時（秒）" htmlFor="timeout">
                <Input id="timeout" type="number" min={1} value={f.timeoutSec} onChange={(e) => set("timeoutSec", e.target.value)} />
              </Field>
            </div>

            {/* Dependencies */}
            <Field label="相依任務（上游成功後才執行）">
              <Popover>
                <PopoverTrigger
                  render={
                    <Button type="button" variant="outline" className="w-full justify-between font-normal">
                      <span className={cn(selectedDeps.length === 0 && "text-muted-foreground")}>
                        {selectedDeps.length === 0 ? "無相依" : `已選 ${selectedDeps.length} 個`}
                      </span>
                      <ChevronDown className="size-4 opacity-60" />
                    </Button>
                  }
                />
                <PopoverContent className="w-(--anchor-width) p-0" align="start">
                  <DepsPicker jobs={existingJobs} selected={dependsOn} onToggle={(id) =>
                    setDependsOn((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
                  } />
                </PopoverContent>
              </Popover>
              {selectedDeps.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedDeps.map((j) => (
                    <span key={j.id} className="bg-secondary text-secondary-foreground rounded-md px-2 py-0.5 text-xs">
                      {j.name}
                    </span>
                  ))}
                </div>
              )}
            </Field>

            {error && (
              <p role="alert" className="text-destructive bg-destructive/10 rounded-md px-3 py-2 text-sm">
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="border-t px-6 py-4">
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={submitting}>
              取消
            </Button>
            <Button type="submit" disabled={submitting || uploading}>
              {submitting && <Loader2 className="animate-spin" />}
              {isEdit ? "儲存變更" : "建立任務"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor}>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function DepsPicker({
  jobs,
  selected,
  onToggle,
}: {
  jobs: Job[];
  selected: number[];
  onToggle: (id: number) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = jobs.filter((j) => j.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <div>
      <div className="border-b p-2">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜尋任務…" className="h-8" />
      </div>
      <div className="scrollbar-thin max-h-56 overflow-y-auto p-1">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground px-2 py-4 text-center text-sm">沒有可選的任務</p>
        ) : (
          filtered.map((j) => {
            const on = selected.includes(j.id);
            return (
              <button
                key={j.id}
                type="button"
                onClick={() => onToggle(j.id)}
                className="hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
              >
                <span className={cn("grid size-4 place-items-center rounded border", on ? "bg-primary border-primary text-primary-foreground" : "border-input")}>
                  {on && <Check className="size-3" />}
                </span>
                <span className="truncate">{j.name}</span>
                {j.category && <span className="text-muted-foreground ml-auto text-xs">{j.category}</span>}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
