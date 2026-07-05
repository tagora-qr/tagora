/**
 * GET /api/admin/stickers/export?status=&use_case=
 *
 * Admin-only. Filter'lı sticker listesini CSV olarak indirir.
 * Middleware zaten /admin altındaki tüm istekleri is_admin ile guard'ıyor,
 * ancak backend'de de savunmalı check ekliyoruz.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  // 1) Auth check
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!(profile as { is_admin?: boolean } | null)?.is_admin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  // 2) Filter param'ları
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const useCase = url.searchParams.get("use_case");

  // 3) Service role ile query (RLS bypass)
  const service = createSupabaseServiceClient();
  let query = service
    .from("stickers")
    .select("token, use_case, status, label, owner_id, scan_count, created_at, claimed_at")
    .order("created_at", { ascending: false })
    .limit(10000);

  if (status && status !== "all") query = query.eq("status", status);
  if (useCase && useCase !== "all") query = query.eq("use_case", useCase);

  const { data: rows, error } = await query;
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // 4) CSV format
  const header = [
    "token",
    "use_case",
    "status",
    "label",
    "owner_id",
    "scan_count",
    "created_at",
    "claimed_at",
    "scanner_url",
  ].join(",");

  const csvRows = (rows ?? []).map((r) => {
    const rec = r as {
      token: string;
      use_case: string | null;
      status: string;
      label: string | null;
      owner_id: string | null;
      scan_count: number;
      created_at: string;
      claimed_at: string | null;
    };
    // Basit CSV escape — virgül ve tırnak içeren alanlar
    const esc = (v: string | number | null) =>
      v === null || v === undefined
        ? ""
        : /[",\n]/.test(String(v))
          ? `"${String(v).replace(/"/g, '""')}"`
          : String(v);

    return [
      esc(rec.token),
      esc(rec.use_case),
      esc(rec.status),
      esc(rec.label),
      esc(rec.owner_id),
      esc(rec.scan_count),
      esc(rec.created_at),
      esc(rec.claimed_at),
      esc(`https://tagora.link/s/${rec.token}`),
    ].join(",");
  });

  const csv = [header, ...csvRows].join("\n");
  const filename = `tagora-stickers-${new Date().toISOString().slice(0, 10)}${
    status ? `-${status}` : ""
  }${useCase ? `-${useCase}` : ""}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
