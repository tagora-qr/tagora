/**
 * /business — B2B Landing Page
 *
 * Kurumsal müşteriler için özel sayfa: filo, kargo, AirBnB, veteriner,
 * otel, e-ticaret. Bulk pricing, kurumsal dashboard, white-label opsiyon.
 * CTA: is@tagora.com.tr'ye mailto (sonra full form).
 */
import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getBaseUrl } from "@/lib/base-url";
import { BusinessLeadForm } from "./lead-form";

const BASE_URL = getBaseUrl();

export const metadata: Metadata = {
  title: "Tagora Business — İşletmeniz için Kurumsal QR Sticker Çözümü",
  description:
    "Filo yönetimi, kargo takip, AirBnB, veteriner, otel ve e-ticaret için özel B2B QR sticker çözümü. Bulk fiyatlandırma, kurumsal dashboard, white-label seçenek. KVKK uyumlu.",
  keywords: [
    "kurumsal QR sticker",
    "B2B QR sticker",
    "filo yönetimi QR",
    "kargo takip etiketi",
    "AirBnB kapı sticker",
    "veteriner klinik QR",
    "otel oda QR",
    "e-ticaret paket etiketi",
    "toplu QR sipariş",
    "white-label QR platform",
  ],
  alternates: { canonical: "/business" },
  openGraph: {
    title: "Tagora Business — Kurumsal QR Sticker Çözümü",
    description:
      "Filo, kargo, AirBnB, veteriner ve daha fazlası için özel B2B çözüm.",
    url: "/business",
  },
};

// Sektörler
const SECTORS = [
  {
    icon: "🚚",
    title: "Filo & Kargo",
    body:
      "Araç filosunda her araç için kimlik. Kargocular, kaza olayları, park sorunları — sürücü telefonunun paylaşılmasına gerek kalmaz.",
    examples: "Nakliye şirketleri, kargo firmaları, kurumsal servisler",
  },
  {
    icon: "🏨",
    title: "Otel & AirBnB",
    body:
      "Her oda kapısına yapıştır. Misafir sorularını, check-in/out'u, temizlik taleplerini QR'dan takip et. Zil çalmaz, misafir memnun.",
    examples: "Butik oteller, AirBnB host'ları, kısa dönem kiralama",
  },
  {
    icon: "🐾",
    title: "Veteriner Klinikleri",
    body:
      "Kliniğinizden çıkan her hayvan için QR pet ID hediyesi. Marka bilinirliği + müşteri hatırlanması. Beyaz etiketli (white-label) seçenek de mevcut.",
    examples: "Veterinerler, pet mağazaları, barınaklar",
  },
  {
    icon: "📦",
    title: "E-ticaret & Lojistik",
    body:
      "Paket üstünde tarama QR'ı — müşteri kargoyu takip eder, sen sipariş iletişimini merkezi bir yerden yönetirsin. Çoklu kanal desteği.",
    examples: "Online mağazalar, dropshipping, tedarikçi ağları",
  },
  {
    icon: "🚲",
    title: "Kiralık Bisiklet & Scooter",
    body:
      "Her araç için ayrı QR + admin dashboard. Kullanıcı raporları, hasar bildirimleri, kayıp/çalıntı takibi tek yerden.",
    examples: "Bike-share programları, e-scooter, kampus filoları",
  },
  {
    icon: "🎁",
    title: "Kurumsal Hediyelik",
    body:
      "Şirket etkinliği, çalışan hediyesi, iş ortağı jesti — logo baskılı Tagora sticker. B2B lansmanınıza değer katın.",
    examples: "Kurumsal iletişim, İK, marka hediyeleri",
  },
];

// Özellikler
const FEATURES = [
  {
    icon: "📊",
    title: "Kurumsal Dashboard",
    body:
      "Tüm sticker'lar, konuşmalar, tarayanlar tek panelden. CSV export, filtreleme, çoklu kullanıcı erişimi.",
  },
  {
    icon: "🎨",
    title: "White-Label Seçenek",
    body:
      "Kendi logon, kendi renklerin, kendi URL'in. Tagora altyapısı, senin markan. Tam özelleştirme.",
  },
  {
    icon: "🔗",
    title: "API Entegrasyonu",
    body:
      "Mevcut CRM'ine, ERP'ine, saha uygulamana bağlan. Webhook desteği, kullanım metrikleri.",
  },
  {
    icon: "👥",
    title: "Çoklu Kullanıcı",
    body:
      "Ekip üyelerini davet et. Rol bazlı erişim (admin/moderator/viewer). Denetim izleri.",
  },
  {
    icon: "💼",
    title: "Fatura & KDV",
    body:
      "Kurumsal fatura, e-fatura entegrasyonu. KDV dahil / hariç seçenekleri. Muhasebe kolayı.",
  },
  {
    icon: "🛟",
    title: "Öncelikli Destek",
    body:
      "Özel iş ortağı yöneticisi, WhatsApp/telefon desteği, SLA garantisi.",
  },
];

