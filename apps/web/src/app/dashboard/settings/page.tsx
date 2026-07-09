/**
 * Hesap ayarları — email + isim + telefon değiştirme.
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SettingsForm } from "./form";

export const metadata = { title: "Hesap Ayarları" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("email, display_name, phone")
    .eq("auth_user_id", user!.id)
    .maybeSingle();

  const p = (profile ?? {}) as {
    email?: string;
    display_name?: string | null;
    phone?: string | null;
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Hesap Ayarları</h1>
        <p className="mt-1 text-sm text-charcoal/60">
          Email, isim ve telefon numaranı güncelleyebilirsin.
        </p>
      </div>

      <SettingsForm
        currentEmail={p.email ?? user?.email ?? ""}
        currentDisplayName={p.display_name ?? ""}
        currentPhone={p.phone ?? ""}
      />
    </div>
  );
}
