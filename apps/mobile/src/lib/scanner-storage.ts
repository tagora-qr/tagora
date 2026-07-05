/**
 * Scanner session storage — anonim ziyaretçi için SecureStore adapter.
 *
 * Web'de bu iş cookie ile yapılıyor (tagora_scanner_session).
 * Mobile'da cookie yok — SecureStore ile per-sticker session_token tutuyoruz.
 * Süre: 7 gün (backend'de ephemeral_token 7 gün TTL ile eşleşir).
 */
import * as SecureStore from "expo-secure-store";

/** Her sticker için ayrı key — birden fazla sticker'la konuşabilir */
const key = (stickerToken: string) => `tagora_scan_${stickerToken}`;

export async function getScannerSession(
  stickerToken: string,
): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key(stickerToken));
  } catch (e) {
    console.warn("[scanner-storage] getSession failed", e);
    return null;
  }
}

export async function setScannerSession(
  stickerToken: string,
  sessionToken: string,
): Promise<void> {
  try {
    await SecureStore.setItemAsync(key(stickerToken), sessionToken);
  } catch (e) {
    console.warn("[scanner-storage] setSession failed", e);
  }
}

export async function clearScannerSession(stickerToken: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key(stickerToken));
  } catch (e) {
    console.warn("[scanner-storage] clearSession failed", e);
  }
}
