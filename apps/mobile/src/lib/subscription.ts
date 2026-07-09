/**
 * Subscription state helper — profile'dan durum ve kalan gün hesaplar.
 * Web tarafındaki compute_subscription_status() ile hizalı.
 *
 * State'ler:
 *  - none         → hiç başlamamış (henüz sticker claim etmedi)
 *  - trial/active → normal kullanım
 *  - warning      → ≤ 30 gün kaldı (aktif ama yaklaşıyor)
 *  - grace        → süresi bitti, 30 gün ek süre içinde
 *  - readonly     → grace de bitti, cevap yazma kapalı
 */
const GRACE_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type SubscriptionState =
  | "none"
  | "active"
  | "warning"
  | "grace"
  | "readonly";

export interface SubscriptionInfo {
  state: SubscriptionState;
  /** Aboneliğin sona erdiği tarih (ISO). Yoksa null. */
  expiresAt: string | null;
  /** Sona ermeye kaç gün kaldı. Sona ermişse negatif. */
  daysRemaining: number | null;
  /** Grace period bitişine kaç gün kaldı (grace state için). */
  daysUntilReadonly: number | null;
  /** Kullanıcı cevap yazabilir mi? readonly değilse true. */
  canReply: boolean;
  /** Uyarı banner göstermeli mi? (warning, grace, readonly) */
  shouldShowBanner: boolean;
}

/**
 * Profile şeklini bilerek gevşek tuttum — @tagora/db User tipi henüz yeni kolonu
 * içermiyor. Runtime'da Supabase select("*") döndürüyor; alan varsa string,
 * yoksa undefined/null. Type-guard yaparak güvenle okuyoruz.
 */
export function computeSubscription(profile: unknown): SubscriptionInfo {
  const rawValue =
    profile && typeof profile === "object"
      ? (profile as Record<string, unknown>)["subscription_expires_at"]
      : null;
  const expiresAtRaw: string | null =
    typeof rawValue === "string" && rawValue.length > 0 ? rawValue : null;
  if (!expiresAtRaw) {
    return {
      state: "none",
      expiresAt: null,
      daysRemaining: null,
      daysUntilReadonly: null,
      canReply: true, // hiç başlamamış → henüz sınır yok
      shouldShowBanner: false,
    };
  }

  const now = Date.now();
  const expires = new Date(expiresAtRaw).getTime();
  const graceEnd = expires + GRACE_DAYS * MS_PER_DAY;

  const daysRemaining = Math.ceil((expires - now) / MS_PER_DAY);
  const daysUntilReadonly = Math.ceil((graceEnd - now) / MS_PER_DAY);

  // 1) Aktif ve rahat (>30 gün var)
  if (daysRemaining > 30) {
    return {
      state: "active",
      expiresAt: expiresAtRaw,
      daysRemaining,
      daysUntilReadonly: null,
      canReply: true,
      shouldShowBanner: false,
    };
  }
  // 2) Aktif ama yaklaşıyor (0-30 gün)
  if (daysRemaining > 0) {
    return {
      state: "warning",
      expiresAt: expiresAtRaw,
      daysRemaining,
      daysUntilReadonly: null,
      canReply: true,
      shouldShowBanner: true,
    };
  }
  // 3) Grace period (0 ile -30 gün arası)
  if (daysUntilReadonly > 0) {
    return {
      state: "grace",
      expiresAt: expiresAtRaw,
      daysRemaining,
      daysUntilReadonly,
      canReply: true,
      shouldShowBanner: true,
    };
  }
  // 4) Read-only (grace de bitti)
  return {
    state: "readonly",
    expiresAt: expiresAtRaw,
    daysRemaining,
    daysUntilReadonly,
    canReply: false,
    shouldShowBanner: true,
  };
}
