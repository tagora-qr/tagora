/**
 * GET /api/admin/business-leads/export
 * Optional query: ?status=new
 *
 * CSV export — admin lead listesini Excel için.
 */
import { type NextRequest } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

const CSV_HEADERS = [
  "id",
  "created_at",
  "status",
  "contact_name",
  "email",
  "phone",
  "company_name",
  "company_size",
  "sector",
  "estimated_quantity",
  "custom_design",
  "message",
  "source",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "admin_note",
];

const csvEscape = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: caller } = await supabase
    .from("users")
    .select("is_admin")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!(caller as { is_admin?: boolean } | null)?.is_admin) {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  const service = createSupabaseServiceClient();
  let query = service.from("business_leads").select("*").order("created_at", { ascending: false });
  if (status && status !== "all") query = query.eq("status", status);

  const { data: leads } = await query;
  const list = (leads ?? []) as Record<string, unknown>[];

  const lines = [
    CSV_HEADERS.join(","),
    ...list.map((row) => CSV_HEADERS.map((h) => csvEscape(row[h])).join(",")),
  ];
  const csv = "﻿" + lines.join("\n"); // BOM for Excel UTF-8

  const filename = `tagora-b2b-leads-${new Date().toISOString().slice(0, 10)}${status && status !== "all" ? `-${status}` : ""}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
