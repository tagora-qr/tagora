/**
 * Admin panel layout — sidebar navigation + auth verified header.
 * Middleware zaten is_admin kontrolü yapıyor; burada UI shell.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Admin · Tagora",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Overview", icon: "📊" },
  { href: "/admin/orders", label: "Siparişler", icon: "🛒" },
  { href: "/admin/coupons", label: "Kuponlar", icon: "🎟️" },
  { href: "/admin/business-leads", label: "B2B Talepler", icon: "💼" },
  { href: "/admin/stickers", label: "Stickerlar", icon: "🏷️" },
  { href: "/admin/batches", label: "Batch'ler", icon: "📦" },
  { href: "/admin/conversations", label: "Konuşmalar", icon: "💬" },
  { href: "/admin/users", label: "Kullanıcılar", icon: "👥" },
  { href: "/admin/waitlist", label: "Bekleme Listesi", icon: "📬" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bgSubtle">
      <header className="border-b border-navy/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Logo />
            </Link>
            <span className="rounded-full bg-navy px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-accent">
              Admin
            </span>
          </div>
          <Link href="/dashboard" className="text-sm text-charcoal/60 hover:text-navy">
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-6">
        <nav className="w-52 shrink-0">
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href as never}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-charcoal hover:bg-navy/5"
                >
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
