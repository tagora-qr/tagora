/**
 * Landing — tagora.com.tr/
 *
 * Hero + nasıl çalışır + use-case'ler + waitlist + privacy footer.
 */
import Link from "next/link";
import { Logo } from "@/components/logo";
import { TAGORA } from "@tagora/shared";
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
      <SiteHeader />

      {/* HERO */}
      <section className="bg-gradient-to-b from-navy-50 via-white to-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
          <div className="grid gap-10 sm:grid-cols-2 sm:items-center">
            <div className="animate-fade-in">
              <span className="chip mb-5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Privacy-First · KVKK Uyumlu · AB Veri Yerleşimi
              </span>
              <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight text-navy sm:text-5xl">
                Telefonunu paylaşma.
                <br />
                <span className="bg-gradient-to-r from-navy to-navy-600 bg-clip-text text-transparent">
                  Tagora yapıştır.
                </span>
              </h1>
              <p className="mb-7 text-lg text-charcoal/70">
                {TAGORA.tagline.tr} Aracın, kapın, evcil hayvanın için anonim
                iletişim — kimliğin sende kalsın.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="#waitlist" className="btn-primary">
                  Bekleme Listesine Katıl
                </Link>
                <Link href="#how" className="btn-secondary">
                  Nasıl Çalışır
                </Link>
              </div>
            </div>

            {/* Hero görseli — sticker preview */}
            <div className="relative flex items-center justify-center">
              <div className="aspect-square w-full max-w-sm rotate-3 rounded-3xl bg-gradient-to-br from-navy to-navy-800 p-12 shadow-2xl">
                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white">
                  <FakeQR />
                </div>
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-2 text-xs font-bold text-navy shadow-lg">
                tagora.link/s/k7n2pXyZ4A
              </div>
            </div>
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
              href="/kullanim"
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

      {/* WAITLIST */}
      <section id="waitlist" className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-3xl border border-navy/10 bg-white p-10 shadow-sm">
          <h2 className="mb-2 text-center text-3xl font-bold text-navy">
            İlk 1.000 kişiden biri ol
          </h2>
          <p className="mb-8 text-center text-charcoal/60">
            Lansman duyurusunu önce sana yollayalım. Erken kayıtlara özel
            indirim.
          </p>
          <WaitlistForm />
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function SiteHeader() {
  return (
    <header className="border-b border-navy/5">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost">
            Giriş
          </Link>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-navy/10 bg-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2">
            <Logo variant="light" />
            <p className="mt-3 text-sm text-white/70">
              {TAGORA.longTagline.tr}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
                KVKK Uyumlu
              </span>
              <span className="rounded-full bg-white/10 border border-white/15 px-2.5 py-1 text-[10px] font-semibold text-white/80">
                AB Veri Yerleşimi
              </span>
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Ürün</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="#how" className="hover:text-white">Nasıl Çalışır</Link></li>
              <li><Link href="/shop" className="hover:text-white">Sticker Sipariş</Link></li>
              <li><Link href="/kullanim" className="hover:text-white">Kullanım Alanları</Link></li>
              <li><Link href={"/rehber" as never} className="hover:text-white">Rehber & Blog</Link></li>
              <li><Link href="#sss" className="hover:text-white">SSS</Link></li>
              <li><Link href="/login" className="hover:text-white">Giriş</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Kullanım Alanları</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href={"/kullanim/arac" as never} className="hover:text-white">🚗 Araba</Link></li>
              <li><Link href={"/kullanim/kapi" as never} className="hover:text-white">🚪 Kapı</Link></li>
              <li><Link href={"/kullanim/pet" as never} className="hover:text-white">🐕 Evcil Hayvan</Link></li>
              <li><Link href={"/kullanim/bagaj" as never} className="hover:text-white">🧳 Bagaj</Link></li>
              <li><Link href={"/kullanim/bisiklet" as never} className="hover:text-white">🚴 Bisiklet</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Yasal</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/kvkk" className="hover:text-white">KVKK Aydınlatma</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Gizlilik Politikası</Link></li>
              <li><Link href="/terms" className="hover:text-white">Kullanım Şartları</Link></li>
              <li><Link href="/cookies" className="hover:text-white">Çerez Politikası</Link></li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          © 2026 Tagora Teknoloji · Privacy-First QR Sticker Platform · Frankfurt sunucularda barındırılır
        </p>
      </div>
    </footer>
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
