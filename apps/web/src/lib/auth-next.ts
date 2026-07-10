/**
 * Login redirect "next" parameter encoding helpers.
 *
 * Problem: Magic-link akışında `next` param'ında query string olduğunda
 * (örn. `/shop/checkout?package=split-5`) `?` işareti URL parsing zincirinde
 * (Supabase Auth → verify → callback) bir yerde kırılıyor ve `package=split-5`
 * kısmı düşüyor. Kullanıcı `/shop/checkout` (slug yok) sayfasına gidiyor,
 * oradan `/shop`'a redirect ediliyor → paket seçiyor → tekrar login gerekiyor
 * → sonsuz döngü.
 *
 * Çözüm: `next` değerini base64url (URL-safe) ile encode edip param olarak
 * geçir. Böylece `?` ve `=` karakterleri URL'de yok, hiçbir parsing zincirinde
 * bozulmuyor.
 *
 * Base64url: standart base64 ama `+` → `-`, `/` → `_`, padding `=` düşer.
 * URL-safe, decode ederken atob() öncesi ters çevirilir.
 */

const CANONICAL_PATH_FALLBACK = "/dashboard";

/** Bir path'i base64url ile encode et. Sadece "/" ile başlayan path kabul edilir. */
export function encodeNext(path: string): string {
  const safe = path.startsWith("/") && !path.startsWith("//") ? path : CANONICAL_PATH_FALLBACK;
  // Buffer works on Node (server), atob/btoa on browser. TextEncoder is universal.
  if (typeof window === "undefined") {
    return Buffer.from(safe, "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  // Browser
  const utf8 = new TextEncoder().encode(safe);
  let bin = "";
  utf8.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Base64url string'i tekrar path'e çevir. Geçersizse fallback döner. */
export function decodeNext(encoded: string | null | undefined): string {
  if (!encoded) return CANONICAL_PATH_FALLBACK;
  try {
    // Base64url → base64
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    // Padding ekle
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    let path: string;
    if (typeof window === "undefined") {
      path = Buffer.from(b64 + pad, "base64").toString("utf8");
    } else {
      const bin = atob(b64 + pad);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      path = new TextDecoder().decode(bytes);
    }
    // Open redirect koruması: sadece kendi domain'imize path
    if (!path.startsWith("/") || path.startsWith("//")) return CANONICAL_PATH_FALLBACK;
    return path;
  } catch {
    return CANONICAL_PATH_FALLBACK;
  }
}
