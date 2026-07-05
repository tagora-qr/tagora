/**
 * MVP-seviye spam / abuse filtresi.
 *
 * Bu sadece v0 keyword + pattern filtresi. v1'de:
 * - ML-bazlı toxicity classifier (Perspective API alternatif veya self-host)
 * - Phishing link detection
 * - URL/IP blacklist
 * eklenecek.
 */

// =======================================================================
// SPAM PATTERNS — hızlı eleme
// =======================================================================
// NOT: Türkçe regex'lerde `\b` (word boundary) ASCII odaklı; Türkçe karakterlerle
// güvenilir çalışmaz. O yüzden kelime gövdesi (suffix dahil) yakalanacak şekilde
// yazıyoruz — TR aglütinatif dil olduğu için "şifre/şifrenizi/şifrelemek" hepsi yakalanır.

const PHISHING_PATTERNS = [
  /https?:\/\/(?!tagora\.app)/iu, // tagora.app dışı URL'leri raporla
  /(?:^|[^A-Za-zÇĞİÖŞÜçğıöşü])(?:şifre|password|otp|cvc|cvv|iban|tc kimlik|t\.c\.|kimlik no)/iu,
  /https?:\/\/[^\s]*\b(bank|iyzico|stripe|paypal|garanti|akbank|isbank)\b/iu,
];

const SPAM_KEYWORDS = [
  /(?:bedava|free)\s+(?:iphone|para|money|kazanç)/iu,
  /whatsapp\s*[:: ]?\s*\+?\d{8,}/iu,
  /telegram\s*[:: ]?\s*@?\w+/iu,
];

// TR + EN basic profanity (genişletilmesi gereken liste; MVP için sembolik)
const PROFANITY_KEYWORDS_TR = [
  "amk", "aq", "siktir", "orospu", "piç", "yarrak",
];
const PROFANITY_KEYWORDS_EN = [
  "fuck", "shit", "bitch", "asshole",
];

// Threat: "öldür", "gebert", "gebertir", "kafanı kırarım" gibi gövdeler
// (Türkçe suffix'leri kapsasın diye trailing \b yok)
const THREAT_KEYWORDS = [
  /(?:öldür|gebert|kafanı kır|seni bulurum|i['']?ll find you|kill you)/iu,
];

// =======================================================================
// PUBLIC API
// =======================================================================

export type ModerationVerdict = {
  allowed: boolean;
  flagged: boolean;
  reason?: "phishing" | "spam" | "profanity" | "threat" | null;
  score: number; // 0-1, ne kadar yüksek o kadar şüpheli
};

/**
 * Bir mesajın gönderilmesine izin verilip verilmeyeceğini değerlendirir.
 *
 * Kurallar:
 * - Threat/phishing → bloke (allowed=false)
 * - Spam/profanity → flag ama gönder (allowed=true, flagged=true) — sahip moderasyona düşer
 *
 * Bu fonksiyon hem client-side (UX preview) hem server-side (gerçek koruma)
 * çalıştırılır. Client'a güvenme; server tarafında da tekrar et.
 */
export function moderateMessage(body: string): ModerationVerdict {
  const text = (body || "").toString();

  // Threat → hard block
  for (const re of THREAT_KEYWORDS) {
    if (re.test(text)) {
      return { allowed: false, flagged: true, reason: "threat", score: 0.95 };
    }
  }

  // Phishing → hard block
  for (const re of PHISHING_PATTERNS) {
    if (re.test(text)) {
      return { allowed: false, flagged: true, reason: "phishing", score: 0.9 };
    }
  }

  // Profanity → flag ama göndere izin ver (sahip filtreleyecek)
  const lower = text.toLowerCase();
  const hasProfanity =
    PROFANITY_KEYWORDS_TR.some((w) => lower.includes(w)) ||
    PROFANITY_KEYWORDS_EN.some((w) => lower.includes(w));
  if (hasProfanity) {
    return { allowed: true, flagged: true, reason: "profanity", score: 0.5 };
  }

  // Spam pattern → flag
  for (const re of SPAM_KEYWORDS) {
    if (re.test(text)) {
      return { allowed: true, flagged: true, reason: "spam", score: 0.4 };
    }
  }

  return { allowed: true, flagged: false, reason: null, score: 0 };
}

// =======================================================================
// RATE LIMIT
// =======================================================================

export const RATE_LIMITS = {
  /** Tek scanner session için günlük max mesaj */
  SCANNER_MESSAGES_PER_DAY: 10,
  /** Tek scanner session için dakikada max mesaj */
  SCANNER_MESSAGES_PER_MINUTE: 3,
  /** Owner için yeni conversation'a cevap verme dakikada limit (anti-spam) */
  OWNER_MESSAGES_PER_MINUTE: 20,
} as const;

/**
 * Cihaz fingerprint hash'i — IP + user-agent + ekran çözünürlüğü vs.
 * KVKK için: 24 saat sonra tablodan silinir.
 *
 * Bu sadece HINT (kesin değil) — VPN/incognito bypass eder.
 * Web Crypto API kullanır (browser, Node 19+, RN polyfill'li).
 */
export async function hashFingerprint(input: string): Promise<string> {
  if (typeof globalThis.crypto?.subtle === "undefined") {
    throw new Error(
      "Web Crypto subtle bulunamadı. Node 19+ veya react-native-get-random-values polyfill gerekli.",
    );
  }
  const enc = new TextEncoder().encode(input);
  const buf = await globalThis.crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
