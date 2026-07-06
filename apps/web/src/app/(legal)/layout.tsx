/**
 * Yasal metinler için ortak layout — SiteHeader + prose reader + SiteFooter.
 */
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

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

      <SiteFooter />
    </div>
  );
}
