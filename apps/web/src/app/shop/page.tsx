/**
 * Shop — /shop
 *
 * Sticker paket katalog. Kullanıcı bir paket seçer → /shop/checkout'a gider.
 * Paket tanımları DB'de sticker_packages tablosunda.
 */
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import type { StickerPackage } from "@tagora/db";

export const metadata = {
  title: "Sticker Sipariş · Tagora",
  description:
    "Tagora QR sticker paketleri — araç, kapı, evcil hayvan, bagaj, bisiklet için. Kargo dahil, KVKK uyumlu.",
};

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const supabase = await createSupabaseServerClient();
  const { data: packages } = await supabase
    .from("sticker_packages")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const items = (packages ?? []) as StickerPackage[];

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-50 via-white to-white">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div className="mb-10 text-center">
          <span className="chip mb-4 inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Türkiye içi 2-4 gün kargo · KDV dahil
          </span>
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            Sticker paketleri
          </h1>
          <p className="text-lg text-charcoal/70">
            Her paket kargo dahil, KVKK uyumlu üretim.
          </p>
        </div>

        {items.length === 0 ? (
          <p className="rounded-2xl border border-navy/10 bg-white p-10 text-center text-charcoal/60">
            Şu an paket bulunmuyor. Kısa süre içinde geri gel.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        )}

        {/* Bilgi bölümü */}
        <section className="mt-16 grid gap-6 rounded-3xl bg-navy/[0.03] p-8 sm:grid-cols-3">
          <Info emoji="🚚" title="Türkiye içi hızlı kargo">
            2-4 iş günü içinde adresinize teslim. Aras/Yurtiçi Kargo.
          </Info>
          <Info emoji="🛡️" title="Dayanıklı">
            Matte outdoor vinyl · UV korumalı · 5+ yıl dış mekan dayanımı.
          </Info>
          <Info emoji="🔒" title="Privacy-first">
            Telefon numaran, kimliğin scanner'a gösterilmez. KVKK uyumlu, uçtan uca şifreli.
          </Info>
        </section>

        {/* Güvenli Ödeme trust satırı — iyzico onayı için görünür yer */}
        <section className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-navy/10 bg-white px-6 py-5 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-sm font-semibold text-navy">Güvenli Ödeme</p>
            <p className="text-xs text-charcoal/60">
              Kart bilgin iyzico altyapısıyla korunur — Tagora sunucularına gelmez
            </p>
          </div>
          <div className="flex items-center gap-3">
            <img
              src="/payment/iyzico-ile-ode.svg"
              alt="iyzico ile Öde"
              style={{ height: 32, width: "auto" }}
            />
            <img
              src="/payment/visa.svg"
              alt="Visa"
              style={{ height: 32, width: "auto" }}
            />
            <img
              src="/payment/mastercard.svg"
              alt="Mastercard"
              style={{ height: 32, width: "auto" }}
            />
          </div>
        </section>

        {/* Sıkça sorulanlar */}
        <section className="mt-16">
          <h2 className="mb-6 text-center text-2xl font-bold text-navy">
            Sıkça sorulanlar
          </h2>
          <div className="mx-auto max-w-2xl space-y-4">
            <FAQ q="Sticker nasıl çalışıyor?">
              Sticker'ı objene yapıştırıyorsun. Kimse tararsa anonim chat açılıyor.
              Telefonun paylaşılmıyor.
            </FAQ>
            <FAQ q="Her sticker aynı mı yoksa farklı mı?">
              Her sticker unique bir QR kod içerir. Sen mobil app'te tarayıp
              hesabınla eşliyorsun (araç, kapı, pet, bagaj, bisiklet vb.).
            </FAQ>
            <FAQ q="Hangi objelere yapıştırılıyor?">
              Kalın vinyl olduğu için araç camına (iç yüzey), kapıya, valize, bike gövdesine,
              pet tasmasına yapıştırılıyor. Detay ürün sayfasında.
            </FAQ>
            <FAQ q="Kaç sticker kullanabilirim?">
              Sınırsız. Bir hesap ile birden fazla sticker eşleyebilirsin
              (araç + kapı + pet gibi).
            </FAQ>
            <FAQ q="İade politikası nedir?">
              Fiziksel sticker'lar üretim mahiyetli olduğu için açılmamış paketler için
              14 gün cayma hakkı var. Detay için Kullanım Şartları sayfası.
            </FAQ>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function PackageCard({ pkg }: { pkg: StickerPackage }) {
  const unitPrice = pkg.price_try / pkg.sticker_count;

  return (
    <div
      className={
        "relative flex flex-col rounded-2xl border p-6 shadow-sm transition hover:shadow-md " +
        (pkg.is_featured
          ? "border-accent bg-white"
          : "border-navy/10 bg-white")
      }
    >
      {pkg.is_featured && (
        <span className="absolute -top-3 right-4 rounded-full bg-accent px-3 py-1 text-xs font-bold text-navy shadow">
          EN POPÜLER
        </span>
      )}

      <p className="text-xs font-semibold uppercase tracking-wider text-charcoal/60">
        {pkg.sticker_count} adet
      </p>
      <h3 className="mt-1 text-lg font-bold text-navy">{pkg.name_tr}</h3>
      {pkg.description_tr && (
        <p className="mt-2 text-sm text-charcoal/70 flex-1">{pkg.description_tr}</p>
      )}

      <div className="mt-5 border-t border-navy/10 pt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-navy">
            {Number(pkg.price_try).toLocaleString("tr-TR")}
          </span>
          <span className="text-sm font-medium text-charcoal/60">₺</span>
        </div>
        {pkg.sticker_count > 1 && (
          <p className="mt-1 text-xs text-charcoal/50">
            Sticker başı{" "}
            {unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
          </p>
        )}
      </div>

      <Link
        href={`/shop/checkout?package=${pkg.slug}` as never}
        className={
          "mt-5 block w-full rounded-xl py-2.5 text-center font-semibold transition " +
          (pkg.is_featured
            ? "bg-navy text-accent hover:bg-navy-800"
            : "border border-navy/20 text-navy hover:bg-navy/[0.03]")
        }
      >
        Satın al
      </Link>
    </div>
  );
}

function Info({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-3xl">{emoji}</div>
      <h3 className="mb-1 font-bold text-navy">{title}</h3>
      <p className="text-sm text-charcoal/70">{children}</p>
    </div>
  );
}

function FAQ({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-navy/10 bg-white p-4 open:shadow-sm">
      <summary className="cursor-pointer list-none font-semibold text-navy">
        {q}
        <span className="float-right text-charcoal/40 group-open:hidden">+</span>
        <span className="float-right text-charcoal/40 hidden group-open:inline">−</span>
      </summary>
      <p className="mt-3 text-sm text-charcoal/70">{children}</p>
    </details>
  );
}
