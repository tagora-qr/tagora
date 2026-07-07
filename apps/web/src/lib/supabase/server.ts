/**
 * Supabase server client — Next.js Server Components & Route Handlers içinde kullanılır.
 *
 * Cookie tabanlı session okuma/yazma (Supabase SSR helper).
 * Auth context: kullanıcının auth.uid()'sini taşır → RLS politikalarımız kullanır.
 */
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
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
 * Hybrid auth resolver — hem cookie hem Bearer token'dan user çözer.
 *
 * Web'den gelen istekler (aynı origin): cookie üzerinden auth.
 * Mobile'dan gelen istekler: `Authorization: Bearer <supabase_jwt>` header'ı.
 *
 * Dönüş: `{ user, supabase }` — supabase client user'ın RLS context'iyle çalışır.
 */
export async function getAuthenticatedUser(
  req: NextRequest,
): Promise<{ user: User | null; supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> }> {
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (bearerToken) {
    // Mobile flow — Bearer token'ı olan bir server client oluştur
    const client = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {
            // no-op — Bearer flow'da cookie yazmıyoruz
          },
        },
        global: {
          headers: { Authorization: `Bearer ${bearerToken}` },
        },
      },
    );
    const { data } = await client.auth.getUser(bearerToken);
    return { user: data.user, supabase: client };
  }

  // Web flow — cookie tabanlı
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return { user: data.user, supabase };
}

/**
 * Service-role client — SADECE server tarafında, RLS'i bypass eder.
 *
 * Kullanım: admin akışları, token batch generation, KVKK cron.
 * ASLA client'a expose etme.
 *
 * NOT: @supabase/supabase-js'ın createClient'ını kullanıyoruz çünkü
 * @supabase/ssr cookie/session detection ile karışıp bazen service_role
 * bypass yapmayabiliyor. Bu raw client'ta o kavramlar yok — tam bypass.
 */
export function createSupabaseServiceClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
