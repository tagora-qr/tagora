/**
 * Landing — tagora.app/
 *
 * Hero + nasıl çalışır + use-case'ler + waitlist + privacy footer.
 */
import Link from "next/link";
import { Logo } from "@/components/logo";
import { USE_CASE_LABELS, TAGORA } from "@tagora/shared";
import { WaitlistForm } from "./waitlist-form";

export const metadata = {
  title: "Tagora — Anonim İletişim için Akıllı QR Sticker",
  description:
    "Telefonunu cama yazma. Tagora yapıştır, anonim ulaşılabilir kal. KVKK uyumlu.",
};

export default function HomePage() {
  return (
    <>
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
                tagora.app/s/k7n2pXyZ4A
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(USE_CASE_LABELS) as Array<keyof typeof USE_CASE_LABELS>)
              .filter((k) => k !== "other")
              .map((k) => (
                <div
                  key={k}
                  className="rounded-2xl border border-navy/10 bg-white p-5 text-center"
                >
                  <div className="mb-3 text-4xl" aria-hidden="true">
                    {USE_CASE_LABELS[k].emoji}
                  </div>
                  <h4 className="font-semibold text-navy">
                    {USE_CASE_LABELS[k].tr}
                  </h4>
                </div>
              ))}
          </div>
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
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <Logo variant="light" />
            <p className="mt-3 text-sm text-white/70">
              {TAGORA.longTagline.tr}
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Ürün</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="#how">Nasıl Çalışır</Link></li>
              <li><Link href="/shop">Sticker Sipariş</Link></li>
              <li><Link href="/login">Giriş</Link></li>
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
          © 2026 Tagora Teknoloji · Privacy-First QR Sticker Platform
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
