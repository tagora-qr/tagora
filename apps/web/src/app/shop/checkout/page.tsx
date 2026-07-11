/**
 * Shop — Checkout
 *
 * Kullanıcı bir paket seçtikten sonra buraya gelir.
 * Alıcı + kargo adresi + iletişim bilgisi alınır.
 * "Öde" butonuna basınca iyzico Checkout Form'una yönlendirilir.
 */
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { CheckoutForm } from "./form";
import { encodeNext } from "@/lib/auth-next";
import type { StickerPackage } from "@tagora/db";

export const metadata = {
  title: "Ödeme · Tagora",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ package?: string }>;

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { package: slug } = await searchParams;
  if (!slug) redirect("/shop");

  const supabase = await createSupabaseServerClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Base64url encode to survive URL parsing through Supabase magic-link chain
    redirect(`/login?next=${encodeNext(`/shop/checkout?package=${slug}`)}`);
  }

  // Paketi çek
  const { data: pkg } = await supabase
    .from("sticker_packages")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!pkg) redirect("/shop");
  const p = pkg as StickerPackage;

  // Aktif tasarımları çek (müşteri seçecek)
  const { data: designsRaw } = await supabase
    .from("sticker_designs")
    .select("id, slug, name, description, preview_url")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  const designs = (designsRaw ?? []) as Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    preview_url: string | null;
  }>;

  // Kullanıcı profili (email, isim ön-doldur + subscription durumu)
  const { data: profileRaw } = await supabase
    .from("users")
    .select("email, display_name, phone, subscription_expires_at")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  const profile = (profileRaw ?? {}) as {
    email?: string;
    display_name?: string | null;
    phone?: string | null;
    subscription_expires_at?: string | null;
  };

  // İlk sticker'ını alan biri → 1 yıl bedava kullanım. Zaten trial başlamışsa
  // kalem gösterme (kafa karışıklığı olmasın).
  const isFirstYearFree = !profile.subscription_expires_at;
  const SUBSCRIPTION_TRY = 99;

  // Kargo: 15 TL sabit (v1), sonra tartıya göre dinamik
  const SHIPPING_TRY = 15;
  const total = Number(p.price_try) + SHIPPING_TRY; // Abonelik +99 -99 = net 0

  return (
    <div className="min-h-screen bg-bgSubtle">
      <header className="border-b border-navy/5 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/">
            <Logo />
          </Link>
          <Link href="/shop" className="btn-ghost text-sm">
            ← Paketler
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <h1 className="mb-6 text-2xl font-bold text-navy">Ödeme</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sol: form */}
          <div className="lg:col-span-2">
            <CheckoutForm
              packageSlug={p.slug}
              packageId={p.id}
              stickerCount={p.sticker_count}
              defaultEmail={profile.email ?? user.email ?? ""}
              defaultName={profile.display_name ?? ""}
              defaultPhone={profile.phone ?? ""}
              designs={designs}
              isFirstYearFree={isFirstYearFree}
              subscriptionTry={SUBSCRIPTION_TRY}
            />
          </div>

          {/* Sağ: özet */}
          <aside className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm h-fit sticky top-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-charcoal/60">
              Sipariş Özeti
            </h2>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-navy">{p.name_tr}</p>
                <p className="text-xs text-charcoal/60">
                  {p.sticker_count} sticker
                </p>
              </div>
              <p className="tabular-nums font-medium">
                {Number(p.price_try).toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                })}{" "}
                ₺
              </p>
            </div>

            <div className="mt-4 space-y-1 border-t border-navy/10 pt-3 text-sm">
              <Row label="Ara toplam" value={`${Number(p.price_try).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`} />
              <Row label="Kargo (Türkiye içi)" value={`${SHIPPING_TRY.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`} />
              {isFirstYearFree && (
                <>
                  <Row
                    label="Yıllık kullanım ücreti"
                    value={`${SUBSCRIPTION_TRY.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`}
                  />
                  <Row
                    label="İlk yıl bedava 🎁"
                    value={`−${SUBSCRIPTION_TRY.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`}
                    accent="text-emerald-700"
                  />
                </>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-navy/10 pt-3">
              <span className="font-bold text-navy">Toplam</span>
              <span className="text-xl font-bold text-navy tabular-nums">
                {total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
              </span>
            </div>

            {isFirstYearFree && (
              <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] leading-snug text-emerald-800">
                🎁 <strong>1 yıl ücretsiz kullanım</strong> siparişinle otomatik başlar.
                1 yıl sonunda yenilemek istersen 99 ₺/yıl. Otomatik ödeme yok, sen
                yönetirsin.
              </p>
            )}

            <p className="mt-4 text-[10px] text-charcoal/50">
              KDV dahil. Ödeme iyzico güvenli ödeme altyapısıyla alınır. Kart bilgin
              Tagora sunucularına gelmez.
            </p>

            {/* Güvenli ödeme logoları — iyzico onayı için gerekli */}
            <div className="mt-3 flex items-center gap-2 border-t border-navy/10 pt-3">
              <img
                src="/payment/iyzico-ile-ode.svg"
                alt="iyzico ile Öde"
                style={{ height: 24, width: "auto" }}
              />
              <img src="/payment/visa.svg" alt="Visa" style={{ height: 24, width: "auto" }} />
              <img
                src="/payment/mastercard.svg"
                alt="Mastercard"
                style={{ height: 24, width: "auto" }}
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className={`flex items-center justify-between ${accent ?? ""}`}>
      <span className={accent ? "" : "text-charcoal/60"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
