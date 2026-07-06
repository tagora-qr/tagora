/**
 * Open Graph image — 1200x630 dinamik generate.
 * Sosyal medyada Tagora linki paylaşılınca gösterilir.
 *
 * Next.js 15 native ImageResponse — Vercel Edge Runtime'da render.
 */
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Tagora — Anonim İletişim için Akıllı QR Sticker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0F1B3D 0%, #1a2f5c 50%, #0F1B3D 100%)",
          color: "white",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(245, 184, 60, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(245, 184, 60, 0.05) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "#F5B83C",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "40px",
              fontWeight: 900,
              color: "#0F1B3D",
            }}
          >
            T
          </div>
          <span
            style={{
              fontSize: "48px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Tagora
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: "72px",
            fontWeight: 800,
            textAlign: "center",
            lineHeight: 1.15,
            margin: "0 0 24px",
            zIndex: 1,
            letterSpacing: "-0.03em",
          }}
        >
          Telefonunu paylaşma.
        </h1>
        <p
          style={{
            fontSize: "40px",
            fontWeight: 700,
            color: "#F5B83C",
            margin: "0 0 40px",
            zIndex: 1,
          }}
        >
          Tagora yapıştır.
        </p>

        {/* Tagline */}
        <p
          style={{
            fontSize: "26px",
            textAlign: "center",
            color: "rgba(255, 255, 255, 0.8)",
            maxWidth: "900px",
            margin: 0,
            zIndex: 1,
            lineHeight: 1.4,
          }}
        >
          Anonim iletişim için akıllı QR sticker — araba, kapı, evcil hayvan
        </p>

        {/* Bottom badge */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            gap: "12px",
            zIndex: 1,
          }}
        >
          <div
            style={{
              padding: "10px 20px",
              background: "rgba(245, 184, 60, 0.15)",
              border: "1px solid rgba(245, 184, 60, 0.3)",
              borderRadius: "999px",
              fontSize: "20px",
              fontWeight: 600,
              color: "#F5B83C",
            }}
          >
            KVKK Uyumlu
          </div>
          <div
            style={{
              padding: "10px 20px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "999px",
              fontSize: "20px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.9)",
            }}
          >
            AB Veri Yerleşimi
          </div>
          <div
            style={{
              padding: "10px 20px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "999px",
              fontSize: "20px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.9)",
            }}
          >
            tagora.com.tr
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
