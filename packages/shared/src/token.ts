/**
 * Tagora Token Generator
 *
 * Her sticker bir `token` ile public erişilir: `tagora.app/s/<token>`
 *
 * Tasarım kararları:
 * - 10 karakter Base62 → 62^10 ≈ 8.4×10^17 kombinasyon (brute-force ihmal edilebilir)
 * - Kriptografik random (web: crypto.getRandomValues, node: crypto.randomBytes)
 * - Ambiguity'i azaltmak için: alfabe tam Base62 (0-9, a-z, A-Z) → cam üstündeki QR'da
 *   yedek text basılırsa karışıklık ihtimali var; v2'de Crockford Base32 alternatif düşünülebilir.
 *
 * Scanner sessions için ephemeral_token: 16 karakter (daha uzun, fingerprint çakışmasını önler).
 */

const BASE62_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const STICKER_TOKEN_LENGTH = 10;
const SCANNER_SESSION_TOKEN_LENGTH = 16;

/**
 * Cross-platform secure random bytes alır.
 * - Browser: window.crypto.getRandomValues
 * - Node 19+: globalThis.crypto (Web Crypto API)
 * - React Native: 'react-native-get-random-values' polyfill (uygulama entry'sinde import et)
 * - Deno: globalThis.crypto
 *
 * NOT: Web Crypto API'sı olmayan bir ortamda (Node <19 veya polyfill'siz RN) hata fırlatır.
 */
function getSecureRandomBytes(length: number): Uint8Array {
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    globalThis.crypto.getRandomValues(bytes);
    return bytes;
  }
  throw new Error(
    "Web Crypto API bulunamadı. Node 19+, modern browser veya react-native-get-random-values polyfill gerekli.",
  );
}

/**
 * Verilen uzunlukta Base62 random token üretir.
 * Modulo bias riskini azaltmak için 2x bytes alıp filtreliyoruz.
 */
export function generateBase62Token(length: number): string {
  const result: string[] = [];
  const alphabetLength = BASE62_ALPHABET.length;
  // 256 % 62 = 8 → ilk 248 byte değeri uniform (256 - 8)
  const maxValid = 256 - (256 % alphabetLength);

  while (result.length < length) {
    const bytes = getSecureRandomBytes(length * 2);
    for (let i = 0; i < bytes.length && result.length < length; i++) {
      const b = bytes[i];
      if (b === undefined) continue;
      if (b >= maxValid) continue; // modulo bias filtresi
      result.push(BASE62_ALPHABET[b % alphabetLength]!);
    }
  }

  return result.join("");
}

/**
 * Sticker token üretir (10 karakter Base62).
 * 8.4×10^17 kombinasyon → 1 milyar sticker'da brute-force çakışması imkansız.
 */
export function generateStickerToken(): string {
  return generateBase62Token(STICKER_TOKEN_LENGTH);
}

/**
 * Scanner session için ephemeral token üretir (16 karakter Base62).
 * Cookie / localStorage'da saklanır, kullanıcı bağlamını taşır.
 */
export function generateScannerSessionToken(): string {
  return generateBase62Token(SCANNER_SESSION_TOKEN_LENGTH);
}

/**
 * Token format doğrulaması — endpoint'e gelen token sticker formatında mı?
 */
export function isValidStickerToken(token: string): boolean {
  if (typeof token !== "string") return false;
  if (token.length !== STICKER_TOKEN_LENGTH) return false;
  return /^[0-9A-Za-z]+$/.test(token);
}

/**
 * Batch token üretici (üretici CSV exports için).
 * Çakışma ihtimali astronomik düşük olsa da Set ile dedup yapıyoruz.
 */
export function generateStickerTokenBatch(count: number): string[] {
  const tokens = new Set<string>();
  while (tokens.size < count) {
    tokens.add(generateStickerToken());
  }
  return [...tokens];
}
