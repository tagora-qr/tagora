/**
 * Yasal metinler için ortak layout — sadeleştirilmiş header,
 * uzun metin için Reader-optimized tipografi, sabit footer.
 */
import Link from "next/link";
import { Logo } from "@/components/logo";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-navy/10 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Logo />
          </Link>
          <Link href="/" className="text-sm text-navy/70 hover:text-navy">
            ← Ana sayfa
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <article className="prose prose-slate max-w-none">
          {children}
        </article>

        <nav className="mt-16 border-t border-navy/10 pt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-charcoal/50">
            Diğer yasal metinler
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <li>
              <Link href="/kvkk" className="text-navy hover:underline">
                KVKK Aydınlatma
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-navy hover:underline">
                Gizlilik Politikası
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-navy hover:underline">
                Kullanım Şartları
              </Link>
            </li>
            <li>
              <Link href="/cookies" className="text-navy hover:underline">
                Çerez Politikası
              </Link>
            </li>
          </ul>
        </nav>
      </main>

      <footer className="border-t border-navy/10 bg-navy/[0.02]">
        <div className="mx-auto max-w-3xl px-6 py-8 text-center text-xs text-charcoal/50">
          <p>
            © 2026 Tagora Teknoloji · Privacy-First QR Sticker Platform
          </p>
          <p className="mt-2">
            <a href="mailto:kvkk@tagora.com.tr" className="hover:text-navy hover:underline">
              kvkk@tagora.com.tr
            </a>
            {" · "}
            <a href="mailto:destek@tagora.com.tr" className="hover:text-navy hover:underline">
              destek@tagora.com.tr
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
