/**
 * POST /api/admin/subscriptions/extend
 * Body: { userId, months }
 *
 * Kullanıcının subscription_expires_at'ini manuel uzatır (admin only).
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { data: caller } = await supabase
    .from("users")
    .select("id, is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  const callerRow = caller as { id?: string; is_admin?: boolean } | null;
  if (!callerRow?.is_admin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  let body: { userId?: string; months?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz JSON" }, { status: 400 });
  }

  const userId = body.userId;
  const months = body.months;
  if (!userId || !Number.isFinite(months) || (months as number) <= 0) {
    return NextResponse.json(
      { ok: false, error: "userId + months (>0) gerekli" },
      { status: 400 },
    );
  }

  const service = createSupabaseServiceClient();
  const { data: profileRaw } = await service
    .from("users")
    .select("id, subscription_started_at, subscription_expires_at")
    .eq("id", userId)
    .maybeSingle();

  const profile = profileRaw as {
    id: string;
    subscription_started_at: string | null;
    subscription_expires_at: string | null;
  } | null;

  if (!profile) {
    return NextResponse.json(
      { ok: false, error: "Kullanıcı bulunamadı" },
      { status: 404 },
    );
  }

  // Base: mevcut expires (gelecekteyse) veya şu an
  const now = new Date();
  const currentExpires = profile.subscription_expires_at
    ? new Date(profile.subscription_expires_at)
    : null;
  const base = currentExpires && currentExpires > now ? currentExpires : now;
  const newExpires = new Date(base);
  newExpires.setMonth(newExpires.getMonth() + (months as number));

  const updates: Record<string, unknown> = {
    subscription_expires_at: newExpires.toISOString(),
    subscription_status: "active",
  };
  // İlk sefer manuel başlatılıyorsa
  if (!profile.subscription_started_at) {
    updates.subscription_started_at = now.toISOString();
  }

  const { error } = await service
    .from("users")
    .update(updates)
    .eq("id", profile.id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    new_expires_at: newExpires.toISOString(),
  });
}
