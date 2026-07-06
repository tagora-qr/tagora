/**
 * Sentry — server-side (Node/serverless) error tracking.
 * API route'lar, server component'ler, server action'lar burada yakalanır.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // KVKK: sensitive header + body content sanitize
  sendDefaultPii: false,

  // Server tarafında bilinen boilerplate error'ları göz ardı et
  ignoreErrors: [
    "NEXT_REDIRECT",
    "NEXT_NOT_FOUND",
  ],

  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
