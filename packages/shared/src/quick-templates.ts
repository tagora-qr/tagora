/**
 * Scanner sayfasında gösterilen hızlı mesaj şablonları.
 * Use-case bazlı kategorize edilmiş, TR ve EN versiyonlu.
 */

import type { StickerUseCase, Locale } from "@tagora/db";

export interface QuickTemplate {
  id: string;
  body_tr: string;
  body_en: string;
  emoji?: string;
}

export const QUICK_TEMPLATES: Record<StickerUseCase, QuickTemplate[]> = {
  vehicle: [
    {
      id: "blocking-exit",
      emoji: "🚗",
      body_tr: "Aracınız çıkışı kapatıyor, çekebilir misiniz?",
      body_en: "Your vehicle is blocking the exit, could you move it?",
    },
    {
      id: "wrong-park",
      emoji: "🅿️",
      body_tr: "Aracınız hatalı park edilmiş, lütfen kaldırın.",
      body_en: "Your vehicle is incorrectly parked, please move it.",
    },
    {
      id: "scratched",
      emoji: "💥",
      body_tr: "Aracınıza bir araç çarpmış olabilir, kontrol edebilir misiniz?",
      body_en: "Your vehicle may have been hit, could you check?",
    },
    {
      id: "window-open",
      emoji: "🪟",
      body_tr: "Aracınızın camı açık kalmış.",
      body_en: "Your vehicle's window is open.",
    },
    {
      id: "lights-on",
      emoji: "💡",
      body_tr: "Aracınızın farları açık kalmış.",
      body_en: "Your vehicle's lights are on.",
    },
  ],
  door: [
    {
      id: "cargo-arrived",
      emoji: "📦",
      body_tr: "Kargonuzu getirdim, evde misiniz?",
      body_en: "I brought your package, are you home?",
    },
    {
      id: "visitor",
      emoji: "👋",
      body_tr: "Sizi görmeye geldim, müsait misiniz?",
      body_en: "I came to see you, are you available?",
    },
    {
      id: "delivery-failed",
      emoji: "🛵",
      body_tr: "Siparişinizi teslim edemedim, bilgi verir misiniz?",
      body_en: "I couldn't deliver your order, could you give me info?",
    },
  ],
  pet: [
    {
      id: "found-pet",
      emoji: "🐶",
      body_tr: "Evcil hayvanınızı buldum, güvendeyim. Nasıl ulaşalım?",
      body_en: "I found your pet, it's safe with me. How do we meet?",
    },
    {
      id: "pet-injured",
      emoji: "🚨",
      body_tr: "Evcil hayvanınız yaralı görünüyor, acil ulaşmamız gerek.",
      body_en: "Your pet seems injured, we need to reach you urgently.",
    },
  ],
  luggage: [
    {
      id: "found-luggage",
      emoji: "🧳",
      body_tr: "Bagajınızı buldum, nasıl iletebilirim?",
      body_en: "I found your luggage, how can I return it?",
    },
  ],
  bike: [
    {
      id: "bike-attention",
      emoji: "🚴",
      body_tr: "Bisikletinizle ilgili dikkat çekici bir durum var.",
      body_en: "There's something noteworthy about your bike.",
    },
  ],
  other: [
    {
      id: "found-item",
      emoji: "🔍",
      body_tr: "Eşyanızı buldum, ulaşmak ister misiniz?",
      body_en: "I found your item, would you like me to return it?",
    },
  ],
};

export function getQuickTemplates(
  useCase: StickerUseCase | null | undefined,
  locale: Locale = "tr",
): { id: string; emoji?: string; body: string }[] {
  const list =
    (useCase && QUICK_TEMPLATES[useCase]) ?? QUICK_TEMPLATES.other ?? [];
  return list.map((t) => ({
    id: t.id,
    emoji: t.emoji,
    body: locale === "en" ? t.body_en : t.body_tr,
  }));
}

export const USE_CASE_LABELS: Record<StickerUseCase, { tr: string; en: string; emoji: string }> = {
  vehicle: { tr: "Araç", en: "Vehicle", emoji: "🚗" },
  door: { tr: "Kapı / Zil", en: "Door / Bell", emoji: "🚪" },
  pet: { tr: "Evcil Hayvan", en: "Pet", emoji: "🐕" },
  luggage: { tr: "Bagaj", en: "Luggage", emoji: "🧳" },
  bike: { tr: "Bisiklet / Scooter", en: "Bike / Scooter", emoji: "🚴" },
  other: { tr: "Diğer", en: "Other", emoji: "🏷️" },
};
