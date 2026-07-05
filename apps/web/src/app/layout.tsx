import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Tagora — Anonim İletişim",
    template: "%s · Tagora",
  },
  description:
    "Bir QR, sonsuz bağlantı. Telefonunu paylaşmadan ulaşılabilir kal. KVKK uyumlu, AB veri yerleşimi.",
  applicationName: "Tagora",
  authors: [{ name: "Tagora" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://tagora.app"),
  openGraph: {
    title: "Tagora — Anonim İletişim",
    description: "Bir QR, sonsuz bağlantı. Telefonunu paylaşmadan ulaşılabilir kal.",
    type: "website",
    locale: "tr_TR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tagora",
    description: "Bir QR, sonsuz bağlantı.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0F1B3D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={inter.variable}>
      <body className="min-h-screen bg-white antialiased">{children}</body>
    </html>
  );
}
