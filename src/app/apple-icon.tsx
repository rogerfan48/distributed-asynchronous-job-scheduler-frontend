import { ImageResponse } from "next/og";

// Apple touch icon (home-screen) from the brand mark.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 40,
          background: "linear-gradient(135deg, #7166ff, #a855f7)",
        }}
      >
        <svg
          width="112"
          height="112"
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
    ),
    { ...size },
  );
}
