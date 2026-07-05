/**
 * Tagora Edge Middleware
 *
 * İki iş yapar:
 *  1. Host routing — tagora.link'i canonical tagora.com.tr'ye 308'ler (path /s/* hariç,
 *     sticker scanner için kısa URL burada canlı kalıyor).
 *  2. Supabase Auth session refresh + /dashboard giriş guard.
 *
 * Neden:
 *  - Sticker'a `tagora.link/s/xxxxx` basılıyor (kısa + brand-thematic).
 *  - Ana pazarlama tagora.com.tr'de tekil kalır → SEO duplicate content yok.
 *  - Kullanıcı tagora.link yazsa direkt ana siteye gider.
 */
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SCANNER_HOST = "tagora.link";
const CANONICAL_HOST = "tagora.com.tr";

export async function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase();
  const url = req.nextUrl;

  // 1) Host routing — tagora.link + non-scanner path → canonical redirect
  const isScannerHost = host === SCANNER_HOST || host === `www.${SCANNER_HOST}`;
  const isScannerPath = url.pathname.startsWith("/s/");
  if (isScannerHost && !isScannerPath) {
    const target = new URL(url.pathname + url.search, `https://${CANONICAL_HOST}`);
    return NextResponse.redirect(target, 308);
  }

  // 2) Supabase Auth session refresh + dashboard guard
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value }) =>
            req.cookies.set(name, value),
          );
          response = NextResponse.next({ request: req });
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Session refresh için kullanıcıyı bir kere al
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Dashboard guard: /dashboard altındakiler login ister
  const url = req.nextUrl;
  const isDashboard = url.pathname.startsWith("/dashboard");
  if (isDashboard && !user) {
    const redirect = url.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", url.pathname);
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/scanner).*)"],
};
