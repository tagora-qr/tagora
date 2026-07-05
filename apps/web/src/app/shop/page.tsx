/**
 * Shop — /shop
 *
 * Sprint 4/5: iyzico checkout + sticker paketleri geldiğinde burası dolacak.
 * Şimdilik "Yakında" placeholder — waitlist'e yönlendir.
 */
import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Sticker Sipariş — Yakında · Tagora",
  description:
    "Tagora sticker'ları için sipariş sistemi hazırlık aşamasında. Bekleme listesine katılıp ilk grupta yer alabilirsin.",
};

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-50 via-white to-white">
      <header className="border-b border-navy/5">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/">
            <Logo />
          </Link>
          <Link href="/" className="btn-ghost text-sm">
            ← Anasayfa
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-24 text-center">
        <span className="chip mb-6 inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Yakında
        </span>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-navy sm:text-5xl">
          Sticker mağazası hazırlanıyor
        </h1>
        <p className="mb-8 text-lg text-charcoal/70">
          İlk sticker partisi üretim aşamasında. Bekleme listesine katılırsan
          lansman gününde erken erişim ve indirim yollayacağız.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/#waitlist" className="btn-primary">
            Bekleme Listesine Katıl
          </Link>
          <Link href="/#how" className="btn-secondary">
            Nasıl Çalışır
          </Link>
        </div>
      </main>
    </div>
  );
}
