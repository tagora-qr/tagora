/**
 * Sitemap — /sitemap.xml
 *
 * Next.js 15 native sitemap generator. Static + dynamic route'ları listeler.
 * Google/Bing crawler'ları için Tagora'nın canlı sayfa haritası.
 */
import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://tagora.com.tr";

// Kullanım alanları — SEO landing sayfaları
const USE_CASE_SLUGS = ["arac", "kapi", "pet", "bagaj", "bisiklet"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/shop`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/kullanim`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // Yasal — düşük öncelik ama indexlensin
    {
      url: `${BASE_URL}/kvkk`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/cookies`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    // Auth: index etmek istemediğimiz ama accessible
    {
      url: `${BASE_URL}/login`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];

  // Use-case landing pages
  const useCasePages: MetadataRoute.Sitemap = USE_CASE_SLUGS.map((slug) => ({
    url: `${BASE_URL}/kullanim/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticPages, ...useCasePages];
}
