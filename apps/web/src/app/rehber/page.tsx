/**
 * /rehber — Blog hub sayfası.
 * Tüm makaleleri kart olarak listeler. Kategori filtreleme sonra eklenebilir.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ARTICLES } from "./articles";

export const metadata: Metadata = {
  title: "Rehber & Blog — QR Sticker, Pet ID, KVKK Uzman Yazıları",
  description:
    "Tagora rehberi: QR sticker teknolojisi, evcil hayvan kimliği, araç güvenliği, KVKK ve gizlilik hakkında uzman görüşleri. Anonim iletişimin geleceği için pratik bilgiler.",
  alternates: { canonical: "/rehber" },
  openGraph: {
    title: "Tagora Rehber & Blog",
    description:
      "QR sticker, pet ID, araç iletişimi ve gizlilik hakkında uzman rehberler.",
    url: "/rehber",
  },
};

export default function RehberHubPage() {
  const sorted = [...ARTICLES].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-navy-50/20 to-white">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <div className="mb-12 text-center">
          <span className="chip mb-4 inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Rehber & Blog
          </span>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            Uzman rehberi ve pratik bilgiler
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-charcoal/70">
            QR sticker teknolojisi, evcil hayvan kimliği, araç güvenliği ve
            KVKK — Tagora ekibinden pratik uzman rehberleri.
          </p>
        </div>

        {/* Article grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((a) => (
            <Link
              key={a.slug}
              href={`/rehber/${a.slug}` as never}
              className="group flex flex-col rounded-2xl border border-navy/10 bg-white p-6 shadow-sm transition hover:border-accent/30 hover:shadow-lg"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy/5 text-2xl transition group-hover:bg-accent/20">
                  {a.hero.emoji}
                </div>
                <span className="rounded-full bg-navy/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy">
                  {a.hero.badge}
                </span>
              </div>
              <h2 className="mb-2 line-clamp-2 font-bold text-navy leading-snug">
                {a.title}
              </h2>
              <p className="mb-4 line-clamp-3 flex-1 text-sm text-charcoal/70 leading-relaxed">
                {a.excerpt}
              </p>
              <div className="flex items-center justify-between text-xs text-charcoal/50">
                <span>
                  {new Date(a.publishedAt).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span>{a.readMin} dk okuma</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <section className="mt-20 rounded-3xl bg-gradient-to-br from-navy to-navy-800 p-10 text-center text-white sm:p-16">
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
            Sıradaki sen ol
          </h2>
          <p className="mb-6 text-white/80 max-w-xl mx-auto">
            Tagora ile ilk kez tanıştıysan, önce nasıl çalıştığına bak veya
            hemen sipariş ver.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={"/kullanim" as never} className="btn-accent inline-block">
              Kullanım Alanlarını İncele
            </Link>
            <Link
              href="/shop"
              className="rounded-lg border border-white/30 bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10"
            >
              Sipariş Ver
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
