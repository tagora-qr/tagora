/**
 * GET /api/account/export
 * KVKK Md.11 — kullanıcı kendi verilerini JSON olarak indirir.
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "auth required" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("export_my_data");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const json = JSON.stringify(data, null, 2);
  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="tagora-data-${user.id}.json"`,
    },
  });
}
