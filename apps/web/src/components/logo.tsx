/**
 * Tagora logo — geometrik T + QR kareleri dokusuyla
 */
import { clsx } from "clsx";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  variant?: "default" | "light";
}

export function Logo({
  className,
  showWordmark = true,
  variant = "default",
}: LogoProps) {
  const fillColor = variant === "light" ? "#FFFFFF" : "#0F1B3D";

  return (
    <div className={clsx("inline-flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 40 40"
        width="32"
        height="32"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Geometrik T harfi + QR dokulu */}
        <rect x="4" y="4" width="32" height="32" rx="8" fill={fillColor} />
        <rect x="9" y="10" width="22" height="4" fill="#D4F36A" />
        <rect x="18" y="14" width="4" height="18" fill="#D4F36A" />
        {/* QR detayları */}
        <rect x="9" y="26" width="3" height="3" fill="#D4F36A" />
        <rect x="28" y="26" width="3" height="3" fill="#D4F36A" />
      </svg>
      {showWordmark && (
        <span
          className={clsx(
            "text-xl font-bold tracking-tight",
            variant === "light" ? "text-white" : "text-navy",
          )}
        >
          Tagora
        </span>
      )}
    </div>
  );
}
