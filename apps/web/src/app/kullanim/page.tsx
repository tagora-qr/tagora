/**
 * /kullanim — Kullanım alanları hub.
 * Her use case için özel landing sayfasına link verir.
 * SEO: "Tagora hangi objeler için kullanılır" sorusuna cevap.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { USE_CASES } from "./use-cases";

export const metadata: Metadata = {
  title: "Kullanım Alanları — Araba, Kapı, Pet, Bagaj, Bisiklet",
  description:
    "Tagora akıllı QR sticker'ı araç, kapı, evcil hayvan, bagaj ve bisiklet için — her obje için gizlilik-önce iletişim. Nasıl çalıştığını ve kimlerin kullandığını incele.",
  alternates: { canonical: "/kullanim" },
  openGraph: {
    title: "Tagora Kullanım Alanları",
    description:
      "Araç, kapı, evcil hayvan, bagaj, bisiklet — her obje için akıllı QR iletişim.",
    url: "/kullanim",
  },
};

export default function KullanimHubPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-navy-50/30 to-white">
      <header className="border-b border-navy/5">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/shop" className="btn-ghost text-sm">
              Sipariş
            </Link>
            <Link href="/login" className="btn-ghost text-sm">
              Giriş
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <div className="mb-12 text-center">
          <span className="chip mb-4 inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Bir hesap · Sonsuz obje
          </span>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            Tagora'yı nerede kullanabilirsin?
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-charcoal/70">
            5 farklı senaryoda anonim iletişim — telefonunu vermeden ulaşılabilir kal.
            Her objen için ayrı sticker, hepsi tek uygulamada.
          </p>
        </div>

        {/* Use case grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(USE_CASES).map((uc) => (
            <Link
              key={uc.slug}
              href={`/kullanim/${uc.slug}` as never}
              className="group block rounded-2xl border border-navy/10 bg-white p-6 shadow-sm transition hover:border-accent/30 hover:shadow-lg"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy/5 text-3xl transition group-hover:bg-accent/20">
                  {uc.emoji}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-charcoal/50">
                    {uc.hero.badge}
                  </p>
                  <h2 className="mt-0.5 font-bold text-navy">
                    {uc.slug === "arac"
                      ? "Araba için"
                      : uc.slug === "kapi"
                      ? "Kapı için"
                      : uc.slug === "pet"
                      ? "Evcil hayvan için"
                      : uc.slug === "bagaj"
                      ? "Bagaj için"
                      : "Bisiklet için"}
                  </h2>
                </div>
              </div>
              <p className="mb-4 text-sm text-charcoal/70 line-clamp-3">
                {uc.hero.subheadline}
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-navy group-hover:text-accent">
                Detay →
              </span>
            </Link>
          ))}

          {/* Diğer / özel senaryolar için CTA */}
          <div className="rounded-2xl border border-dashed border-navy/15 bg-navy/[0.02] p-6 text-center">
            <div className="mb-3 text-4xl">💡</div>
            <h3 className="mb-2 font-bold text-navy">Başka bir fikrin mi var?</h3>
            <p className="mb-4 text-sm text-charcoal/60">
              Tagora bu 5 senaryodan başka her yerde çalışır. Anahtar, çanta, kamera, dron…
            </p>
            <Link href="/shop" className="btn-secondary text-sm">
              Sipariş Ver
            </Link>
          </div>
        </div>

        {/* Kısa neden Tagora bloğu */}
        <section className="mt-20 rounded-3xl bg-gradient-to-br from-navy to-navy-800 p-10 text-white sm:p-16">
          <h2 className="mb-6 text-2xl font-bold sm:text-3xl">
            Neden Tagora?
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <p className="mb-2 text-lg font-semibold text-accent">🔒 Gizli tutar</p>
              <p className="text-sm text-white/80">
                Telefonun, adresin, kimliğin — hiçbiri paylaşılmaz. Anonim chat açılır.
              </p>
            </div>
            <div>
              <p className="mb-2 text-lg font-semibold text-accent">🇪🇺 KVKK & AB</p>
              <p className="text-sm text-white/80">
                Tüm veri Frankfurt sunucularda, KVKK Md.11 self-service erişim.
              </p>
            </div>
            <div>
              <p className="mb-2 text-lg font-semibold text-accent">🌧️ Dayanıklı</p>
              <p className="text-sm text-white/80">
                Yağmur, güneş, kış — 5+ yıl solmayan endüstriyel kalite baskı.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
