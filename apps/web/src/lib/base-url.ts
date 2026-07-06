/**
 * Canonical base URL helper.
 *
 * NEXT_PUBLIC_APP_URL Vercel'de yanlış set edilmiş olabilir (Vercel'in default
 * `*.vercel.app` URL'ini kullanır). Sitemap, robots, JSON-LD gibi SEO-critical
 * yerlerde canonical domain (tagora.com.tr) her koşulda garantili olmalı.
 *
 * Kural: env `vercel.app` içeriyorsa yoksay, tagora.com.tr'yi zorla.
 */
const CANONICAL_URL = "https://tagora.com.tr";

export function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!envUrl) return CANONICAL_URL;
  // Vercel default domain'ini reddet — SEO canonical yanlış olmasın
  if (envUrl.includes("vercel.app")) return CANONICAL_URL;
  // Trailing slash temizle
  return envUrl.replace(/\/$/, "");
}
