import { ImageResponse } from "next/og";

export const alt = "VAT Sentinel — pilot demo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #f0f9ff 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "#2563eb",
            color: "white",
            fontSize: 32,
            fontWeight: 700,
            boxShadow: "0 10px 40px rgba(37, 99, 235, 0.28)",
          }}
        >
          VS
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 56,
            fontWeight: 700,
            color: "#0f172a",
            letterSpacing: "-0.02em",
          }}
        >
          VAT Sentinel
        </div>
        <div style={{ marginTop: 16, fontSize: 24, color: "#64748b" }}>
          Pilot demo · VAT reclaim screening
        </div>
      </div>
    ),
    { ...size }
  );
}
