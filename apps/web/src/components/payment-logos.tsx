/**
 * PaymentLogos — iyzico + Visa + MasterCard logo satırı.
 *
 * iyzico sanal POS onayı için gerekli görsellik — footer, shop, checkout
 * sayfalarında görünür yerlere konur.
 *
 * Boyut varyantları:
 *  - sm: küçük satır (footer için, height 24px)
 *  - md: orta (checkout aside için, height 32px)
 *  - lg: büyük (trust banner için, height 44px)
 */
import Image from "next/image";

interface Props {
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Başlık göster mi? "Güvenli Ödeme" etiketi. Default false. */
  showLabel?: boolean;
}

const HEIGHTS = { sm: 24, md: 32, lg: 44 };
const IYZICO_WIDTHS = { sm: 96, md: 128, lg: 176 };
const CARD_WIDTHS = { sm: 38, md: 50, lg: 68 };

export function PaymentLogos({
  size = "md",
  className = "",
  showLabel = false,
}: Props) {
  const h = HEIGHTS[size];
  const iyzicoW = IYZICO_WIDTHS[size];
  const cardW = CARD_WIDTHS[size];

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {showLabel && (
        <p className="text-xs font-semibold uppercase tracking-wider text-charcoal/60">
          Güvenli Ödeme
        </p>
      )}
      <div className="flex items-center gap-3 flex-wrap">
        <Image
          src="/payment/iyzico-ile-ode.svg"
          alt="iyzico ile Öde"
          width={iyzicoW}
          height={h}
          style={{ height: h, width: "auto" }}
          unoptimized
        />
        <Image
          src="/payment/visa.svg"
          alt="Visa"
          width={cardW}
          height={h}
          style={{ height: h, width: "auto" }}
          unoptimized
        />
        <Image
          src="/payment/mastercard.svg"
          alt="Mastercard"
          width={cardW}
          height={h}
          style={{ height: h, width: "auto" }}
          unoptimized
        />
      </div>
    </div>
  );
}
