/**
 * Scanner sayfası — /s/[token]
 *
 * Ürünün diferansiyatör çekirdeği:
 * - QR'ı tarayan kişi bu sayfayı görür (App gerekmez)
 * - Sticker bağlamı (araç/kapı/pet) öğrenilir
 * - Anonim mesaj formu + hızlı şablonlar
 * - Mesaj gönderilince konuşma açılır, real-time chat aktif olur
 *
 * Bu Server Component sadece statik bağlamı yükler;
 * etkileşim ScannerClient (client component) tarafından yapılır.
 */

import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { USE_CASE_LABELS } from "@tagora/shared";
import { ScannerClient } from "./scanner-client";
import { Logo } from "@/components/logo";
import type { Metadata } from "next";

type Params = Promise<{ token: string }>;

export const metadata: Metadata = {
  title: "Mesaj Gönder",
  robots: { index: false, follow: false }, // SEO'da indexlenmesin
};

export default async function ScannerPage({ params }: { params: Params }) {
  const { token } = await params;

  // Token format validation (defensive — RLS zaten engelliyor)
  if (!/^[0-9A-Za-z]{10}$/.test(token)) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();

  // Public view'dan sticker info çek (RLS uygular)
  const { data: sticker, error } = await supabase
    .from("sticker_public_info")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error || !sticker) {
    // Sticker yok, claim edilmemiş veya block edilmiş
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12 text-center">
        <Logo className="mb-6" />
        <div className="rounded-2xl border border-navy/10 bg-white p-8 shadow-sm">
          <div className="mb-4 text-6xl" aria-hidden="true">🔍</div>
          <h1 className="mb-3 text-xl font-bold text-navy">
            Bu sticker bulunamadı
          </h1>
          <p className="text-sm text-charcoal/70">
            QR kod geçersiz olabilir veya sticker henüz sahibine eşlenmemiş.
            Eğer kendi sticker'ını ekliyorsan, Tagora mobil uygulamasını kullanmalısın.
          </p>
        </div>
      </main>
    );
  }

  const useCaseInfo = sticker.use_case
    ? USE_CASE_LABELS[sticker.use_case]
    : USE_CASE_LABELS.other;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6 sm:py-12">
      {/* Top bar */}
      <header className="mb-6 flex items-center justify-between">
        <Logo />
        <span className="text-xs font-medium text-charcoal/50">
          Anonim & Privacy-First
        </span>
      </header>

      {/* Sticker bağlamı */}
      <section className="mb-6 rounded-2xl border border-navy/10 bg-gradient-to-br from-navy to-navy-800 p-6 text-white shadow-md">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">
            {useCaseInfo.emoji}
          </span>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-accent">
              {useCaseInfo.tr}
            </div>
            <h1 className="text-xl font-bold">
              {sticker.label || `${useCaseInfo.tr} sahibi`}
            </h1>
          </div>
        </div>
        <p className="text-sm text-white/80">
          Bu sticker'ın sahibiyle anonim mesajlaşabilirsin.
          <span className="block pt-1 text-xs text-white/60">
            Telefon numaran, kimliğin, lokasyonun asla paylaşılmaz.
          </span>
        </p>
      </section>

      {/* Etkileşimli chat client */}
      <ScannerClient
        token={token}
        useCase={sticker.use_case}
        stickerLabel={sticker.label}
      />

      {/* Privacy footer */}
      <footer className="mt-8 space-y-2 text-center text-xs text-charcoal/50">
        <p>🔒 KVKK uyumlu · Veri AB&apos;de · End-to-end şifreli</p>
        <p>
          <a href="/" className="underline hover:text-navy">
            Tagora nedir?
          </a>
          {" · "}
          <a href="/privacy" className="underline hover:text-navy">
            Gizlilik
          </a>
        </p>
      </footer>
    </main>
  );
}
