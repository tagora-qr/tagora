import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Ödeme Başarısız · Tagora",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ message?: string }>;

export default async function OrderFailedPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { message } = await searchParams;
  const errorMessage = message || "Ödeme tamamlanamadı.";

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-50 via-white to-white">
      <header className="border-b border-navy/5 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-3xl border border-red-200 bg-red-50/50 p-10 text-center shadow-sm">
          <div className="mb-4 text-6xl">✗</div>
          <h1 className="mb-2 text-2xl font-bold text-navy">
            Ödeme başarısız
          </h1>
          <p className="text-charcoal/70 mb-6">{errorMessage}</p>
          <div className="flex flex-col gap-3">
            <Link href="/shop" className="btn-primary">
              Tekrar dene
            </Link>
            <Link href="/" className="btn-secondary">
              Anasayfa
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-charcoal/50">
          Kartın çekildi diye endişelenme; başarısız işlemler{" "}
          <strong>iyzico</strong> tarafından hemen iade edilir.
        </p>
      </main>
    </div>
  );
}
