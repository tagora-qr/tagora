/**
 * Supabase browser client — Client Component'ler içinde kullanılır.
 *
 * Realtime subscriptions için bu client gerekiyor.
 * Auth: cookies'ten oku, otomatik refresh.
 */
"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@tagora/db";

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