// FAQ
const FAQ = [
  {
    q: "Kaç adet sipariş edebilirim?",
    a: "Minimum 100 adet, üst sınır yok. 500+ adet siparişlerde sticker başı fiyat 20 TL'nin altına düşer. Özel tasarım siparişleri için ayrı fiyatlandırma.",
  },
  {
    q: "Ne kadar sürede teslim edilir?",
    a: "Standart tasarım: 5-7 iş günü. Özel tasarım (logo, renk, boyut): 10-14 iş günü. Türkiye içi kargo dahil. Yurt dışı sevkiyat için ekstra süre.",
  },
  {
    q: "White-label ne demek, nasıl çalışır?",
    a: "Kendi markanız altında Tagora altyapısını kullanabilirsiniz. QR taranıldığında sizin logonuz, sizin renkleriniz, sizin domain'iniz görünür. Tagora arka planda kalır. Kurumsal müşteriler için ideal.",
  },
  {
    q: "Kurumsal dashboard'da ne var?",
    a: "Tüm sticker'ların durum takibi (satın alınan, dağıtılan, taranan, aktif), konuşma analizi (anonim toplu istatistik — içerik değil), kullanıcı yönetimi, CSV export ve API erişim anahtarları.",
  },
  {
    q: "KVKK ve verilerimizin güvenliği?",
    a: "Tüm veriler Frankfurt (AB) sunucularında. KVKK m.10 uyumlu, veri işleme sözleşmesi (VDPA) imzalarız. İhtiyaç halinde ISO 27001 sertifikalı altyapı raporu paylaşırız.",
  },
  {
    q: "Nasıl teklif alırım?",
    a: "is@tagora.com.tr'ye ihtiyacınızı özetleyen bir email yazın: kaç sticker, ne için kullanacaksınız, özel tasarım gerekli mi. 24 saat içinde detaylı teklif hazırlarız.",
  },
];

// Pricing tiers (indicative — özel teklife açık)
const PRICING_TIERS = [
  {
    name: "Başlangıç",
    range: "100 – 499 adet",
    unitPrice: "35 ₺",
    features: [
      "Standart Tagora tasarım",
      "Kurumsal dashboard",
      "1 admin + 2 viewer",
      "Email desteği",
    ],
  },
  {
    name: "Kurumsal",
    range: "500 – 4.999 adet",
    unitPrice: "20 ₺",
    featured: true,
    features: [
      "Logo baskılı sticker seçeneği",
      "Kurumsal dashboard + CSV export",
      "5 kullanıcı hesap",
      "Öncelikli destek",
      "API erişimi",
    ],
  },
  {
    name: "Enterprise",
    range: "5.000+ adet",
    unitPrice: "İletişim",
    features: [
      "White-label opsiyon (özel domain)",
      "Custom tasarım süreci",
      "Sınırsız kullanıcı",
      "Özel iş ortağı yöneticisi",
      "SLA garantisi",
      "VDPA + ISO 27001 raporu",
    ],
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Tagora Business — Kurumsal QR Sticker Çözümü",
  description:
    "Filo, kargo, AirBnB, veteriner ve diğer sektörler için özel B2B QR sticker platformu.",
  brand: { "@type": "Brand", name: "Tagora" },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "TRY",
    lowPrice: "20",
    highPrice: "35",
    offerCount: 3,
    availability: "https://schema.org/InStock",
    seller: { "@type": "Organization", name: "Tagora" },
  },
  url: `${BASE_URL}/business`,
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Anasayfa", item: BASE_URL },
    { "@type": "ListItem", position: 2, name: "Business", item: `${BASE_URL}/business` },
  ],
};


