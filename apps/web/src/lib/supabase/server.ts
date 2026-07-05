/**
 * Supabase server client — Next.js Server Components & Route Handlers içinde kullanılır.
 *
 * Cookie tabanlı session okuma/yazma (Supabase SSR helper).
 * Auth context: kullanıcının auth.uid()'sini taşır → RLS politikalarımız kullanır.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@tagora/db";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component'lerde set edilemez — Route Handler'da çalışır
          }
        },
      },
    },
  );
}

/**
 * Service-role client — SADECE server tarafında, RLS'i bypass eder.
 *
 * Kullanım: admin akışları, token batch generation, KVKK cron.
 * ASLA client'a expose etme.
 */
export function createSupabaseServiceClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // no-op
        },
      },
      auth: { persistSession: false },
    },
  );
}
