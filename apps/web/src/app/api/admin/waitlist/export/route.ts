/**
 * GET /api/admin/waitlist/export
 * Waitlist CSV export — lansman e-postası dağıtımı için.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest) {
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

  const service = createSupabaseServiceClient();
  const { data: rows } = await service
    .from("waitlist")
    .select("email, locale, referral_source, created_at")
    .order("created_at", { ascending: false });

  const header = "email,locale,referral_source,created_at";
  const csv = [
    header,
    ...(rows ?? []).map((r) => {
      const rec = r as {
        email: string;
        locale: string;
        referral_source: string | null;
        created_at: string;
      };
      const esc = (v: string | null) =>
        v === null ? "" : /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
      return [
        esc(rec.email),
        esc(rec.locale),
        esc(rec.referral_source),
        esc(rec.created_at),
      ].join(",");
    }),
  ].join("\n");

  const filename = `tagora-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
