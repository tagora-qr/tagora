"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CouponActions({
  couponId,
  isActive,
}: {
  couponId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/coupons/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: couponId, is_active: !isActive }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        alert("Hata: " + (json.error ?? "unknown"));
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={
        "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition disabled:opacity-40 " +
        (isActive
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "border-emerald-200 text-emerald-700 hover:bg-emerald-50")
      }
    >
      {busy ? "…" : isActive ? "Deaktive Et" : "Aktifleştir"}
    </button>
  );
}
