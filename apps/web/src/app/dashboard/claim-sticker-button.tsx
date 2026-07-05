"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { USE_CASE_LABELS } from "@tagora/shared";
import type { StickerUseCase } from "@tagora/db";

interface Props {
  variant?: "primary" | "secondary";
}

export function ClaimStickerButton({ variant = "primary" }: Props) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [useCase, setUseCase] = useState<StickerUseCase>("vehicle");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/stickers/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: token.trim(),
        use_case: useCase,
        label: label.trim() || null,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.ok) {
      setError(json.error || "Hata oluştu");
      return;
    }
    setOpen(false);
    setToken("");
    setLabel("");
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={variant === "primary" ? "btn-primary" : "btn-secondary"}
      >
        + QR ile Ekle
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md animate-slide-up rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-1 text-lg font-bold text-navy">
              Yeni Sticker Ekle
            </h2>
            <p className="mb-5 text-sm text-charcoal/60">
              Sticker&apos;ın üzerindeki 10 karakterlik kodu gir.
            </p>

            <form onSubmit={submit} className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-charcoal">
                  Sticker kodu
                </span>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  pattern="[0-9A-Za-z]{10}"
                  maxLength={10}
                  placeholder="örn. k7n2pXyZ4A"
                  required
                  className="w-full rounded-xl border border-navy/15 px-3.5 py-2.5 font-mono uppercase tracking-wider focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-charcoal">
                  Ne için kullanacaksın?
                </span>
                <select
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value as StickerUseCase)}
                  className="w-full rounded-xl border border-navy/15 px-3.5 py-2.5 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                >
                  {(Object.keys(USE_CASE_LABELS) as StickerUseCase[]).map((k) => (
                    <option key={k} value={k}>
                      {USE_CASE_LABELS[k].emoji} {USE_CASE_LABELS[k].tr}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-charcoal">
                  İsim ver (opsiyonel)
                </span>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  maxLength={40}
                  placeholder="örn. Mavi Skoda"
                  className="w-full rounded-xl border border-navy/15 px-3.5 py-2.5 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
              </label>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-secondary flex-1"
                >
                  Vazgeç
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? "Kaydediliyor…" : "Sticker'ı Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
