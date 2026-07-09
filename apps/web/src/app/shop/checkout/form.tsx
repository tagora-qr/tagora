"use client";

/**
 * Checkout formu — tasarım + alıcı + kargo bilgisi + ödeme başlat.
 */
import Image from "next/image";
import { useState } from "react";

interface Design {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  preview_url: string | null;
}

interface Props {
  packageSlug: string;
  packageId: string;
  defaultEmail: string;
  defaultName: string;
  defaultPhone: string;
  designs: Design[];
}

const TR_CITIES = [
  "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Gaziantep",
  "Konya", "Şanlıurfa", "Kayseri", "Mersin", "Diyarbakır", "Eskişehir",
  "Samsun", "Sakarya", "Trabzon", "Erzurum", "Malatya", "Denizli", "Balıkesir",
  "Kocaeli", "Manisa", "Kahramanmaraş", "Van", "Aydın", "Tekirdağ", "Muğla",
  "Hatay", "Ordu", "Afyonkarahisar", "Aksaray", "Amasya", "Ardahan", "Artvin",
  "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur",
  "Çanakkale", "Çankırı", "Çorum", "Düzce", "Edirne", "Elazığ", "Erzincan",
  "Giresun", "Gümüşhane", "Hakkâri", "Iğdır", "Isparta", "Karabük", "Karaman",
  "Kars", "Kastamonu", "Kilis", "Kırıkkale", "Kırklareli", "Kırşehir", "Kütahya",
  "Mardin", "Muş", "Nevşehir", "Niğde", "Osmaniye", "Rize", "Siirt", "Sinop",
  "Sivas", "Şırnak", "Tokat", "Tunceli", "Uşak", "Yalova", "Yozgat", "Zonguldak",
];

export function CheckoutForm({
  packageSlug,
  packageId,
  defaultEmail,
  defaultName,
  defaultPhone,
  designs,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(
    designs[0]?.id ?? null,
  );

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!selectedDesignId) {
      setError("Lütfen bir tasarım seç.");
      return;
    }

    setBusy(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      package_slug: packageSlug,
      package_id: packageId,
      design_id: selectedDesignId,
      buyer_name: (fd.get("buyer_name") as string).trim(),
      buyer_email: (fd.get("buyer_email") as string).trim(),
      buyer_phone: (fd.get("buyer_phone") as string).trim(),
      buyer_identity_number:
        (fd.get("buyer_identity_number") as string)?.trim() || null,
      shipping_address: (fd.get("shipping_address") as string).trim(),
      shipping_city: (fd.get("shipping_city") as string).trim(),
      shipping_district: (fd.get("shipping_district") as string).trim() || null,
      shipping_zip: (fd.get("shipping_zip") as string).trim() || null,
      customer_note: (fd.get("customer_note") as string).trim() || null,
    };

    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Ödeme başlatılamadı");
        setBusy(false);
        return;
      }
      // iyzico'nun ödeme sayfasına yönlendir
      window.location.href = json.payment_page_url;
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-2xl border border-navy/10 bg-white p-6 shadow-sm"
    >
      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-charcoal/60">
          Tasarım Seç
        </h2>
        {designs.length === 0 ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Şu an satın alınabilir tasarım yok. Lütfen daha sonra tekrar dene.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {designs.map((d) => {
              const selected = d.id === selectedDesignId;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDesignId(d.id)}
                  className={
                    "flex flex-col overflow-hidden rounded-xl border-2 bg-white text-left transition " +
                    (selected
                      ? "border-navy shadow-md ring-2 ring-navy/20"
                      : "border-navy/10 hover:border-navy/30")
                  }
                >
                  <div className="relative aspect-square bg-bgSubtle">
                    {d.preview_url ? (
                      <Image
                        src={d.preview_url}
                        alt={d.name}
                        fill
                        sizes="(min-width: 1024px) 20vw, (min-width: 640px) 40vw, 90vw"
                        className="object-contain p-2"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-charcoal/30">
                        Önizleme yok
                      </div>
                    )}
                    {selected && (
                      <span className="absolute right-2 top-2 rounded-full bg-navy px-2 py-0.5 text-[10px] font-bold text-accent shadow">
                        SEÇİLDİ
                      </span>
                    )}
                  </div>
                  <div className="border-t border-navy/10 px-3 py-2">
                    <p className="text-sm font-semibold text-navy">{d.name}</p>
                    {d.description && (
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-charcoal/60">
                        {d.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-charcoal/60">
          Alıcı Bilgileri
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ad Soyad *" name="buyer_name" defaultValue={defaultName} required autoComplete="name" placeholder="Adınız ve soyadınız" />
          <Field label="E-posta *" name="buyer_email" defaultValue={defaultEmail} required type="email" autoComplete="email" placeholder="ornek@eposta.com" />
          <Field label="Telefon *" name="buyer_phone" defaultValue={defaultPhone} required type="tel" autoComplete="tel" placeholder="+90 5xx xxx xxxx" />
          <Field label="TC Kimlik No (opsiyonel)" name="buyer_identity_number" placeholder="11 haneli TC kimlik" maxLength={11} inputMode="numeric" />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-charcoal/60">
          Kargo Adresi
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextareaField label="Adres *" name="shipping_address" required placeholder="Mahalle, sokak, apartman, daire no" className="sm:col-span-2" />
          <SelectField label="Şehir *" name="shipping_city" options={TR_CITIES} required />
          <Field label="İlçe" name="shipping_district" placeholder="İlçe adı" />
          <Field label="Posta Kodu" name="shipping_zip" placeholder="5 haneli posta kodu" maxLength={5} inputMode="numeric" />
        </div>
      </section>

      <section>
        <TextareaField label="Not (opsiyonel)" name="customer_note" placeholder="Kargo notları vs." />
      </section>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          ⚠️ {error}
        </p>
      )}

      <div className="border-t border-navy/10 pt-5">
        <button
          type="submit"
          disabled={busy}
          className="btn-primary w-full"
        >
          {busy ? "Ödeme sayfasına yönlendiriliyor…" : "Güvenli Ödemeye Geç →"}
        </button>
        <p className="mt-3 text-center text-xs text-charcoal/50">
          Ödeme <strong>iyzico</strong> üzerinden alınır. Kart bilgin Tagora sunucularına gelmez.
        </p>
      </div>
    </form>
  );
}

// UI atoms
function Field({
  label,
  className = "",
  ...props
}: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={"block " + className}>
      <span className="mb-1.5 block text-sm font-medium text-charcoal">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-navy/15 bg-white px-3.5 py-2.5 text-base text-charcoal placeholder:text-charcoal/40 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
      />
    </label>
  );
}
function TextareaField({
  label,
  className = "",
  ...props
}: { label: string; className?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={"block " + className}>
      <span className="mb-1.5 block text-sm font-medium text-charcoal">{label}</span>
      <textarea
        {...props}
        rows={3}
        className="w-full resize-none rounded-xl border border-navy/15 bg-white px-3.5 py-2.5 text-base text-charcoal placeholder:text-charcoal/40 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
      />
    </label>
  );
}
function SelectField({
  label,
  options,
  ...props
}: { label: string; options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-charcoal">{label}</span>
      <select
        {...props}
        className="w-full rounded-xl border border-navy/15 bg-white px-3.5 py-2.5 text-base text-charcoal focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
        defaultValue=""
      >
        <option value="" disabled>Seç…</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
