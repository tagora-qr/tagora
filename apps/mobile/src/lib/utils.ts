/**
 * Ortak utility'ler.
 */

export function formatRelativeTime(
  date: Date | string,
  locale: "tr" | "en" = "tr",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  const L =
    locale === "en"
      ? {
          now: "just now",
          sec: (n: number) => `${n}s ago`,
          min: (n: number) => `${n}m ago`,
          hr: (n: number) => `${n}h ago`,
          day: (n: number) => `${n}d ago`,
        }
      : {
          now: "az önce",
          sec: (n: number) => `${n} sn önce`,
          min: (n: number) => `${n} dk önce`,
          hr: (n: number) => `${n} sa önce`,
          day: (n: number) => `${n} g önce`,
        };

  if (seconds < 10) return L.now;
  if (seconds < 60) return L.sec(seconds);
  const min = Math.floor(seconds / 60);
  if (min < 60) return L.min(min);
  const hr = Math.floor(min / 60);
  if (hr < 24) return L.hr(hr);
  return L.day(Math.floor(hr / 24));
}
