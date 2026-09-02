import { ImageResponse } from "next/og";

export const alt = "TechSastra — Tech news, reviews and prices in Nepal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 78px",
        color: "#f7f8f1",
        background: "#11120e",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          color: "#dfff31",
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: "0.13em",
          textTransform: "uppercase",
        }}
      >
        <span>TechSastra</span>
        <span style={{ color: "#81847a" }}>Nepal</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div
          style={{
            maxWidth: 960,
            fontSize: 72,
            fontWeight: 900,
            lineHeight: 1.04,
            letterSpacing: "-0.045em",
          }}
        >
          Tech news, reviews & prices in Nepal
        </div>
        <div style={{ color: "#bec1b7", fontSize: 28 }}>
          Clear local context for Nepali readers and buyers.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "#a4a89d",
          fontSize: 22,
        }}
      >
        <span>www.techsastra.com</span>
        <span style={{ color: "#dfff31" }}>TECH · GADGETS · AUTO</span>
      </div>
    </div>,
    size,
  );
}
