"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UserActions({
  userId,
  email,
  isAdmin,
  isDeleted,
}: {
  userId: string;
  email: string;
  isAdmin: boolean;
  isDeleted: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const call = async (
    endpoint: string,
    action: string,
    confirmMsg?: string,
  ) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(action);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        alert("Hata: " + (json.error ?? "unknown"));
        return;
      }
      router.refresh();
    } catch (e) {
      alert("İstek başarısız: " + (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const exportData = () => {
    // Yeni sekmede JSON indirme
    window.open(`/api/admin/users/${userId}/export`, "_blank");
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        onClick={() =>
          call(
            "/api/admin/users/toggle-admin",
            "toggle",
            isAdmin
              ? `${email} kullanıcısını admin'den çıkar?`
              : `${email} kullanıcısına admin yetkisi ver?`,
          )
        }
        disabled={busy !== null}
        className={
          "rounded-md px-2 py-1 text-xs font-medium transition disabled:opacity-40 " +
          (isAdmin
            ? "border border-orange-200 text-orange-600 hover:bg-orange-50"
            : "border border-navy/15 text-navy hover:bg-navy/[0.03]")
        }
        title={isAdmin ? "Admin'den çıkar" : "Admin yap"}
      >
        {busy === "toggle" ? "…" : isAdmin ? "↓ Admin" : "↑ Admin"}
      </button>

      <button
        onClick={exportData}
        disabled={busy !== null}
        className="rounded-md border border-navy/15 px-2 py-1 text-xs font-medium text-navy hover:bg-navy/[0.03] disabled:opacity-40"
        title="KVKK verimi indir"
      >
        📥 KVKK
      </button>

      {!isDeleted && (
        <button
          onClick={() =>
            call(
              "/api/admin/users/soft-delete",
              "delete",
              `${email} kullanıcısını sil (soft delete)?\n\nKullanıcı anonimleştirilir, sticker'ları deaktif olur. Geri alınabilir.`,
            )
          }
          disabled={busy !== null}
          className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
          title="Kullanıcıyı sil (soft)"
        >
          {busy === "delete" ? "…" : "Sil"}
        </button>
      )}
    </div>
  );
}
