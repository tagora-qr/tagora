/**
 * Profil sayfası — hesap bilgisi + KVKK self-service.
 */
import Link from "next/link";
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

  const p = profile as {
    email?: string;
    display_name?: string | null;
    phone?: string | null;
    locale?: string | null;
    subscription_expires_at?: string | null;
  } | null;

  const planLabel = getPlanLabel(p?.subscription_expires_at ?? null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Profil</h1>
        <Link
          href={"/dashboard/settings" as never}
          className="btn-secondary text-sm"
        >
          Bilgileri Düzenle
        </Link>
      </div>

      <section className="rounded-2xl border border-navy/10 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold text-charcoal/60">Hesap</h2>
        <dl className="space-y-2">
          <div className="flex justify-between text-sm">
            <dt className="text-charcoal/60">E-posta</dt>
            <dd className="font-medium text-navy">{p?.email}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-charcoal/60">İsim</dt>
            <dd className="font-medium text-navy">
              {p?.display_name ?? <span className="text-charcoal/40">—</span>}
            </dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-charcoal/60">Telefon</dt>
            <dd className="font-medium text-navy">
              {p?.phone ?? <span className="text-charcoal/40">—</span>}
            </dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-charcoal/60">Dil</dt>
            <dd className="font-medium text-navy uppercase">
              {p?.locale ?? "tr"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="flex items-center justify-between rounded-2xl border border-navy/10 bg-white p-6">
        <div>
          <h2 className="text-sm font-semibold text-charcoal/60">Abonelik</h2>
          <p className="mt-1 font-semibold text-navy">{planLabel}</p>
        </div>
        <Link
          href={"/dashboard/subscription" as never}
          className="btn-secondary text-sm"
        >
          Detay →
        </Link>
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

function getPlanLabel(expiresAt: string | null): string {
  if (!expiresAt) return "Deneme başlamadı";
  const now = new Date();
  const exp = new Date(expiresAt);
  const graceEnd = new Date(exp.getTime() + 30 * 24 * 60 * 60 * 1000);
  const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days > 0) return `Aktif · ${days} gün kaldı`;
  if (now < graceEnd) {
    const graceDays = Math.ceil(
      (graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return `Ek süre · ${graceDays} gün`;
  }
  return "Süresi doldu";
}
