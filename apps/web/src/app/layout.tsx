import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/analytics/posthog-provider";
import { CookieConsentBanner } from "@/components/analytics/cookie-consent";
import { getBaseUrl } from "@/lib/base-url";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const BASE_URL = getBaseUrl();

export const metadata: Metadata = {
  title: {
    default: "Tagora — Anonim İletişim için Akıllı QR Sticker",
    template: "%s · Tagora",
  },
  description:
    "Bir QR, sonsuz bağlantı. Telefonunu paylaşmadan ulaşılabilir kal. Araba, kapı, evcil hayvan için gizlilik-önce sticker. KVKK uyumlu, AB veri yerleşimi.",
  applicationName: "Tagora",
  authors: [{ name: "Tagora" }],
  metadataBase: new URL(BASE_URL),
  keywords: [
    "QR sticker",
    "araba QR",
    "araç iletişim QR kod",
    "evcil hayvan QR tag",
    "pet QR kolye",
    "anonim iletişim",
    "telefon paylaşmadan iletişim",
    "KVKK QR",
    "gizli iletişim etiket",
    "araç kaza iletişim",
    "kaybettim QR",
    "bagaj QR etiket",
    "bisiklet QR sticker",
  ],
  category: "technology",
  alternates: {
    canonical: "/",
    languages: {
      "tr-TR": "/",
      "x-default": "/",
    },
  },
  openGraph: {
    title: "Tagora — Anonim İletişim için Akıllı QR Sticker",
    description:
      "Bir QR, sonsuz bağlantı. Telefonunu paylaşmadan ulaşılabilir kal. KVKK uyumlu.",
    url: BASE_URL,
    siteName: "Tagora",
    type: "website",
    locale: "tr_TR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tagora — Anonim İletişim için Akıllı QR Sticker",
    description:
      "Bir QR, sonsuz bağlantı. Telefonunu paylaşmadan ulaşılabilir kal.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    // Google Search Console verification token'ı buraya gelecek (property eklendikten sonra)
    // google: "XXX",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F1B3D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// ============================================================
// JSON-LD structured data — Organization + WebSite
// Google için Tagora markasını, arama kutusu ve linked sameAs
// ============================================================
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Tagora",
  legalName: "Tagora Teknoloji",
  url: BASE_URL,
  logo: `${BASE_URL}/opengraph-image`,
  description:
    "Anonim iletişim için akıllı QR sticker platformu. Telefonunu paylaşmadan ulaşılabilir kal. KVKK uyumlu, AB veri yerleşimi.",
  foundingDate: "2026",
  areaServed: {
    "@type": "Country",
    name: "Türkiye",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "destek@tagora.com.tr",
      availableLanguage: ["Turkish", "English"],
    },
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Tagora",
  url: BASE_URL,
  inLanguage: "tr-TR",
  publisher: { "@type": "Organization", name: "Tagora" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-white antialiased">
        <PostHogProvider>
          {children}
          <CookieConsentBanner />
        </PostHogProvider>
      </body>
    </html>
  );
}
