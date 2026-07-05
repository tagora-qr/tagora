/**
 * GEÇICI DEBUG ENDPOINT — Sprint 2'de silinecek.
 * Auth context ve RLS visibility'yi doğrular.
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  // current_user_id() SQL fonksiyonunu RPC ile çağır (RLS context ile)
  const { data: currentUserId, error: rpcErr } = await supabase.rpc(
    "current_user_id" as never,
  );

  // Kendi profile row'unu al (users tablosu, RLS ile)
  const { data: profile, error: profileErr } = await supabase
    .from("users")
    .select("id, email, auth_user_id")
    .maybeSingle();

  // Conversations count (RLS ile)
  const { data: convs, error: convErr, count } = await supabase
    .from("conversations")
    .select("id, owner_id, sticker_id", { count: "exact" });

  return NextResponse.json({
    auth: {
      user_id: user?.id ?? null,
      email: user?.email ?? null,
      error: userErr?.message ?? null,
    },
    rls: {
      current_user_id_rpc: currentUserId ?? null,
      current_user_id_rpc_error: rpcErr?.message ?? null,
    },
    profile: {
      row: profile ?? null,
      error: profileErr?.message ?? null,
    },
    conversations: {
      count: count ?? 0,
      rows: convs ?? [],
      error: convErr?.message ?? null,
    },
  });
}
