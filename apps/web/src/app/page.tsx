/**
 * Landing — tagora.com.tr/
 *
 * Hero + nasıl çalışır + use-case'ler + waitlist + privacy footer.
 */
import Link from "next/link";
import { TAGORA } from "@tagora/shared";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WaitlistForm } from "./waitlist-form";

// SEO: use case link'leri — kullanım detay sayfalarına iç link
const USE_CASE_LINKS = [
  { slug: "arac", emoji: "🚗", label: "Araba" },
  { slug: "kapi", emoji: "🚪", label: "Kapı & Zil" },
  { slug: "pet", emoji: "🐕", label: "Evcil Hayvan" },
  { slug: "bagaj", emoji: "🧳", label: "Bagaj" },
  { slug: "bisiklet", emoji: "🚴", label: "Bisiklet" },
];

// SEO: FAQ schema markup için homepage FAQ
const FAQ_ITEMS = [
  {
    q: "Tagora QR sticker nedir?",
    a: "Tagora, arabaya, kapıya, evcil hayvanın tasmasına yapıştırdığın akıllı bir QR koddur. Biri kodu taradığında telefonunu paylaşmadan seninle anonim mesajlaşabilir. Yanlış park, kaza, kayıp bagaj, kaybolan pet gibi senaryolar için ideal.",
  },
  {
    q: "Telefon numaramı paylaşmama gerek yok mu?",
    a: "Yok. Tagora'nın tüm noktası bu — telefonun, adresin, kimliğin hiçbir zaman karşı tarafa gitmez. QR taranınca anonim chat açılır, sen istersen cevap verirsin.",
  },
  {
    q: "Tagora KVKK uyumlu mu, verilerim güvende mi?",
    a: "Evet. Tüm veriler Frankfurt'taki AB sunucularında saklanır. KVKK Md.11 self-service — hesap ayarlarından tüm verini bir tıkla indirebilir veya sildirebilirsin. Mesajlar 90 gün sonra otomatik silinir.",
  },
  {
    q: "Sticker ne kadar dayanıklı, dış mekan için uygun mu?",
    a: "Endüstriyel akrilik yapıştırıcı + UV dayanıklı baskı. Yağmur, güneş, kış — 5+ yıl solmadan durur. Araç için ters-baskı (inside window decal) varyantı 8+ yıl dayanır.",
  },
  {
    q: "Sticker'ı çalan biri beni takip edebilir mi?",
    a: "Hayır. QR sadece anonim mesajlaşma başlatır — konum, kimlik, ev adresi hiç paylaşılmaz. Ayrıca sen her mesajı görüp cevaplarsın, birisini şüpheli görürsen engelleyebilirsin.",
  },
  {
    q: "Kaç paras, kargo dahil mi?",
    a: "Tekli sticker 49₺, 5'li paket 149₺, 10'lu 249₺, 25'li iş paketi 499₺. Türkiye içi 15₺ kargo, 2-4 gün teslim. KDV dahil.",
  },
];

export const metadata = {
  title: "Tagora — Anonim İletişim için Akıllı QR Sticker",
  description:
    "Telefonunu cama yazma. Tagora yapıştır, anonim ulaşılabilir kal. KVKK uyumlu.",
};

