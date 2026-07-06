/**
 * /rehber/[slug] — Makale detay sayfası
 *
 * Structured blocks'ı render eder, Article + BreadcrumbList JSON-LD ekler,
 * ilgili makale linkleri gösterir.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { ARTICLES, type Block } from "../articles";
import { getBaseUrl } from "@/lib/base-url";

type Params = Promise<{ slug: string }>;

const BASE_URL = getBaseUrl();

export async function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) return { title: "Bulunamadı · Tagora" };

  return {
    title: article.title,
    description: article.description,
    keywords: article.keywords,
    alternates: { canonical: `/rehber/${slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      url: `/rehber/${slug}`,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) notFound();

  const related = article.related
    ? article.related
        .map((s) => ARTICLES.find((a) => a.slug === s))
        .filter(Boolean)
    : [];

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    author: {
      "@type": "Organization",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Tagora",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/opengraph-image`,
      },
    },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/rehber/${article.slug}`,
    },
    keywords: article.keywords.join(", "),
    articleSection: article.category,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Anasayfa", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Rehber", item: `${BASE_URL}/rehber` },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: `${BASE_URL}/rehber/${article.slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <header className="border-b border-navy/5">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="flex items-center gap-2">
            <Link href={"/rehber" as never} className="btn-ghost text-sm">
              ← Rehber
            </Link>
            <Link href="/shop" className="btn-primary text-sm">
              Sipariş Ver
            </Link>
          </nav>
        </div>
      </header>

      {/* Breadcrumb */}
      <nav className="mx-auto max-w-3xl px-4 pt-6 text-xs text-charcoal/50">
        <ol className="flex items-center gap-1">
          <li>
            <Link href="/" className="hover:text-navy">
              Anasayfa
            </Link>
          </li>
          <li>›</li>
          <li>
            <Link href={"/rehber" as never} className="hover:text-navy">
              Rehber
            </Link>
          </li>
          <li>›</li>
          <li className="line-clamp-1 max-w-[240px] text-charcoal font-medium">
            {article.title}
          </li>
        </ol>
      </nav>

      {/* Article hero */}
      <article className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <header className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-full bg-navy/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-navy">
              {article.hero.badge}
            </span>
            <span className="text-xs text-charcoal/50">
              {article.readMin} dk okuma
            </span>
          </div>
          <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-navy sm:text-4xl">
            {article.title}
          </h1>
          <p className="text-lg text-charcoal/70 leading-relaxed">
            {article.excerpt}
          </p>
          <div className="mt-6 flex items-center gap-3 text-xs text-charcoal/50">
            <span>
              📅{" "}
              {new Date(article.publishedAt).toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span>·</span>
            <span>✍️ {article.author}</span>
          </div>
        </header>

        {/* Content blocks */}
        <div className="article-content">
          {article.content.map((block, i) => (
            <BlockRenderer key={i} block={block} />
          ))}
        </div>
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-navy/[0.02] py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="mb-8 text-center text-2xl font-bold text-navy">
              İlgili rehberler
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {related.map(
                (r) =>
                  r && (
                    <Link
                      key={r.slug}
                      href={`/rehber/${r.slug}` as never}
                      className="group rounded-2xl border border-navy/10 bg-white p-6 shadow-sm transition hover:border-accent/30 hover:shadow-md"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <div className="text-2xl">{r.hero.emoji}</div>
                        <span className="rounded-full bg-navy/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy">
                          {r.hero.badge}
                        </span>
                      </div>
                      <h3 className="mb-2 font-bold text-navy line-clamp-2 leading-snug">
                        {r.title}
                      </h3>
                      <p className="text-sm text-charcoal/70 line-clamp-2">
                        {r.excerpt}
                      </p>
                    </Link>
                  ),
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-gradient-to-br from-navy to-navy-800 py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
            Tagora'yı deneme zamanı
          </h2>
          <p className="mb-8 text-white/80">
            Anonim iletişim için akıllı QR sticker — 49₺'den başlıyor, Türkiye
            içi 2-4 gün kargo.
          </p>
          <Link href="/shop" className="btn-accent inline-block">
            Sipariş Ver
          </Link>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// Block renderer — structured content
// ============================================================
function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case "h2":
      return (
        <h2
          id={block.id}
          className="mt-10 mb-4 text-2xl font-bold text-navy scroll-mt-24"
        >
          {block.text}
        </h2>
      );
    case "h3":
      return (
        <h3
          id={block.id}
          className="mt-6 mb-3 text-xl font-bold text-navy scroll-mt-24"
        >
          {block.text}
        </h3>
      );
    case "p":
      return (
        <p className="my-4 text-base leading-relaxed text-charcoal/85">
          {block.text}
        </p>
      );
    case "list": {
      const ListTag = block.ordered ? "ol" : "ul";
      return (
        <ListTag
          className={`my-4 space-y-2 pl-6 text-base text-charcoal/85 ${
            block.ordered ? "list-decimal" : "list-disc"
          }`}
        >
          {block.items.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ListTag>
      );
    }
    case "quote":
      return (
        <blockquote className="my-6 border-l-4 border-accent bg-navy/[0.02] py-4 pl-6 pr-4 italic text-charcoal/80">
          <p className="mb-2">"{block.text}"</p>
          {block.author && (
            <p className="text-sm not-italic text-charcoal/60">— {block.author}</p>
          )}
        </blockquote>
      );
    case "callout": {
      const variantStyles: Record<string, string> = {
        info: "bg-blue-50 border-blue-200 text-blue-900",
        warning: "bg-amber-50 border-amber-200 text-amber-900",
        success: "bg-emerald-50 border-emerald-200 text-emerald-900",
      };
      const style = variantStyles[block.variant ?? "info"];
      return (
        <div className={`my-6 rounded-2xl border p-4 sm:p-5 ${style}`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none">{block.icon}</span>
            <p className="flex-1 leading-relaxed text-sm sm:text-base">
              {block.body}
            </p>
          </div>
        </div>
      );
    }
    case "table":
      return (
        <div className="my-6 overflow-x-auto rounded-2xl border border-navy/10">
          <table className="w-full text-sm">
            <thead className="bg-navy/[0.03]">
              <tr>
                {block.headers.map((h, i) => (
                  <th
                    key={i}
                    className="border-b border-navy/10 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-charcoal"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className="px-4 py-3 text-charcoal/85 first:font-medium first:text-navy"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}
