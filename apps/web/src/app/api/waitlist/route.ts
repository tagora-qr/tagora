/**
 * POST /api/waitlist
 * Anonim e-mail toplama. Idempotent (aynı e-mail tekrar verilirse 200 döner).
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  let body: { email?: string; locale?: string; referral_source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Geçerli bir e-posta gir." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from("waitlist")
    .insert({
      email,
      locale: body.locale === "en" ? "en" : "tr",
      referral_source: body.referral_source ?? null,
    });

  // Unique constraint violation → zaten kayıtlı, idempotent
  if (error && error.code !== "23505") {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
