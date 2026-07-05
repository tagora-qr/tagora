import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 pb-24 sm:pb-6">
      {/* Top nav */}
      <header className="flex items-center justify-between border-b border-navy/10 py-4">
        <Link href="/dashboard">
          <Logo />
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/dashboard/profile" className="btn-ghost">
            {user.email}
          </Link>
        </nav>
      </header>

      {/* Tab nav (desktop) */}
      <nav className="hidden border-b border-navy/10 sm:flex sm:gap-2 sm:py-3">
        <Link
          href="/dashboard"
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-navy/70 hover:bg-navy/5 hover:text-navy"
        >
          Stickerlarım
        </Link>
        <Link
          href="/dashboard/inbox"
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-navy/70 hover:bg-navy/5 hover:text-navy"
        >
          Inbox
        </Link>
        <Link
          href={"/dashboard/orders" as never}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-navy/70 hover:bg-navy/5 hover:text-navy"
        >
          Siparişlerim
        </Link>
      </nav>

      <main className="flex-1 py-6">{children}</main>

      {/* Bottom tabs (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-navy/10 bg-white/95 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-lg justify-around py-2">
          <Link
            href="/dashboard"
            className="flex flex-1 flex-col items-center gap-0.5 py-1 text-xs text-navy/70 hover:text-navy"
          >
            <span className="text-xl" aria-hidden="true">🏷️</span>
            Stickers
          </Link>
          <Link
            href="/dashboard/inbox"
            className="flex flex-1 flex-col items-center gap-0.5 py-1 text-xs text-navy/70 hover:text-navy"
          >
            <span className="text-xl" aria-hidden="true">💬</span>
            Inbox
          </Link>
          <Link
            href={"/dashboard/orders" as never}
            className="flex flex-1 flex-col items-center gap-0.5 py-1 text-xs text-navy/70 hover:text-navy"
          >
            <span className="text-xl" aria-hidden="true">🛒</span>
            Siparişler
          </Link>
          <Link
            href="/dashboard/profile"
            className="flex flex-1 flex-col items-center gap-0.5 py-1 text-xs text-navy/70 hover:text-navy"
          >
            <span className="text-xl" aria-hidden="true">👤</span>
            Profil
          </Link>
        </div>
      </nav>
    </div>
  );
}
