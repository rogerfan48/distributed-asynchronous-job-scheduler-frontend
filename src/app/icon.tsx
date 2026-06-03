import { ImageResponse } from "next/og";

// Favicon generated from the brand mark (gradient square + Waypoints glyph).
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 7,
          background: "linear-gradient(135deg, #7166ff, #a855f7)",
        }}
      >
        <svg
          width="21"
          height="21"
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
