/**
 * Profil sayfası — temel KVKK self-service.
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export const metadata = { title: "Profil" };

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", user!.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Profil</h1>

      <section className="rounded-2xl border border-navy/10 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold text-charcoal/60">Hesap</h2>
        <dl className="space-y-2">
          <div className="flex justify-between text-sm">
            <dt className="text-charcoal/60">E-posta</dt>
            <dd className="font-medium text-navy">{profile?.email}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-charcoal/60">Plan</dt>
            <dd className="font-medium text-navy uppercase">{profile?.tier ?? "free"}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-charcoal/60">Dil</dt>
            <dd className="font-medium text-navy uppercase">{profile?.locale ?? "tr"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-navy/10 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold text-charcoal/60">
          KVKK — Verim
        </h2>
        <div className="space-y-2">
          <a href="/api/account/export" className="btn-secondary w-full text-center">
            Verimi indir (JSON)
          </a>
          <details className="rounded-xl border border-red-200 bg-red-50/50 p-3">
            <summary className="cursor-pointer text-sm font-medium text-red-700">
              Hesabımı sil
            </summary>
            <p className="my-2 text-xs text-red-700/80">
              Tüm verilerin anonimleştirilir, sticker&apos;ların deaktive edilir. Geri alınamaz.
            </p>
            <form action="/api/account/delete" method="POST">
              <button
                type="submit"
                className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Hesabımı kalıcı olarak sil
              </button>
            </form>
          </details>
        </div>
      </section>

      <LogoutButton />
    </div>
  );
}
