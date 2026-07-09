/**
 * POST /api/stickers/claim
 *
 * Authenticated owner sticker'ı kendi hesabına ekler.
 *
 * NOT: Sticker'ın `status='manufactured'` iken RLS policy'leri kullanıcıya
 * görünürlük vermez (public view sadece 'claimed'/'active'). Bu yüzden lookup
 * ve update için SERVICE_ROLE client kullanıyoruz — race condition guard
 * (`is('owner_id', null)`) ile başka kullanıcının sticker'ını atamayı engelliyoruz.
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  getAuthenticatedUser,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import { isValidStickerToken } from "@tagora/shared";
import type { StickerUseCase } from "@tagora/db";

const ALLOWED_USE_CASES: StickerUseCase[] = [
  "vehicle", "door", "pet", "luggage", "bike", "other",
];

interface Body {
  token: string;
  use_case: StickerUseCase;
  label: string | null;
}

export async function POST(req: NextRequest) {
  // Hybrid auth: cookie (web) veya Bearer token (mobile)
  const { user, supabase } = await getAuthenticatedUser(req);

  if (!user) {
    return NextResponse.json({ ok: false, error: "Giriş gerekli." }, { status: 401 });
  }

  // ---- Payload validation ----
  let payload: Body;
  try {
    payload = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz istek." }, { status: 400 });
  }

  const cleanToken = (payload.token ?? "").trim();
  if (!isValidStickerToken(cleanToken)) {
    return NextResponse.json(
      { ok: false, error: "Geçersiz sticker kodu (10 karakter olmalı)." },
      { status: 400 },
    );
  }
  if (!ALLOWED_USE_CASES.includes(payload.use_case)) {
    return NextResponse.json(
      { ok: false, error: "Geçersiz kullanım türü." },
      { status: 400 },
    );
  }

  // ---- Tagora users kaydını bul ----
  const { data: tagoraUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!tagoraUser) {
    return NextResponse.json(
      { ok: false, error: "Kullanıcı kaydı bulunamadı." },
      { status: 500 },
    );
  }

  // ---- Service-role client (RLS bypass) ----
  // 'manufactured' status'undaki sticker'lar RLS ile kullanıcıya görünmüyor;
  // bu yüzden lookup + update service_role ile yapılır.
  const admin = createSupabaseServiceClient();

  const { data: sticker, error: stickerErr } = await admin
    .from("stickers")
    .select("id, status, owner_id")
    .eq("token", cleanToken)
    .maybeSingle();

  if (stickerErr) {
    return NextResponse.json(
      { ok: false, error: "Veritabanı hatası: " + stickerErr.message },
      { status: 500 },
    );
  }

  if (!sticker) {
    return NextResponse.json(
      { ok: false, error: "Bu kod sistemde kayıtlı değil." },
      { status: 404 },
    );
  }

  if (sticker.owner_id && sticker.owner_id !== tagoraUser.id) {
    return NextResponse.json(
      { ok: false, error: "Bu sticker başka birine eşlenmiş." },
      { status: 409 },
    );
  }

  if (["blocked", "retired", "recall"].includes(sticker.status ?? "")) {
    return NextResponse.json(
      { ok: false, error: "Bu sticker artık kullanılamaz." },
      { status: 410 },
    );
  }

  // Zaten bu kullanıcıya atanmışsa (idempotent), sadece güncelle
  const raceGuard = sticker.owner_id === null ? { is_null: true } : { is_null: false };

  let updateBuilder = admin
    .from("stickers")
    .update({
      owner_id: tagoraUser.id,
      status: "active",
      use_case: payload.use_case,
      label: payload.label,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", sticker.id!);

  // İlk claim için race condition guard: sadece owner_id NULL iken update et
  if (raceGuard.is_null) {
    updateBuilder = updateBuilder.is("owner_id", null);
  }

  const { data: updated, error: updErr } = await updateBuilder
    .select("*")
    .maybeSingle();

  if (updErr) {
    return NextResponse.json(
      { ok: false, error: "Sticker eklenirken hata: " + updErr.message },
      { status: 500 },
    );
  }
  if (!updated) {
    return NextResponse.json(
      { ok: false, error: "Sticker aynı anda başkası tarafından alındı, tekrar dene." },
      { status: 409 },
    );
  }

  // İlk sticker aktivasyonunda subscription trial'ı başlat (varsa dokunmaz).
  // Fatal olmayan bir hata — sticker claim yine başarılı sayılır.
  const { data: trialStarted, error: trialErr } = await admin.rpc(
    "start_user_trial_if_none" as never,
    { _user_id: tagoraUser.id } as never,
  );
  if (trialErr) {
    console.error("[claim] start_user_trial_if_none hatası:", trialErr.message);
  }

  return NextResponse.json({
    ok: true,
    sticker: updated,
    trial_started: Boolean(trialStarted),
  });
}
