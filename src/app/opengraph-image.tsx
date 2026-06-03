import { ImageResponse } from "next/og";

export const alt = "Job Scheduler — 分散式任務排程控制台";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social share card (Open Graph / Twitter). Brand mark + title on the OLED canvas.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#0b0f1a",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        {/* subtle top glow */}
        <div
          style={{
            position: "absolute",
            top: -160,
            left: -120,
            width: 520,
            height: 520,
            borderRadius: "9999px",
            background: "radial-gradient(closest-side, rgba(124,107,255,0.45), transparent)",
            display: "flex",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #7166ff, #a855f7)",
            }}
          >
            <svg
              width="52"
              height="52"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="4.5" r="2.5" />
              <path d="m10.2 6.3-3.9 3.9" />
              <circle cx="4.5" cy="12" r="2.5" />
              <path d="M7 12h10" />
              <circle cx="19.5" cy="12" r="2.5" />
              <path d="m13.8 17.7 3.9-3.9" />
              <circle cx="12" cy="19.5" r="2.5" />
            </svg>
          </div>
          <span style={{ fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>
            Job Scheduler
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 68, fontWeight: 700, letterSpacing: -2, lineHeight: 1.1 }}>
            分散式任務排程控制台
          </span>
          <span style={{ fontSize: 30, color: "#94a3b8", maxWidth: 900 }}>
            提交、排程與監控任務 · 執行狀態與即時日誌 · 手動觸發 / 重跑 / 取消
          </span>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {["pending", "running", "succeeded", "failed"].map((s, i) => (
            <div
              key={s}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 22,
                color: "#cbd5e1",
                padding: "8px 16px",
                borderRadius: 9999,
                border: "1px solid #1f2937",
                background: "#111827",
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 9999,
                  display: "flex",
                  background: ["#94a3b8", "#3b82f6", "#22c55e", "#ef4444"][i],
                }}
              />
              {s}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
