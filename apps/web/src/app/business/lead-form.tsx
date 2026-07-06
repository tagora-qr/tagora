"use client";

/**
 * B2B Lead Form — /business sayfasında modal olarak açılır.
 * Ana yerine ayrı bir bölüme render edilir, kullanıcı "Teklif Al" tıkladığında görünür.
 */
import { useState, useRef, useEffect } from "react";

const SECTORS = [
  { value: "fleet", label: "🚚 Filo & Kargo" },
  { value: "hotel", label: "🏨 Otel & AirBnB" },
  { value: "vet", label: "🐾 Veteriner" },
  { value: "ecommerce", label: "📦 E-ticaret & Lojistik" },
  { value: "bike", label: "🚲 Kiralık Bike / Scooter" },
  { value: "corp", label: "🎁 Kurumsal Hediyelik" },
  { value: "other", label: "Diğer" },
];

const SIZES = [
  { value: "1-10", label: "1-10 kişi" },
  { value: "11-50", label: "11-50 kişi" },
  { value: "51-200", label: "51-200 kişi" },
  { value: "200+", label: "200+ kişi" },
];

export function BusinessLeadForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [customDesign, setCustomDesign] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // UTM parametrelerini localStorage'dan al (varsa)
  const [utm, setUtm] = useState<{ source: string; medium: string; campaign: string }>({
    source: "",
    medium: "",
    campaign: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUtm({
      source: params.get("utm_source") ?? "",
      medium: params.get("utm_medium") ?? "",
      campaign: params.get("utm_campaign") ?? "",
    });
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      contact_name: (fd.get("contact_name") as string).trim(),
      email: (fd.get("email") as string).trim(),
      phone: (fd.get("phone") as string).trim() || undefined,
      company_name: (fd.get("company_name") as string).trim(),
      company_size: (fd.get("company_size") as string) || undefined,
      sector: (fd.get("sector") as string) || undefined,
      estimated_quantity: fd.get("estimated_quantity")
        ? parseInt(fd.get("estimated_quantity") as string, 10)
        : undefined,
      custom_design: customDesign,
      message: (fd.get("message") as string).trim() || undefined,
      utm_source: utm.source || undefined,
      utm_medium: utm.medium || undefined,
      utm_campaign: utm.campaign || undefined,
    };

    try {
      const res = await fetch("/api/business/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        setStatus("error");
        setErrorMsg(json.error ?? "Bir hata oluştu, tekrar dene");
        return;
      }

      setStatus("success");
      formRef.current?.reset();
      setCustomDesign(false);
    } catch (err) {
      setStatus("error");
      setErrorMsg((err as Error).message);
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-10 text-center">
        <div className="mb-3 text-5xl">✓</div>
        <h3 className="mb-2 text-xl font-bold text-navy">Talebin alındı!</h3>
        <p className="mx-auto max-w-md text-sm text-charcoal/70">
          E-postana onay yolladık. Ekip <strong>24 saat</strong> içinde detaylı
          teklif ile sana döner.
        </p>
        <p className="mt-6 text-xs text-charcoal/50">
          Acil bir konu için: <a href="mailto:is@tagora.com.tr" className="underline">is@tagora.com.tr</a>
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
      {/* Ad Soyad + Şirket */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Ad Soyad *"
          name="contact_name"
          required
          autoComplete="name"
          placeholder="Adınız ve soyadınız"
        />
        <Field
          label="Şirket Adı *"
          name="company_name"
          required
          autoComplete="organization"
          placeholder="Şirket / marka"
        />
      </div>

      {/* Email + Telefon */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="İş E-postası *"
          name="email"
          required
          type="email"
          autoComplete="email"
          placeholder="ornek@sirket.com"
        />
        <Field
          label="Telefon (opsiyonel)"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+90 5xx xxx xxxx"
        />
      </div>

      {/* Sektör + Şirket boyutu */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Sektör" name="sector" options={SECTORS} placeholder="Seç…" />
        <Select label="Şirket boyutu" name="company_size" options={SIZES} placeholder="Seç…" />
      </div>

      {/* Adet + Özel tasarım */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Tahmini adet"
          name="estimated_quantity"
          type="number"
          min={100}
          placeholder="Örn: 500"
          inputMode="numeric"
        />
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-navy/15 bg-white px-4 py-3 text-sm hover:border-navy/30">
          <input
            type="checkbox"
            checked={customDesign}
            onChange={(e) => setCustomDesign(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-navy/30 text-navy focus:ring-navy/30"
          />
          <span>
            <strong className="text-navy">Özel tasarım</strong>
            <span className="block text-xs text-charcoal/60">
              Logo, renk, boyut özelleştirmesi ister misin?
            </span>
          </span>
        </label>
      </div>

      {/* Mesaj */}
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-charcoal">
          Mesaj (opsiyonel)
        </span>
        <textarea
          name="message"
          rows={4}
          placeholder="Kullanım senaryonu, özel istekler, hedef teslim tarihi…"
          className="w-full resize-none rounded-xl border border-navy/15 bg-white px-3.5 py-2.5 text-base text-charcoal placeholder:text-charcoal/40 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
        />
      </label>

      {/* Error */}
      {status === "error" && errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Submit */}
      <div className="flex flex-col-reverse items-center justify-between gap-3 pt-2 sm:flex-row">
        <p className="text-xs text-charcoal/50">
          Bilgilerini KVKK'ya uygun olarak korur, sadece sana ulaşmak için kullanırız.
        </p>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full rounded-xl bg-navy px-8 py-3 font-semibold text-accent shadow-md transition hover:bg-navy/90 disabled:opacity-60 sm:w-auto"
        >
          {status === "submitting" ? "Gönderiliyor…" : "Teklif Al →"}
        </button>
      </div>
    </form>
  );
}

// ============================================================
// Inputs
// ============================================================
function Field({
  label,
  ...rest
}: {
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-charcoal">{label}</span>
      <input
        {...rest}
        className="w-full rounded-xl border border-navy/15 bg-white px-3.5 py-2.5 text-base text-charcoal placeholder:text-charcoal/40 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
      />
    </label>
  );
}

function Select({
  label,
  name,
  options,
  placeholder,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-charcoal">{label}</span>
      <select
        name={name}
        defaultValue=""
        className="w-full rounded-xl border border-navy/15 bg-white px-3.5 py-2.5 text-base text-charcoal focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
