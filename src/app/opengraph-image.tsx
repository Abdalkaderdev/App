import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const title = "Therapist Lite";
  const description = "Lightweight therapist notes, scheduling, and client management.";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #1e40af 100%)",
          color: "white",
          padding: 64,
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, \"Apple Color Emoji\", \"Segoe UI Emoji\"",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 16,
            padding: "10px 16px",
            borderRadius: 9999,
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            fontSize: 28,
            lineHeight: 1,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 9999,
              backgroundColor: "#22c55e",
            }}
          />
          <span>Therapist tools that don’t get in your way</span>
        </div>

        <h1
          style={{
            marginTop: 24,
            fontSize: 88,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          {title}
        </h1>

        <p
          style={{
            marginTop: 16,
            fontSize: 36,
            fontWeight: 500,
            maxWidth: 900,
            opacity: 0.95,
          }}
        >
          {description}
        </p>

        <div style={{ marginTop: "auto", fontSize: 28, opacity: 0.9 }}>
          therapistlite.app
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}