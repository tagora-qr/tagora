/**
 * Site Header — Public sayfalar için ortak üst navigasyon.
 *
 * Kullanım: homepage, kullanım, rehber, shop, legal sayfalarında.
 * Dashboard/admin kendi header'larını kullanır.
 */
import Link from "next/link";
import { Logo } from "@/components/logo";

interface SiteHeaderProps {
  /** Menü linklerini gizle (checkout/legal gibi minimal sayfalar için) */
  minimal?: boolean;
}

const NAV_LINKS = [
  { href: "/kullanim" as const, label: "Kullanım" },
  { href: "/rehber" as const, label: "Rehber" },
  { href: "/business" as const, label: "Business" },
  { href: "/shop" as const, label: "Sipariş" },
] as const;

export function SiteHeader({ minimal = false }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-navy/5 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
        <Link href="/" className="flex-shrink-0" aria-label="Tagora ana sayfa">
          <Logo />
        </Link>

        {!minimal && (
          <nav className="flex items-center gap-1 sm:gap-4" aria-label="Ana navigasyon">
            {/* Desktop menü — sm ve üstünde tam */}
            <div className="hidden items-center gap-1 sm:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href as never}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-charcoal/70 transition hover:bg-navy/5 hover:text-navy"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Mobile: Sipariş direkt CTA + Giriş */}
            <Link
              href={"/shop" as never}
              className="rounded-lg bg-accent/20 border border-accent/40 px-3 py-1.5 text-xs font-semibold text-navy transition hover:bg-accent hover:border-accent sm:hidden"
            >
              Sipariş
            </Link>

            <Link
              href="/login"
              className="rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy transition hover:bg-navy hover:text-accent sm:text-sm"
            >
              Giriş
            </Link>
          </nav>
        )}

        {minimal && (
          <Link
            href="/"
            className="text-sm text-charcoal/60 hover:text-navy"
          >
            ← Anasayfa
          </Link>
        )}
      </div>
    </header>
  );
}
