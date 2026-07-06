"use client";

/**
 * PostHog client-side provider — cookie consent'e bağlı olarak
 * kullanıcı tracking'i yönetir.
 *
 * KVKK: Consent verilmediyse PostHog init olmaz + hiçbir event gönderilmez.
 * Consent state 'tagora-cookie-consent' key'iyle localStorage'da tutulur.
 *
 * Consent değerleri:
 *   'accepted' → tüm cookie'ler ve tracking aktif
 *   'rejected' → sadece zorunlu (session cookie) — analytics KAPALI
 *   null / 'pending' → henüz seçim yapmadı — analytics KAPALI, banner göster
 */
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

const CONSENT_KEY = "tagora-cookie-consent";

export function initPostHogIfConsented() {
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  const consent = localStorage.getItem(CONSENT_KEY);
  if (consent !== "accepted") return; // consent yok, init etme

  if (posthog.__loaded) return; // zaten init

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
    capture_pageview: false, // manuel — router change'te tetikleyeceğiz
    capture_pageleave: true,
    disable_session_recording: false, // session replay AÇIK
    autocapture: true, // click, form submit otomatik yakala
    persistence: "localStorage+cookie",
    person_profiles: "identified_only", // sadece login user'ları için profile
    loaded: (ph) => {
      if (process.env.NODE_ENV === "development") ph.debug();
    },
  });
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHogIfConsented();

    // Consent değişince re-init
    const listener = () => initPostHogIfConsented();
    window.addEventListener("tagora:consent-changed", listener);
    return () => window.removeEventListener("tagora:consent-changed", listener);
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

// ============================================================
// Route change'te pageview capture
// ============================================================
export function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!posthog.__loaded) return;
    let url = pathname;
    const search = searchParams?.toString();
    if (search) url = `${url}?${search}`;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

// ============================================================
// Client tarafında custom event capture helper
// ============================================================
export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!posthog.__loaded) return;
  posthog.capture(event, properties);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!posthog.__loaded) return;
  posthog.identify(userId, traits);
}

export function resetUser() {
  if (typeof window === "undefined") return;
  if (!posthog.__loaded) return;
  posthog.reset();
}