// SEO: FAQPage JSON-LD — homepage FAQ'ı Google için structured data
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <SiteHeader />{/* Homepage: TAGORA long tagline'ı footer için tut */}

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-50/70 via-white to-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
          <div className="grid gap-10 sm:grid-cols-2 sm:items-center">
            <div className="animate-fade-in">
              <span className="chip mb-5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                Yayında · 49₺'den başlar · 2-4 gün kargo
              </span>
              <h1 className="mb-4 text-4xl font-bold leading-[1.1] tracking-tight text-navy sm:text-5xl md:text-[3.5rem]">
                Cama telefon yazmayı{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-navy to-navy-600 bg-clip-text text-transparent">
                    bitiriyoruz.
                  </span>
                  <span className="absolute bottom-1 left-0 -z-0 h-3 w-full rounded-full bg-accent/40" aria-hidden="true" />
                </span>
              </h1>
              <p className="mb-7 text-lg leading-relaxed text-charcoal/75">
                Aracına, kapına, tasmaya yapıştır. Biri QR'ı tarayınca seninle{" "}
                <strong className="text-navy">anonim mesajlaşır</strong> —
                telefonun asla paylaşılmaz.
              </p>
              <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/shop" className="btn-primary text-center">
                  Sipariş Ver — 49₺'den →
                </Link>
                <Link href="#how" className="btn-secondary text-center">
                  Nasıl Çalışır
                </Link>
              </div>

              {/* Sosyal kanıt satırı */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-charcoal/60">
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span> KVKK uyumlu
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span> AB sunucular
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span> Uçtan uca şifreli
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span> Türkiye'de tasarım
                </span>
              </div>
            </div>

            {/* Hero görseli — sticker preview + telefon bildirimi */}
            <div className="relative flex items-center justify-center">
              <div className="aspect-square w-full max-w-sm rotate-3 rounded-3xl bg-gradient-to-br from-navy to-navy-800 p-12 shadow-2xl">
                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white">
                  <FakeQR />
                </div>
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-2 text-xs font-bold text-navy shadow-lg">
                tagora.link/s/k7n2pXyZ4A
              </div>

              {/* Simüle push bildirimi — sticker'ın üzerine "yeni mesaj" */}
              <div className="absolute -right-2 top-6 hidden animate-slide-up rounded-2xl border border-navy/10 bg-white px-4 py-3 shadow-2xl sm:block sm:-right-6 md:right-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-lg">
                    <span className="text-accent">T</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal/50">
                      Yeni mesaj · 07:12
                    </p>
                    <p className="text-xs font-semibold text-navy">
                      Peluş bende, Şişli'deyim
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust markers — hero altında */}
      <section className="border-y border-navy/5 bg-navy/[0.02]">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="grid gap-6 sm:grid-cols-4">
            <TrustMarker
              icon="🇹🇷"
              title="KVKK Uyumlu"
              body="Türk yasal çerçevesinde tasarlandı, self-service veri hakları."
            />
            <TrustMarker
              icon="🇪🇺"
              title="AB Sunucular"
              body="Tüm veriler Frankfurt'ta, yurt dışı transferi yok."
            />
            <TrustMarker
              icon="🔒"
              title="Kimliğin Gizli"
              body="Telefonun, adresin, adın — hiçbiri karşı tarafa gitmez."
            />
            <TrustMarker
              icon="⚡"
              title="Anlık Chat"
              body="Biri QR'ı tarayınca telefonuna push, hemen cevaplar."
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold text-navy">
          Üç adımda anonim iletişim
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              n: "1",
              title: "Sipariş ver",
              body: "Sticker tasarımını seç, kargoyla gelsin.",
              emoji: "📦",
            },
            {
              n: "2",
              title: "Yapıştır & eşle",
              body: "QR'ı mobil app ile tara, hesabınla eşle.",
              emoji: "✨",
            },
            {
              n: "3",
              title: "Anonim ulaşılabil",
              body: "Biri QR'ı tarayınca push gelir, chat açılır.",
              emoji: "💬",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-navy/10 bg-white p-6 transition hover:border-navy/20 hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-2xl">
                {s.emoji}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-navy">
                {s.n}. {s.title}
              </h3>
              <p className="text-sm text-charcoal/70">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* USE CASES */}
      <section className="bg-navy/[0.02] py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-2 text-center text-3xl font-bold text-navy">
            Tek hesap, sonsuz kullanım
          </h2>
          <p className="mb-12 text-center text-charcoal/60">
            Araç sadece başlangıç — Tagora her objen için.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {USE_CASE_LINKS.map((uc) => (
              <Link
                key={uc.slug}
                href={`/kullanim/${uc.slug}` as never}
                className="group rounded-2xl border border-navy/10 bg-white p-5 text-center transition hover:border-accent/40 hover:shadow-md"
              >
                <div className="mb-3 text-4xl transition group-hover:scale-110" aria-hidden="true">
                  {uc.emoji}
                </div>
                <h3 className="font-semibold text-navy">{uc.label}</h3>
                <p className="mt-1 text-xs text-accent group-hover:underline">
                  Detay →
                </p>
              </Link>
            ))}
          </div>
          <p className="mt-8 text-center">
            <Link
              href={"/kullanim" as never}
              className="text-sm font-medium text-navy underline hover:text-accent"
            >
              Tüm kullanım alanları ve senaryolar →
            </Link>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="sss" className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="mb-4 text-center text-3xl font-bold text-navy">
          Sık sorulan sorular
        </h2>
        <p className="mb-12 text-center text-charcoal/60">
          Tagora hakkında merak edilenler
        </p>
        <div className="space-y-3">
          {FAQ_ITEMS.map((f, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-navy/10 bg-white p-5 open:border-navy/30 open:shadow-sm"
            >
              <summary className="cursor-pointer list-none font-semibold text-navy group-open:mb-3">
                <span className="mr-2 text-accent">›</span>
                {f.q}
              </summary>
              <p className="pl-4 text-sm text-charcoal/75 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* PRIVACY */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="rounded-3xl bg-gradient-to-br from-navy to-navy-800 p-10 text-white sm:p-16">
          <h2 className="mb-4 text-3xl font-bold">
            Privacy by Design — laftan ibaret değil.
          </h2>
          <ul className="grid gap-3 text-base text-white/85 sm:grid-cols-2">
            <li>✓ Telefonun cama yazılmıyor — kimse görmüyor</li>
            <li>✓ Tüm veri AB&apos;de (Frankfurt)</li>
            <li>✓ Mesaj 90 gün sonra otomatik silinir</li>
            <li>✓ KVKK Md.11 self-service: tek tıkla verim indirme</li>
            <li>✓ Scanner cihaz bilgisi 24 saatte anonimleşir</li>
            <li>✓ End-to-end şifreli chat (v1)</li>
          </ul>
        </div>
      </section>

      {/* SATIŞ CTA — ana */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-3xl bg-gradient-to-br from-accent/90 to-accent p-10 text-navy shadow-lg sm:p-14">
          <div className="text-center">
            <h2 className="mb-3 text-3xl font-bold sm:text-4xl">
              Bir sticker 49₺.
              <br />
              <span className="text-navy/80">Sonrası sonsuz iletişim.</span>
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-navy/70">
              Türkiye içi 2-4 gün kargo. KDV dahil. iyzico güvenli ödeme.
              Kart bilgin bize gelmez.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/shop"
                className="rounded-xl bg-navy px-8 py-4 font-bold text-accent shadow-md transition hover:bg-navy/90"
              >
                Paketleri Gör →
              </Link>
              <Link
                href={"/business" as never}
                className="rounded-xl border border-navy/30 bg-white/50 px-8 py-4 font-semibold text-navy transition hover:bg-white"
              >
                B2B için Tıkla
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WAITLIST — ikincil */}
      <section id="waitlist" className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-3xl border border-navy/10 bg-white p-10 shadow-sm">
          <div className="mb-4 flex items-center justify-center">
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
              📮 Haberdar olmak istersen
            </span>
          </div>
          <h2 className="mb-2 text-center text-2xl font-bold text-navy sm:text-3xl">
            Yeni özellikleri ilk sen dene
          </h2>
          <p className="mb-8 text-center text-sm text-charcoal/60">
            Yeni sticker tasarımları, use case'ler, kampanyalar — email listesine
            katıl, spam yok.
          </p>
          <WaitlistForm />
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function TrustMarker({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 text-2xl">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-navy">{title}</p>
        <p className="mt-0.5 text-xs text-charcoal/60 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function FakeQR() {
  // Estetik fake QR — gerçek lansmanda Tagora logo QR ile değiştirilecek
  return (
    <svg viewBox="0 0 100 100" className="h-48 w-48 sm:h-56 sm:w-56" aria-hidden="true">
      {Array.from({ length: 81 }).map((_, i) => {
        const x = (i % 9) * 11 + 4;
        const y = Math.floor(i / 9) * 11 + 4;
        // Pseudo-random: i*97 modulo 7 < 3 → siyah
        const isDark = ((i * 97) % 7) < 3 || (i % 11) === 0;
        return isDark ? <rect key={i} x={x} y={y} width="9" height="9" rx="1" fill="#0F1B3D" /> : null;
      })}
      {/* 3 köşe locator */}
      {[[4, 4], [74, 4], [4, 74]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width="22" height="22" fill="#0F1B3D" rx="3" />
          <rect x={(x as number) + 4} y={(y as number) + 4} width="14" height="14" fill="#fff" rx="2" />
          <rect x={(x as number) + 7} y={(y as number) + 7} width="8" height="8" fill="#0F1B3D" rx="1" />
        </g>
      ))}
    </svg>
  );
}