export default function BusinessPage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy via-navy-800 to-navy py-16 sm:py-24">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage:
            "linear-gradient(#F5B83C 1px, transparent 1px), linear-gradient(90deg, #F5B83C 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        <div className="relative mx-auto max-w-5xl px-4">
          <div className="text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Tagora Business
            </span>
            <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              İşletmeniz için akıllı QR sticker.
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-white/80">
              Filo yönetiminden AirBnB kapılarına, veteriner kliniklerinden
              e-ticaret paketlerine — 100 sticker'dan başlıyor. Kurumsal
              dashboard, white-label ve özel iş ortağı desteği.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <a href="#teklif-al" className="btn-accent inline-block">
                Teklif Al →
              </a>
              <Link
                href="#sektorler"
                className="rounded-lg border border-white/30 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Sektöre Göre Bak
              </Link>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { n: "100+", l: "min adet" },
              { n: "5-7", l: "gün teslim" },
              { n: "🇪🇺", l: "AB sunucular" },
              { n: "24s", l: "teklif" },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur">
                <p className="text-2xl font-bold text-accent">{s.n}</p>
                <p className="text-xs text-white/60">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEKTÖRLER */}
      <section id="sektorler" className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-navy">
              Hangi sektördesin?
            </h2>
            <p className="text-charcoal/60">
              6 sektöre özel çözümler — daha fazlası için konuşalım
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SECTORS.map((s, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-navy/10 bg-white p-6 shadow-sm transition hover:border-accent/30 hover:shadow-lg"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy/5 text-3xl transition group-hover:bg-accent/20">
                  {s.icon}
                </div>
                <h3 className="mb-2 font-bold text-navy">{s.title}</h3>
                <p className="mb-3 text-sm text-charcoal/70 leading-relaxed">
                  {s.body}
                </p>
                <p className="text-xs italic text-charcoal/50">
                  Örn: {s.examples}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ÖZELLİKLER */}
      <section className="bg-navy/[0.02] py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-navy">
              B2B'ye özel özellikler
            </h2>
            <p className="text-charcoal/60">
              Bireysel plandan farklı — kurumsal ihtiyaçlar için tasarlandı
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl border border-navy/10 bg-white p-6"
              >
                <div className="mb-3 text-3xl">{f.icon}</div>
                <h3 className="mb-2 font-semibold text-navy">{f.title}</h3>
                <p className="text-sm text-charcoal/70 leading-relaxed">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-navy">
              Fiyat aralıkları
            </h2>
            <p className="text-charcoal/60">
              Miktar arttıkça birim fiyat düşer. Kesin fiyat teklifle netleşir.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {PRICING_TIERS.map((t, i) => (
              <div
                key={i}
                className={
                  "relative rounded-3xl border p-8 shadow-sm transition " +
                  (t.featured
                    ? "border-accent/60 bg-navy text-white shadow-lg"
                    : "border-navy/10 bg-white")
                }
              >
                {t.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-navy">
                    En Popüler
                  </span>
                )}
                <h3 className={"mb-1 text-xl font-bold " + (t.featured ? "text-accent" : "text-navy")}>
                  {t.name}
                </h3>
                <p className={"mb-4 text-sm " + (t.featured ? "text-white/70" : "text-charcoal/60")}>
                  {t.range}
                </p>
                <div className="mb-6">
                  <p className={"text-xs font-medium " + (t.featured ? "text-white/50" : "text-charcoal/50")}>
                    sticker başı
                  </p>
                  <p className={"text-3xl font-bold " + (t.featured ? "text-white" : "text-navy")}>
                    {t.unitPrice}
                  </p>
                </div>
                <ul className={"mb-8 space-y-2 text-sm " + (t.featured ? "text-white/85" : "text-charcoal/80")}>
                  {t.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <span className={t.featured ? "text-accent" : "text-emerald-600"}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#teklif-al"
                  className={
                    "block w-full rounded-lg py-3 text-center text-sm font-semibold transition " +
                    (t.featured
                      ? "bg-accent text-navy hover:bg-accent/90"
                      : "border border-navy bg-white text-navy hover:bg-navy hover:text-accent")
                  }
                >
                  Teklif İste
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-navy/[0.02] py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-3 text-center text-3xl font-bold text-navy">
            Sık sorulan sorular
          </h2>
          <p className="mb-12 text-center text-charcoal/60">
            B2B satın alma öncesi bilinmesi gerekenler
          </p>

          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-navy/10 bg-white p-5 open:border-navy/30 open:shadow-sm"
              >
                <summary className="cursor-pointer list-none font-semibold text-navy group-open:mb-3">
                  <span className="mr-2 text-accent">›</span>
                  {f.q}
                </summary>
                <p className="pl-4 text-sm text-charcoal/75 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* LEAD FORM */}
      <section id="teklif-al" className="scroll-mt-20 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-10 text-center">
            <span className="chip mb-4 inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              24 saat içinde detaylı teklif
            </span>
            <h2 className="mb-3 text-3xl font-bold text-navy">
              Teklif talep et
            </h2>
            <p className="text-charcoal/60">
              Formu doldur, ekip 24 saat içinde sana özel teklifle döner.
            </p>
          </div>

          <div className="rounded-3xl border border-navy/10 bg-white p-6 shadow-sm sm:p-10">
            <BusinessLeadForm />
          </div>

          <p className="mt-6 text-center text-xs text-charcoal/50">
            Formda takılırsan ya da başka bir yolu tercih edersen:{" "}
            <a href="mailto:is@tagora.com.tr" className="font-medium text-navy underline">
              is@tagora.com.tr
            </a>
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-gradient-to-br from-navy to-navy-800 py-20 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            İhtiyacın için 15 dakikalık bir görüşme
          </h2>
          <p className="mb-8 text-white/80">
            Kaç sticker, hangi sektör, özel tasarım gerekli mi — 24 saatte
            detaylı teklif hazırlarız.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#teklif-al" className="btn-accent inline-block">
              Teklif Al →
            </a>
            <a
              href="mailto:is@tagora.com.tr"
              className="rounded-lg border border-white/30 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              is@tagora.com.tr
            </a>
          </div>
          <p className="mt-6 text-xs text-white/50">
            Kişisel satın alma için:{" "}
            <Link href="/shop" className="underline hover:text-white">
              Bireysel paketleri gör
            </Link>
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
