"use client";

/**
 * Hesap ayarları formu — email değişikliği doğrulama e-postası tetikler.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  currentEmail: string;
  currentDisplayName: string;
  currentPhone: string;
}

export function SettingsForm({
  currentEmail,
  currentDisplayName,
  currentPhone,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState(currentEmail);
  const [displayName, setDisplayName] = useState(currentDisplayName);
  const [phone, setPhone] = useState(currentPhone);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const emailChanged = email.trim().toLowerCase() !== currentEmail.toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);

    const body: Record<string, string | null> = {};
    if (displayName !== currentDisplayName) body.display_name = displayName;
    if (phone !== currentPhone) body.phone = phone;
    if (emailChanged) body.email = email;

    if (Object.keys(body).length === 0) {
      setError("Hiçbir alan değişmemiş.");
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/account/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Güncelleme başarısız oldu.");
        return;
      }

      if (json.email_change === "confirmation_sent") {
        setSuccess(
          `Bilgilerin kaydedildi. Email değişikliği için "${email}" adresine doğrulama linki gönderildi — tıklayınca değişiklik tamamlanır.`,
        );
      } else {
        setSuccess("Bilgilerin başarıyla güncellendi.");
      }
      // Bir tık gecikmeli refresh — success banner görünsün
      setTimeout(() => router.refresh(), 1200);
    } catch (e) {
      setError((e as Error).message ?? "Bağlantı hatası");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field
        label="E-posta"
        value={email}
        onChange={setEmail}
        type="email"
        required
        hint={
          emailChanged
            ? "Bu email adresine bir doğrulama linki gönderilecek. Tıklayana kadar email değişmez."
            : "Değiştirmek için düzenle."
        }
        hintAccent={emailChanged ? "text-amber-700" : undefined}
      />

      <Field
        label="İsim"
        value={displayName}
        onChange={setDisplayName}
        placeholder="Adın veya rumuzun"
        hint="Chat konuşmalarında görünen isim (opsiyonel)."
      />

      <Field
        label="Telefon"
        value={phone}
        onChange={setPhone}
        type="tel"
        placeholder="+90 5XX XXX XX XX"
        hint="Kargo sırasında iletişim için (opsiyonel)."
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          ⚠️ {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          ✓ {success}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="btn-primary w-full"
      >
        {busy ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
  hintAccent,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  hintAccent?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-navy">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none"
      />
      {hint && (
        <p className={`mt-1 text-xs ${hintAccent ?? "text-charcoal/50"}`}>
          {hint}
        </p>
      )}
    </div>
  );
}
