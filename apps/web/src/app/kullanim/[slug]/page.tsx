/**
 * /kullanim/[slug] — Kullanım alanı detay sayfası
 *
 * Dinamik route: her use case için özel içerik (araç, kapı, pet, bagaj, bisiklet).
 * SEO friendly: title, description, keywords, structured data (BreadcrumbList + FAQ),
 * H1 use case-specific, semantic HTML.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { USE_CASES, USE_CASE_SLUGS } from "../use-cases";

type Params = Promise<{ slug: string }>;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://tagora.com.tr";

export async function generateStaticParams() {
  return USE_CASE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const uc = USE_CASES[slug];
  if (!uc) return { title: "Bulunamadı · Tagora" };
  return {
    title: uc.metadata.title,
    description: uc.metadata.description,
    keywords: uc.metadata.keywords,
    alternates: { canonical: `/kullanim/${slug}` },
    openGraph: {
      title: uc.metadata.title,
      description: uc.metadata.description,
      url: `/kullanim/${slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: uc.metadata.title,
      description: uc.metadata.description,
    },
  };
}

export default async function UseCaseDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const uc = USE_CASES[slug];
  if (!uc) notFound();

  // JSON-LD: BreadcrumbList + FAQPage
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Anasayfa", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Kullanım Alanları", item: `${BASE_URL}/kullanim` },
      { "@type": "ListItem", position: 3, name: uc.hero.badge, item: `${BASE_URL}/kullanim/${uc.slug}` },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: uc.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <header className="border-b border-navy/5 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/kullanim" className="btn-ghost text-sm">
              ← Kullanım
            </Link>
            <Link href="/shop" className="btn-primary text-sm">
              Sipariş Ver
            </Link>
          </nav>
        </div>
      </header>

      {/* Breadcrumb (visible) */}
      <nav className="mx-auto max-w-5xl px-4 pt-6 text-xs text-charcoal/50">
        <ol className="flex items-center gap-1">
          <li>
            <Link href="/" className="hover:text-navy">
              Anasayfa
            </Link>
          </li>
          <li>›</li>
          <li>
            <Link href="/kullanim" className="hover:text-navy">
              Kullanım
            </Link>
          </li>
          <li>›</li>
          <li className="text-charcoal font-medium">{uc.hero.badge}</li>
        </ol>
      </nav>

      {/* HERO */}
      <section className="mx-auto max-w-5xl px-4 pt-10 pb-16 sm:pt-14">
        <div className="grid gap-10 sm:grid-cols-2 sm:items-center">
          <div>
            <span className="chip mb-5 inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {uc.hero.badge}
            </span>
            <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-navy sm:text-4xl">
              {uc.hero.h1}
            </h1>
            <p className="mb-7 text-lg text-charcoal/70">{uc.hero.subheadline}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/shop" className="btn-primary">
                {uc.cta.primary}
              </Link>
              <Link href="#nasil-calisir" className="btn-secondary">
                {uc.cta.secondary}
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="aspect-square w-full max-w-sm rotate-2 rounded-3xl bg-gradient-to-br from-navy to-navy-800 p-16 shadow-2xl">
              <div className="flex h-full items-center justify-center rounded-2xl bg-white text-9xl">
                {uc.emoji}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="bg-navy/[0.02] py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-12 text-center text-2xl font-bold text-navy sm:text-3xl">
            Neden Tagora — {uc.hero.badge.toLowerCase()} özelinde
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {uc.benefits.map((b, i) => (
              <div key={i} className="rounded-2xl border border-navy/10 bg-white p-6">
                <div className="mb-3 text-3xl">{b.icon}</div>
                <h3 className="mb-2 font-semibold text-navy">{b.title}</h3>
                <p className="text-sm text-charcoal/70">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="nasil-calisir" className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="mb-12 text-center text-2xl font-bold text-navy sm:text-3xl">
          Nasıl çalışır
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {uc.howItWorks.map((step, i) => (
            <div key={i} className="rounded-2xl border border-navy/10 bg-white p-6">
              <h3 className="mb-3 font-semibold text-navy">{step.title}</h3>
              <p className="text-sm text-charcoal/70">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SCENARIOS */}
      <section className="bg-navy/[0.02] py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-2 text-center text-2xl font-bold text-navy sm:text-3xl">
            Örnek senaryolar
          </h2>
          <p className="mb-12 text-center text-charcoal/60">
            Kullanıcılar Tagora'yı gerçek hayatta nasıl kullanıyor
          </p>
          <div className="space-y-6">
            {uc.scenarios.map((s, i) => (
              <div key={i} className="rounded-2xl border border-navy/10 bg-white p-6">
                <h3 className="mb-2 font-semibold text-navy">{s.title}</h3>
                <p className="text-sm text-charcoal/70 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="mb-12 text-center text-2xl font-bold text-navy sm:text-3xl">
          Sık sorulan sorular
        </h2>
        <div className="space-y-4">
          {uc.faq.map((f, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-navy/10 bg-white p-5 open:border-navy/30 open:shadow-sm"
            >
              <summary className="cursor-pointer list-none font-semibold text-navy group-open:mb-3">
                <span className="mr-2 text-accent">›</span>
                {f.q}
              </summary>
              <p className="text-sm text-charcoal/75 leading-relaxed pl-4">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA + related */}
      <section className="bg-gradient-to-br from-navy to-navy-800 py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
            {uc.hero.badge} için Tagora hazır. Sen?
          </h2>
          <p className="mb-8 text-white/80">
            Kargo dahil 49₺'den başlıyor. Türkiye içi 2-4 gün teslim.
          </p>
          <Link href="/shop" className="btn-accent inline-block">
            {uc.cta.primary}
          </Link>

          <div className="mt-16 border-t border-white/10 pt-10">
            <p className="mb-6 text-sm font-semibold uppercase tracking-wider text-white/60">
              Diğer kullanım alanları
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {Object.values(USE_CASES)
                .filter((u) => u.slug !== slug)
                .map((u) => (
                  <Link
                    key={u.slug}
                    href={`/kullanim/${u.slug}` as never}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
                  >
                    <span>{u.emoji}</span>
                    {u.hero.badge}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
