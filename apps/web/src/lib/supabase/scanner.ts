/**
 * Scanner-specific Supabase client.
 *
 * QR'ı tarayan anonim kullanıcı için. Auth yok, sadece
 * `x-scanner-session` header'ı ile RLS'e session ID enjekte eder.
 *
 * RLS function `current_scanner_session_id()` bu header'ı okur:
 *   select id from scanner_sessions where ephemeral_token = current_setting('request.headers')->>'x-scanner-session'
 */
"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@tagora/db";

export function createSupabaseScannerClient(ephemeralToken: string | null) {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: ephemeralToken
          ? { "x-scanner-session": ephemeralToken }
          : {},
      },
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // Scanner session cookie ayrıca manuel yönetiliyor
        },
      },
      auth: { persistSession: false },
    },
  );
}
