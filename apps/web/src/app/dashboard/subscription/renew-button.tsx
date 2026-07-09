"use client";

import { useState } from "react";

export function RenewButton({ className = "" }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const renew = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/subscription/renew", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Yenileme başlatılamadı");
        setBusy(false);
        return;
      }
      window.location.href = json.payment_page_url;
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        onClick={renew}
        disabled={busy}
        className={
          "rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-accent hover:bg-navy-800 disabled:opacity-40 " +
          className
        }
      >
        {busy ? "Ödemeye yönlendiriliyor…" : "Aboneliği Yenile — 99 TL"}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-700">⚠️ {error}</p>
      )}
    </div>
  );
}
