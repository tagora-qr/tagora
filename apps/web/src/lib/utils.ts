/**
 * Ortak utility fonksiyonlar.
 */

import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * Bir Date'i locale göre "az önce", "5 dk önce" gibi formata çevirir.
 */
export function formatRelativeTime(
  date: Date | string,
  locale: "tr" | "en" = "tr",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  const labels = {
    tr: {
      now: "az önce",
      sec: (n: number) => `${n} sn önce`,
      min: (n: number) => `${n} dk önce`,
      hr: (n: number) => `${n} sa önce`,
      day: (n: number) => `${n} g önce`,
    },
    en: {
      now: "just now",
      sec: (n: number) => `${n}s ago`,
      min: (n: number) => `${n}m ago`,
      hr: (n: number) => `${n}h ago`,
      day: (n: number) => `${n}d ago`,
    },
  } as const;

  const L = labels[locale];
  if (seconds < 10) return L.now;
  if (seconds < 60) return L.sec(seconds);
  const min = Math.floor(seconds / 60);
  if (min < 60) return L.min(min);
  const hr = Math.floor(min / 60);
  if (hr < 24) return L.hr(hr);
  const day = Math.floor(hr / 24);
  return L.day(day);
}

/**
 * "tr" locale için telefonu güzel format: +90 5XX XXX XX XX
 */
export function formatPhoneTR(raw: string): string {
  const cleaned = raw.replace(/\D/g, "");
  if (cleaned.startsWith("90") && cleaned.length === 12) {
    return `+90 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10)}`;
  }
  if (cleaned.length === 10 && cleaned.startsWith("5")) {
    return `+90 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
  }
  return raw;
}
