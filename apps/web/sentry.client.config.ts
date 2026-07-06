/**
 * Sentry — client-side (browser) error tracking.
 * Bu dosya Next.js tarafından otomatik yüklenir (Sentry SDK convention).
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring - production'da %10 sample
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session replay - hatada full replay, normal user'da %10
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // KVKK: kullanıcı IP + email otomatik maskeleme
  sendDefaultPii: false,

  integrations: [
    Sentry.replayIntegration({
      // KVKK: mask + block sensitive DOM elements
      maskAllText: false, // sadece belirli elementleri masklıyoruz
      blockAllMedia: true,
      // Manuel mask: input[type=password], .sensitive, etc.
      mask: ["input[type='password']", ".sensitive", "[data-sensitive]"],
      block: ["iframe"],
    }),
  ],

  // Filter noise
  ignoreErrors: [
    // Browser extensions
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    // Network offline
    "NetworkError",
    "Failed to fetch",
    "Load failed",
  ],

  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
