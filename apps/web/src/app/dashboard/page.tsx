/**
 * Dashboard ana sayfa — sticker listesi
 */
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { USE_CASE_LABELS } from "@tagora/shared";
import { ClaimStickerButton } from "./claim-sticker-button";

export const metadata = { title: "Stickerlarım" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: stickers } = await supabase
    .from("stickers")
    .select("*")
    .order("created_at", { ascending: false });

  const list = stickers ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Stickerlarım</h1>
        <ClaimStickerButton />
      </div>

      {list.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((s) => (
            <StickerCard key={s.id} sticker={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function StickerCard({ sticker }: { sticker: import("@tagora/db").Sticker }) {
  const useCaseInfo = sticker.use_case
    ? USE_CASE_LABELS[sticker.use_case]
    : USE_CASE_LABELS.other;

  // Sticker detay sayfası v1'de eklenecek — MVP'de tıklanamaz card.
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm transition hover:border-navy/30 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between">
        <div className="text-3xl" aria-hidden="true">
          {useCaseInfo.emoji}
        </div>
        <span
          className={
            "rounded-full px-2.5 py-0.5 text-xs font-medium " +
            (sticker.status === "active"
              ? "bg-emerald-50 text-emerald-700"
              : sticker.status === "claimed"
                ? "bg-amber-50 text-amber-700"
                : "bg-navy/5 text-navy/60")
          }
        >
          {sticker.status === "active" ? "Aktif" : sticker.status === "claimed" ? "Hazır" : sticker.status}
        </span>
      </div>
      <h3 className="mb-1 font-semibold text-navy">
        {sticker.label || `${useCaseInfo.tr} sticker'ı`}
      </h3>
      <p className="text-xs text-charcoal/60">
        {sticker.scan_count} taranma · <span className="font-mono">/s/{sticker.token}</span>
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-navy/20 bg-navy/[0.02] p-8 text-center">
      <div className="mb-4 text-5xl" aria-hidden="true">📦</div>
      <h2 className="mb-2 text-lg font-semibold text-navy">
        Henüz sticker&apos;ın yok
      </h2>
      <p className="mb-6 text-sm text-charcoal/70">
        İlk siparişini ver veya elindeki QR&apos;ı ekle.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/shop" className="btn-primary">
          Sticker Sipariş Et
        </Link>
        <ClaimStickerButton variant="secondary" />
      </div>
    </div>
  );
}
