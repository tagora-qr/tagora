/**
 * Tagora mobil Supabase client.
 *
 * SecureStore ile session token'ları güvenli storage'a yazar (KeyChain iOS,
 * Keystore Android). AsyncStorage yerine SecureStore tercih ediyoruz çünkü
 * KVKK için token gizliliği önemli.
 *
 * Not: Realtime WebSocket URL polyfill gerekli — react-native-url-polyfill.
 */

import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import type { Database } from "@tagora/db";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "[supabase] EXPO_PUBLIC_SUPABASE_URL veya EXPO_PUBLIC_SUPABASE_ANON_KEY tanımlı değil. apps/mobile/.env dosyasını kontrol et.",
  );
}

/**
 * SecureStore adapter — session token'ları platform-native güvenli storage'a yazar.
 * value boyutu 2048 byte'ı aşarsa (bazı JWT'ler için sınır sıkı olabilir) chunk'lara böler.
 */
const CHUNK_SIZE = 2000;

const secureStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      const primary = await SecureStore.getItemAsync(key);
      if (primary && primary.startsWith("__CHUNKED__:")) {
        // Chunk'lı formatta saklanmış
        const count = parseInt(primary.slice(12), 10);
        const parts: string[] = [];
        for (let i = 0; i < count; i++) {
          const part = await SecureStore.getItemAsync(`${key}__part${i}`);
          if (part === null) return null;
          parts.push(part);
        }
        return parts.join("");
      }
      return primary;
    } catch (e) {
      console.warn("[supabase-store] getItem failed", key, e);
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (value.length <= CHUNK_SIZE) {
        await SecureStore.setItemAsync(key, value);
        return;
      }
      // Chunk'la böl
      const chunkCount = Math.ceil(value.length / CHUNK_SIZE);
      await SecureStore.setItemAsync(key, `__CHUNKED__:${chunkCount}`);
      for (let i = 0; i < chunkCount; i++) {
        await SecureStore.setItemAsync(
          `${key}__part${i}`,
          value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
        );
      }
    } catch (e) {
      console.warn("[supabase-store] setItem failed", key, e);
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      const primary = await SecureStore.getItemAsync(key);
      if (primary?.startsWith("__CHUNKED__:")) {
        const count = parseInt(primary.slice(12), 10);
        for (let i = 0; i < count; i++) {
          await SecureStore.deleteItemAsync(`${key}__part${i}`);
        }
      }
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn("[supabase-store] removeItem failed", key, e);
    }
  },
};

export const supabase = createClient<Database>(
  SUPABASE_URL ?? "http://localhost",
  SUPABASE_ANON_KEY ?? "anon",
  {
    auth: {
      storage: secureStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Mobil'de URL'den session okumuyoruz
    },
  },
);
