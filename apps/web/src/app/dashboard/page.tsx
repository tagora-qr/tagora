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

  // Kullanıcı profili + subscription
  const { data: { user } } = await supabase.auth.getUser();
  let profile: {
    id: string;
    subscription_started_at: string | null;
    subscription_expires_at: string | null;
    subscription_status: string;
  } | null = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("id, subscription_started_at, subscription_expires_at, subscription_status")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    profile = data as typeof profile;
  }

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

      {profile?.subscription_started_at && (
        <SubscriptionCard
          startedAt={profile.subscription_started_at}
          expiresAt={profile.subscription_expires_at}
        />
      )}

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

function SubscriptionCard({
  startedAt,
  expiresAt,
}: {
  startedAt: string;
  expiresAt: string | null;
}) {
  const now = new Date();
  const expires = expiresAt ? new Date(expiresAt) : null;
  const graceEnd = expires
    ? new Date(expires.getTime() + 30 * 24 * 60 * 60 * 1000)
    : null;

  const remainingMs = expires ? expires.getTime() - now.getTime() : 0;
  const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));

  const isActive = expires && now < expires;
  const isGrace = expires && graceEnd && now >= expires && now < graceEnd;
  const isReadonly = expires && graceEnd && now >= graceEnd;

  const isTrial =
    expires &&
    new Date(expires).getTime() - new Date(startedAt).getTime() >
      364 * 24 * 60 * 60 * 1000;

  // Aktif — geniş bir süre kaldıysa yumuşak kart
  if (isActive && remainingDays > 30) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🎉</span>
              <p className="font-semibold text-emerald-900">
                {isTrial ? "İlk Yıl Ücretsiz" : "Aktif Abonelik"}
              </p>
            </div>
            <p className="mt-1 text-sm text-emerald-800/80">
              Aboneliğin{" "}
              <strong>
                {expires!.toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </strong>{" "}
              tarihine kadar geçerli · {remainingDays} gün kaldı
            </p>
            {isTrial && (
              <p className="mt-1 text-xs text-emerald-800/60">
                Sticker satın alımınla birlikte 1 yıl hediye. Sonraki yenileme
                99 TL/yıl.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Aktif — 30 gün altı: yumuşak uyarı
  if (isActive && remainingDays <= 30) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">⏰</span>
              <p className="font-semibold text-amber-900">
                Abonelik Yakında Bitiyor
              </p>
            </div>
            <p className="mt-1 text-sm text-amber-800">
              <strong>{remainingDays} gün</strong> kaldı · Bitiş:{" "}
              {expires!.toLocaleDateString("tr-TR")}
            </p>
            <p className="mt-1 text-xs text-amber-700/80">
              Sistemi kesintisiz kullanmak için şimdi yenile — 99 TL/yıl.
            </p>
          </div>
          <a
            href="/dashboard/subscription"
            className="whitespace-nowrap rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Şimdi Yenile
          </a>
        </div>
      </div>
    );
  }

  // Grace period: süre bitmiş ama 30 gün içinde
  if (isGrace) {
    const graceRemaining = Math.floor(
      (graceEnd!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return (
      <div className="rounded-2xl border border-orange-300 bg-orange-50 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🟠</span>
              <p className="font-semibold text-orange-900">
                Aboneliğin Sona Erdi
              </p>
            </div>
            <p className="mt-1 text-sm text-orange-800">
              Ek {graceRemaining} gün ekstra süre tanıdık — sistem normal
              çalışmaya devam ediyor. Sonrasında mesajlara cevap yazamayacaksın.
            </p>
          </div>
          <a
            href="/dashboard/subscription"
            className="whitespace-nowrap rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Yenile — 99 TL
          </a>
        </div>
      </div>
    );
  }

  // Read-only: grace de bitmiş
  if (isReadonly) {
    return (
      <div className="rounded-2xl border border-red-300 bg-red-50 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🔒</span>
              <p className="font-semibold text-red-900">
                Cevap Yazma Kapalı
              </p>
            </div>
            <p className="mt-1 text-sm text-red-800">
              Aboneliğin süresi doldu. Gelen mesajları görebilirsin ama cevap
              yazamıyorsun. Yenileyerek sistemi tekrar aktive edebilirsin.
            </p>
          </div>
          <a
            href="/dashboard/subscription"
            className="whitespace-nowrap rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Yenile — 99 TL
          </a>
        </div>
      </div>
    );
  }

  return null;
}

function StickerCard({ sticker }: { sticker: import("@tagora/db").Sticker }) {
  const useCaseInfo =
    (sticker.use_case && USE_CASE_LABELS[sticker.use_case]) ??
    USE_CASE_LABELS.other;

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
