/**
 * App Store + Google Play download badges.
 *
 * URL varsa link, yoksa "Yakında" durumu.
 * Env:
 *   NEXT_PUBLIC_APP_STORE_URL  — https://apps.apple.com/tr/app/tagora/...
 *   NEXT_PUBLIC_GOOGLE_PLAY_URL — https://play.google.com/store/apps/details?id=com.tagora.qr
 */
const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL;
const GOOGLE_PLAY_URL = process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL;

interface Props {
  variant?: "dark" | "light";
  align?: "start" | "center";
}

export function AppDownloadBadges({ variant = "dark", align = "start" }: Props) {
  return (
    <div className={`flex flex-wrap gap-3 ${align === "center" ? "justify-center" : ""}`}>
      <StoreBadge
        href={APP_STORE_URL}
        variant={variant}
        icon={<AppleIcon />}
        smallText="İndir"
        largeText="App Store"
        comingSoonLabel="Yakında"
      />
      <StoreBadge
        href={GOOGLE_PLAY_URL}
        variant={variant}
        icon={<GooglePlayIcon />}
        smallText="Şuradan indir"
        largeText="Google Play"
        comingSoonLabel="Yakında"
      />
    </div>
  );
}

// ============================================================
// Badge card
// ============================================================
function StoreBadge({
  href,
  variant,
  icon,
  smallText,
  largeText,
  comingSoonLabel,
}: {
  href: string | undefined;
  variant: "dark" | "light";
  icon: React.ReactNode;
  smallText: string;
  largeText: string;
  comingSoonLabel: string;
}) {
  const isActive = !!href;

  const baseClasses =
    "group inline-flex items-center gap-2.5 rounded-xl px-4 py-2.5 transition min-w-[170px]";

  const activeDark =
    "bg-black text-white hover:opacity-90";
  const activeLight =
    "border border-navy/15 bg-white text-navy hover:border-navy/40";

  const inactiveDark =
    "bg-navy/40 text-white/50 cursor-not-allowed relative overflow-hidden";
  const inactiveLight =
    "border border-navy/10 bg-white text-navy/40 cursor-not-allowed relative overflow-hidden";

  const activeClass = variant === "dark" ? activeDark : activeLight;
  const inactiveClass = variant === "dark" ? inactiveDark : inactiveLight;

  const content = (
    <>
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <span className="flex flex-col leading-tight">
        <span className="text-[10px] opacity-70">{smallText}</span>
        <span className="text-base font-bold tracking-tight">{largeText}</span>
      </span>
      {!isActive && (
        <span className="ml-auto rounded-full bg-accent/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-navy">
          {comingSoonLabel}
        </span>
      )}
    </>
  );

  if (isActive) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClasses} ${activeClass}`}
        aria-label={`${smallText} ${largeText}`}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      className={`${baseClasses} ${inactiveClass}`}
      aria-label={`${largeText} yakında`}
      title="Yakında yayında"
    >
      {content}
    </div>
  );
}

// ============================================================
// Icons
// ============================================================
function AppleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function GooglePlayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3.6 2.32c-.34.35-.6.86-.6 1.5v16.36c0 .64.26 1.15.6 1.5l.06.06 9.16-9.16v-.16L3.66 2.26l-.06.06zM16.4 15.76l-3.05-3.05 3.05-3.05 3.6 2.05c1.03.58 1.03 1.53 0 2.11l-3.6 1.94zm-.6.6L4.72 22.75c.34.35.9.4 1.53.05l10.72-6.09-1.16-1.35zm0-8.72L15.85 6.29 5.13 1.9C4.5 1.55 3.94 1.6 3.6 1.95l12.2 5.69z" />
    </svg>
  );
}
