/**
 * Robots.txt — /robots.txt
 *
 * Next.js 15 native robots.txt generator.
 * Public sayfaları allow, private/admin sayfaları disallow, sitemap referansı.
 */
import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/base-url";

const BASE_URL = getBaseUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/dashboard/",
          "/api/",
          "/auth/",
          "/shop/checkout",
          "/shop/success",
          "/shop/failed",
          "/s/", // scanner private chat
          "/monitoring/", // Sentry tunnel
        ],
      },
      // AI crawler'ları için — content indeksi kısıtlanmaz ama training data yasak istersen
      // Şimdilik izin veriyoruz (marketing için helpful)
      // { userAgent: "GPTBot", disallow: "/" },
      // { userAgent: "ChatGPT-User", disallow: "/" },
      // { userAgent: "CCBot", disallow: "/" },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
