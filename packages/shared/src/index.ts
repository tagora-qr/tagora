export * from "./token";
export * from "./quick-templates";
export * from "./moderation";

// Brand sabitleri
export const TAGORA = {
  name: "Tagora",
  tagline: {
    tr: "Bir QR, sonsuz bağlantı.",
    en: "One QR, endless connections.",
  },
  longTagline: {
    tr: "Ulaşılabilir kal, anonim kal.",
    en: "Stay reachable, stay private.",
  },
  colors: {
    navy: "#0F1B3D",
    accent: "#D4F36A",
    charcoal: "#1F2937",
    gray: "#6B7280",
    lightGray: "#F3F4F6",
  },
} as const;
