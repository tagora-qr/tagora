/**
 * POST /api/admin/scanner-sessions/toggle-block
 * Body: { sessionId }
 *
 * Scanner session'ı bloke eder / kaldırır. Blocked session mesaj gönderemez.
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
    .select("is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!(caller as { is_admin?: boolean } | null)?.is_admin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  let payload: { sessionId?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz JSON" }, { status: 400 });
  }

  const sessionId = payload.sessionId;
  if (!sessionId) {
    return NextResponse.json({ ok: false, error: "sessionId gerekli" }, { status: 400 });
  }

  const service = createSupabaseServiceClient();

  const { data: session } = await service
    .from("scanner_sessions")
    .select("is_blocked")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ ok: false, error: "Session yok" }, { status: 404 });
  }

  const newValue = !((session as { is_blocked: boolean }).is_blocked);
  const { error } = await service
    .from("scanner_sessions")
    .update({ is_blocked: newValue })
    .eq("id", sessionId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, is_blocked: newValue });
}
