"use client";

/**
 * KVKK cookie consent banner.
 *
 * Zorunlu cookie'ler (Supabase Auth session, cart) her zaman aktif.
 * Analytics/marketing tracking (PostHog) opt-in gerektirir.
 *
 * Consent state 'tagora-cookie-consent' key'iyle localStorage'da.
 * Değişiklikte 'tagora:consent-changed' event'i tetiklenir → PostHog init/reset.
 */
import { useEffect, useState } from "react";
import Link from "next/link";

const CONSENT_KEY = "tagora-cookie-consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);

  useEffect(() => {
    // Consent state kontrol → yoksa banner göster
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === null) {
      setVisible(true);
    }
  }, []);

  const setConsent = (value: "accepted" | "rejected") => {
    localStorage.setItem(CONSENT_KEY, value);
    // Custom event → PostHog provider dinliyor
    window.dispatchEvent(new Event("tagora:consent-changed"));
    setVisible(false);
  };

  const savePreferences = () => {
    setConsent(analyticsAllowed ? "accepted" : "rejected");
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-navy/10 bg-white shadow-2xl">
      <div className="mx-auto max-w-4xl px-4 py-4">
        {!customizing ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-navy">🍪 Çerez Tercihlerin</p>
              <p className="mt-1 text-xs text-charcoal/70 leading-relaxed">
                Tagora'nın çalışması için zorunlu çerezler her zaman kullanılır. Ürünü iyileştirmek
                için analitik çerezleri de kullanmak istiyoruz.{" "}
                <Link href="/cookies" className="text-navy underline">
                  Çerez politikası
                </Link>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:flex-nowrap">
              <button
                onClick={() => setCustomizing(true)}
                className="rounded-lg border border-navy/15 px-3 py-2 text-xs font-medium text-charcoal hover:bg-navy/5"
              >
                Özelleştir
              </button>
              <button
                onClick={() => setConsent("rejected")}
                className="rounded-lg border border-navy/15 px-3 py-2 text-xs font-medium text-charcoal hover:bg-navy/5"
              >
                Reddet
              </button>
              <button
                onClick={() => setConsent("accepted")}
                className="rounded-lg bg-navy px-4 py-2 text-xs font-semibold text-accent hover:bg-navy/90"
              >
                Kabul Et
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-navy">Çerez Tercihlerini Özelleştir</p>

            <div className="rounded-lg border border-navy/10 bg-navy/[0.02] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-charcoal">Zorunlu Çerezler</p>
                  <p className="mt-1 text-[11px] text-charcoal/60">
                    Login, güvenlik ve sepet için gerekli. Kapatılamaz.
                  </p>
                </div>
                <span className="text-xs font-medium text-emerald-700">Her zaman aktif</span>
              </div>
            </div>

            <div className="rounded-lg border border-navy/10 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-charcoal">Analitik Çerezler</p>
                  <p className="mt-1 text-[11px] text-charcoal/60">
                    Ürünü nasıl kullandığını anlamamıza yardımcı olur (PostHog, EU sunucularda).
                    Kişisel veri saklamaz, kimliğinle bağlantı kurulmaz.
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analyticsAllowed}
                    onChange={(e) => setAnalyticsAllowed(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-5 w-9 rounded-full bg-charcoal/20 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-navy peer-checked:after:translate-x-4"></div>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                onClick={() => setCustomizing(false)}
                className="rounded-lg border border-navy/15 px-3 py-2 text-xs font-medium text-charcoal hover:bg-navy/5"
              >
                Geri
              </button>
              <button
                onClick={savePreferences}
                className="rounded-lg bg-navy px-4 py-2 text-xs font-semibold text-accent hover:bg-navy/90"
              >
                Tercihleri Kaydet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
