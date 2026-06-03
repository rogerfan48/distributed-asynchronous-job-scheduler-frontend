import type { Metadata } from "next";
import { Fira_Sans, Fira_Code } from "next/font/google";
import "./globals.css";

const firaSans = Fira_Sans({
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const firaCode = Fira_Code({
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

// Public site URL — only used to build absolute OG/canonical links (not a secret).
// Override via the SITE_URL env if the domain differs.
const SITE_URL = process.env.SITE_URL ?? "https://jobs.roger.tw";
const SITE_NAME = "Job Scheduler";
const SITE_DESCRIPTION =
  "分散式任務排程控制台：提交、排程與監控任務，檢視執行狀態與即時日誌，支援手動觸發、重跑與取消。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} · 分散式任務排程控制台`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "任務排程",
    "工作排程",
    "job scheduler",
    "cron",
    "任務監控",
    "排程系統",
    "task scheduler",
    "工作流程",
  ],
  // Login-gated app: search engines only ever see /login. Flip to `index: false`
  // if you'd rather keep it out of search results entirely.
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} · 分散式任務排程控制台`,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "zh_TW",
    // OG image is auto-wired from src/app/opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} · 分散式任務排程控制台`,
    description: SITE_DESCRIPTION,
    // image auto-wired from src/app/twitter-image.tsx
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      className={`dark ${firaSans.variable} ${firaCode.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground min-h-full font-sans">
        {children}
      </body>
    </html>
  );
}
