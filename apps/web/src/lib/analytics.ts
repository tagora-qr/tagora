/**
 * PostHog analytics wrapper — client + server.
 *
 * KVKK: PostHog EU region kullanılıyor (eu.i.posthog.com).
 * Kullanıcı cookie consent vermeden HİÇBİR event gönderilmez.
 * Consent state 'localStorage' + cookie'de tutulur.
 *
 * Event namespace kuralları:
 *   - 'page:view' → otomatik (PageviewCapture component)
 *   - 'shop:...' → shop/checkout funnel
 *   - 'sticker:...' → sticker claim/scanner akışı
 *   - 'chat:...' → mesajlaşma
 *   - 'auth:...' → login/signup
 *   - 'order:...' → sipariş yaşam döngüsü
 */

// ============================================================
// SERVER-SIDE — posthog-node
// ============================================================
// Server tarafında iyzico callback, admin action, order events için.
// Node client "fire-and-forget" pattern — response beklemez.
import { PostHog } from "posthog-node";

let _serverClient: PostHog | null = null;

function getServerClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? process.env.POSTHOG_KEY;
  if (!key) return null;

  if (!_serverClient) {
    _serverClient = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
      flushAt: 1, // her event'i hemen gönder (serverless için)
      flushInterval: 0,
    });
  }
  return _serverClient;
}

/**
 * Server-side event gönder — iyzico callback, admin action vs.
 * distinctId: user id (varsa) ya da anonymous id
 */
export async function trackServerEvent(input: {
  event: string;
  distinctId: string;
  properties?: Record<string, unknown>;
}): Promise<void> {
  const client = getServerClient();
  if (!client) {
    console.warn("[analytics] POSTHOG_KEY yok, event kayıt edilmedi:", input.event);
    return;
  }
  try {
    client.capture({
      distinctId: input.distinctId,
      event: input.event,
      properties: input.properties,
    });
    // Serverless için shutdown → in-flight events flush
    await client.shutdown();
  } catch (e) {
    console.error("[analytics] Server event failed:", e);
  }
}
