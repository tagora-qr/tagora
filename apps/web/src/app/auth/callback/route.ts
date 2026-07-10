/**
 * Supabase magic link callback handler.
 * Email'deki linke tıklayınca buraya gelir, session kurulur.
 *
 * `next` parametresi base64url encoded gelir (auth-next helper) — Supabase
 * magic-link chain'inde ? ve = karakterlerinin URL parsing'de bozulmasını
 * önler.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { decodeNext } from "@/lib/auth-next";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next");
  // decodeNext base64url'i açar + open-redirect koruması yapar
  // Legacy fallback: eğer rawNext "/" ile başlıyorsa (eski akıştan gelmiş), onu kullan
  const decoded = decodeNext(rawNext);
  const next =
    decoded !== "/dashboard"
      ? decoded
      : rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
        ? rawNext
        : "/dashboard";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, req.url));
    }
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
  }

  return NextResponse.redirect(new URL("/login?error=auth_failed", req.url));
}
