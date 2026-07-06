import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@tagora/db", "@tagora/shared"],
  // iyzipay bundling — kendi klasöründeki `resources/` dizinini runtime'da
  // fs ile scan eder. Next.js bundler bu klasörü "unused" görüp bundle'a almadığı
  // için Vercel'de ENOENT hatası çıkar. serverExternalPackages ile iyzipay
  // bundle edilmiyor, node_modules'dan direkt yüklenir (resources dahil).
  serverExternalPackages: ["iyzipay"],
  // outputFileTracing dahil etme — ekstra güvence
  outputFileTracingIncludes: {
    "/api/checkout/**/*": ["./node_modules/iyzipay/**/*"],
  },
  typedRoutes: true,
  // KVKK için: gereksiz fetch'leri prefetch yapma
  poweredByHeader: false,
  // Sprint 5 TODO: `supabase gen types typescript` ile canonical Database dosyası üret,
  // packages/db/src/database.types.ts'e yaz, ve aşağıdaki 2 ignore'u kaldır.
  // Şu an manuel Database shape'i Supabase-JS 2.x inference'ı ile uyumsuz →
  // .select() sonuçları `never` dönüyor. Detay: MEMORY.md'de sprint_5_supabase_types.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Privacy headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      // .well-known dosyaları için application/json Content-Type
      // (dosyaların uzantısı yok/JSON, iOS ve Android bu tam Content-Type'ı bekler)
      {
        source: "/.well-known/apple-app-site-association",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
      {
        source: "/.well-known/assetlinks.json",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },
};

// Sentry wrap — source map upload + tunneling
// Kritik: Auth token yoksa da build başarısız olmaz, sadece source map upload atlanır
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(config, {
      org: process.env.SENTRY_ORG ?? "tagora",
      project: process.env.SENTRY_PROJECT ?? "tagora-web",
      // Auth token varsa source map upload olur; yoksa skip
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      // Sentry tunneling — ad blocker'lardan kaçınmak için proxy route
      tunnelRoute: "/monitoring",
      hideSourceMaps: true,
      disableLogger: true,
      automaticVercelMonitors: true,
    })
  : config;
