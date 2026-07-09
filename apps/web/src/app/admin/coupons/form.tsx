"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CouponForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"percentage" | "fixed">("percentage");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      code: (fd.get("code") as string).trim().toUpperCase(),
      type,
      value: parseFloat(fd.get("value") as string),
      min_order_try: fd.get("min_order_try")
        ? parseFloat(fd.get("min_order_try") as string)
        : null,
      max_uses: fd.get("max_uses")
        ? parseInt(fd.get("max_uses") as string, 10)
        : null,
      max_uses_per_user: fd.get("max_uses_per_user")
        ? parseInt(fd.get("max_uses_per_user") as string, 10)
        : 1,
      valid_from: (fd.get("valid_from") as string) || null,
      valid_until: (fd.get("valid_until") as string) || null,
      description: (fd.get("description") as string).trim() || null,
    };

    try {
      const res = await fetch("/api/admin/coupons/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Kupon oluşturulamadı");
        setBusy(false);
        return;
      }
      // Reset form + refresh liste
      (e.target as HTMLFormElement).reset();
      setType("percentage");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field
          label="Kod *"
          name="code"
          required
          placeholder="HEDIYE10"
          uppercase
        />
        <div>
          <label className="mb-1.5 block text-xs font-medium text-charcoal">
            Tür *
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "percentage" | "fixed")}
            className="w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-charcoal focus:border-navy focus:outline-none"
          >
            <option value="percentage">Yüzde (%)</option>
            <option value="fixed">Tutar (₺)</option>
          </select>
        </div>
        <Field
          label={type === "percentage" ? "Değer (%) *" : "Değer (₺) *"}
          name="value"
          required
          type="number"
          step={type === "percentage" ? "1" : "0.01"}
          min="0.01"
          max={type === "percentage" ? "100" : undefined}
          placeholder={type === "percentage" ? "10" : "50"}
        />
        <Field
          label="Min. Sipariş (₺)"
          name="min_order_try"
          type="number"
          step="0.01"
          min="0"
          placeholder="Yok"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field
          label="Max Kullanım (Toplam)"
          name="max_uses"
          type="number"
          min="1"
          placeholder="Sınırsız"
        />
        <Field
          label="Kullanıcı Başı Max"
          name="max_uses_per_user"
          type="number"
          min="1"
          defaultValue="1"
        />
        <Field
          label="Başlangıç"
          name="valid_from"
          type="datetime-local"
        />
        <Field
          label="Bitiş"
          name="valid_until"
          type="datetime-local"
        />
      </div>

      <Field
        label="Açıklama (yalnız admin görür)"
        name="description"
        placeholder="Örn: instagram followerlar için özel indirim"
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          ⚠️ {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-accent hover:bg-navy-800 disabled:opacity-40"
      >
        {busy ? "Oluşturuluyor…" : "Kupon Oluştur"}
      </button>
    </form>
  );
}

function Field({
  label,
  uppercase,
  ...props
}: {
  label: string;
  uppercase?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-charcoal">
        {label}
      </label>
      <input
        {...props}
        className={
          "w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-navy focus:outline-none " +
          (uppercase ? "font-mono uppercase" : "")
        }
      />
    </div>
  );
}
