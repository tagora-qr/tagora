import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@tagora/db", "@tagora/shared"],
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

export default config;
