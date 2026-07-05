"use client";

import { useState } from "react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("submitting");
    setError(null);

    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (json.ok) {
      setState("done");
    } else {
      setState("error");
      setError(json.error || "Bir şey ters gitti");
    }
  };

  if (state === "done") {
    return (
      <div className="rounded-2xl bg-accent/30 p-8 text-center">
        <div className="mb-3 text-4xl" aria-hidden="true">🎉</div>
        <p className="text-lg font-semibold text-navy">Listedesin!</p>
        <p className="mt-2 text-sm text-charcoal/70">
          Lansman duyurusu e-postana gelecek.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="e-postan@..."
        className="flex-1 rounded-xl border border-navy/15 px-4 py-3 text-base focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
        autoComplete="email"
      />
      <button
        type="submit"
        disabled={state === "submitting"}
        className="btn-primary"
      >
        {state === "submitting" ? "Kaydediliyor…" : "Beni Listeye Ekle"}
      </button>
      {error && (
        <p className="text-sm text-red-700">{error}</p>
      )}
    </form>
  );
}
