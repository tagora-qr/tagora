/**
 * POST /api/admin/orders/allocate
 * Body: { orderId }
 *
 * Depodan FIFO ile N sticker seç, siparişe ata.
 * DB fonksiyonu `allocate_stickers_to_order(order_id, admin_user_id)` çağırıyor.
 *
 * Yanıt:
 *   { ok: true, allocated: 5, stickerIds: [...], demand: 10, allocated_total: 10 }
 *   ok=true olsa bile allocated<demand olabilir (stok yetmedi).
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

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
  if (!callerRow?.is_admin || !callerRow.id) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  let payload: { orderId?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz JSON" }, { status: 400 });
  }

  const { orderId } = payload;
  if (!orderId) {
    return NextResponse.json({ ok: false, error: "orderId gerekli" }, { status: 400 });
  }

  const service = createSupabaseServiceClient();

  // Order status check — sadece paid/preparing için ata
  const { data: order } = await service
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .maybeSingle();

  const orderRow = order as { id?: string; status?: string } | null;
  if (!orderRow?.id) {
    return NextResponse.json({ ok: false, error: "Sipariş bulunamadı" }, { status: 404 });
  }
  if (!["paid", "preparing"].includes(orderRow.status ?? "")) {
    return NextResponse.json(
      { ok: false, error: `Sipariş "${orderRow.status}" durumunda — sadece paid/preparing için sticker atanabilir` },
      { status: 400 },
    );
  }

  // Ata!
  const { data: allocRes, error: allocErr } = await service.rpc(
    "allocate_stickers_to_order" as never,
    { _order_id: orderId, _admin_user_id: callerRow.id } as never,
  );

  if (allocErr) {
    return NextResponse.json({ ok: false, error: allocErr.message }, { status: 500 });
  }

  const allocatedIds = ((allocRes ?? []) as unknown as string[]) ?? [];

  // Talep + toplam durum
  const { data: demandRes } = await service.rpc(
    "order_sticker_demand" as never,
    { _order_id: orderId } as never,
  );
  const { data: allocatedTotalRes } = await service.rpc(
    "order_sticker_allocated" as never,
    { _order_id: orderId } as never,
  );

  return NextResponse.json({
    ok: true,
    allocated: allocatedIds.length,
    stickerIds: allocatedIds,
    demand: (demandRes as unknown as number) ?? 0,
    allocatedTotal: (allocatedTotalRes as unknown as number) ?? 0,
  });
}
