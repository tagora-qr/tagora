"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SubscriptionActions({ userId }: { userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const extend = async (months: number) => {
    if (
      !window.confirm(
        `Bu kullanıcının aboneliğini ${months} ay uzatmak istiyor musun?\n\nBu manuel bir işlemdir — kayıt subscription_payments'a yazılmaz.`,
      )
    )
      return;
    setBusy(`ext-${months}`);
    try {
      const res = await fetch("/api/admin/subscriptions/extend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, months }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        alert("Hata: " + (json.error ?? "unknown"));
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex justify-end gap-1">
      <button
        onClick={() => extend(1)}
        disabled={busy !== null}
        className="rounded-lg border border-navy/15 px-2 py-1 text-[10px] font-medium text-navy hover:bg-navy/5 disabled:opacity-40"
        title="1 ay uzat"
      >
        {busy === "ext-1" ? "…" : "+1a"}
      </button>
      <button
        onClick={() => extend(12)}
        disabled={busy !== null}
        className="rounded-lg border border-navy/15 px-2 py-1 text-[10px] font-medium text-navy hover:bg-navy/5 disabled:opacity-40"
        title="12 ay uzat"
      >
        {busy === "ext-12" ? "…" : "+12a"}
      </button>
    </div>
  );
}
