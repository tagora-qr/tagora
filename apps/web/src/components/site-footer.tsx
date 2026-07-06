/**
 * Site Footer — Public sayfalar için ortak alt bölüm.
 *
 * İçerikler: Marka + tagline + sosyal medya + 3 sütun (ürün / kullanım / yasal).
 * Homepage'de olduğu gibi tüm public sayfalarda kullanılır.
 */
import Link from "next/link";
import { Logo } from "@/components/logo";
import { TAGORA } from "@tagora/shared";

const YEAR = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="border-t border-navy/10 bg-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Marka + sosyal */}
          <div className="sm:col-span-2">
            <Logo variant="light" />
            <p className="mt-3 text-sm text-white/70">{TAGORA.longTagline.tr}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
                KVKK Uyumlu
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/80">
                Uçtan Uca Şifreli
              </span>
            </div>

            {/* Sosyal medya */}
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://www.instagram.com/tagora.qr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Tagora Instagram — @tagora.qr"
                className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 transition hover:border-accent hover:bg-accent"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://x.com/tagoraQR"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Tagora X (Twitter) — @tagoraQR"
                className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 transition hover:border-accent hover:bg-accent"
              >
                <XIcon />
              </a>
              <a
                href="mailto:destek@tagora.com.tr"
                aria-label="Tagora destek e-posta"
                className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 transition hover:border-accent hover:bg-accent"
              >
                <MailIcon />
              </a>
            </div>
          </div>

          {/* Ürün */}
          <div>
            <h4 className="mb-3 text-sm font-semibold">Ürün</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/" className="hover:text-white">
                  Anasayfa
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-white">
                  Sticker Sipariş
                </Link>
              </li>
              <li>
                <Link href={"/business" as never} className="hover:text-white">
                  Business (B2B)
                </Link>
              </li>
              <li>
                <Link href={"/rehber" as never} className="hover:text-white">
                  Rehber & Blog
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white">
                  Giriş
                </Link>
              </li>
            </ul>
          </div>

          {/* Kullanım Alanları */}
          <div>
            <h4 className="mb-3 text-sm font-semibold">Kullanım Alanları</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href={"/kullanim/arac" as never} className="hover:text-white">
                  🚗 Araba
                </Link>
              </li>
              <li>
                <Link href={"/kullanim/kapi" as never} className="hover:text-white">
                  🚪 Kapı
                </Link>
              </li>
              <li>
                <Link href={"/kullanim/pet" as never} className="hover:text-white">
                  🐕 Evcil Hayvan
                </Link>
              </li>
              <li>
                <Link href={"/kullanim/bagaj" as never} className="hover:text-white">
                  🧳 Bagaj
                </Link>
              </li>
              <li>
                <Link href={"/kullanim/bisiklet" as never} className="hover:text-white">
                  🚴 Bisiklet
                </Link>
              </li>
            </ul>
          </div>

          {/* Yasal */}
          <div>
            <h4 className="mb-3 text-sm font-semibold">Yasal</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/kvkk" className="hover:text-white">
                  KVKK Aydınlatma
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white">
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white">
                  Kullanım Şartları
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-white">
                  Çerez Politikası
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/40 space-y-1.5">
          <p>
            © {YEAR} <strong className="font-semibold text-white/60">DNS Bilgi Güvenliği Bilişim Teknoloji ve Danışmanlık Ltd. Şti.</strong> — Tagora markası
          </p>
          <p>
            23 Nisan Mah. Ata Bulvarı Gizemler 3 Plaza K:1 D:6 Nilüfer / BURSA · Nilüfer V.D. 3020908768 · MERSİS 0302090876800001
          </p>
          <p>KVKK Md.11 self-service — verilerini tek tıkla indir veya sildir</p>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// İkonlar — inline SVG (kütüphane import etmeye gerek yok)
// ============================================================
function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      className="text-white/80 transition group-hover:text-navy"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
        fill="currentColor"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      className="text-white/80 transition group-hover:text-navy"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"
        fill="currentColor"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-white/80 transition group-hover:text-navy"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" />
      <polyline points="22,6 12,13 2,6" stroke="currentColor" />
    </svg>
  );
}
