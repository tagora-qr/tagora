/**
 * Scanner-mode Supabase client (anonymous, session-header'lı).
 *
 * Auth kullanılmaz — sadece x-scanner-session header'ıyla RLS bypass için
 * kullanılan `current_scanner_session_id()` PL/pgSQL fonksiyonuna session
 * ID'yi geçirir. Web'deki apps/web/src/lib/supabase/scanner.ts ile birebir.
 *
 * Kullanım:
 *   const client = createSupabaseScannerClient(sessionToken);
 *   await client.from("conversations").select("*, messages(*)");
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@tagora/db";

export function createSupabaseScannerClient(sessionToken: string) {
  return createClient<Database>(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          "x-scanner-session": sessionToken,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
