/**
 * GET /api/admin/users/[id]/export
 *
 * KVKK Md.11 — kullanıcının tüm verisini JSON olarak indir.
 * Admin çağırabilir. Kullanıcının kendi export_my_data RPC'si var,
 * bu ise admin için hazırlanmış versiyon.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: caller } = await supabase
    .from("users")
    .select("is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!(caller as { is_admin?: boolean } | null)?.is_admin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { id: userId } = await params;
  const service = createSupabaseServiceClient();

  // Kullanıcı bilgisi
  const { data: userRow } = await service
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (!userRow) {
    return NextResponse.json({ ok: false, error: "Kullanıcı yok" }, { status: 404 });
  }

  // Sticker'ları
  const { data: stickers } = await service
    .from("stickers")
    .select("*")
    .eq("owner_id", userId);

  // Konuşmaları
  const { data: conversations } = await service
    .from("conversations")
    .select("*")
    .eq("owner_id", userId);

  // Mesajları (owner'ın attığı + geldiği tüm mesajlar)
  const convIds = ((conversations ?? []) as { id: string }[]).map((c) => c.id);
  const { data: messages } =
    convIds.length > 0
      ? await service.from("messages").select("*").in("conversation_id", convIds)
      : { data: [] };

  const payload = {
    exported_at: new Date().toISOString(),
    exported_by: "admin",
    user: userRow,
    stickers: stickers ?? [],
    conversations: conversations ?? [],
    messages: messages ?? [],
  };

  const json = JSON.stringify(payload, null, 2);
  const filename = `tagora-user-${userId}-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
