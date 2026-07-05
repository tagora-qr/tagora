/**
 * Tagora tema tokens — StyleSheet için.
 * Web'deki Tailwind config ile aynı değerler.
 */

export const colors = {
  navy: "#0F1B3D",
  navy800: "#19243D",
  navy600: "#324876",
  navyMuted: "rgba(15, 27, 61, 0.08)",
  navyBorder: "rgba(15, 27, 61, 0.12)",
  accent: "#D4F36A",
  accentSoft: "#F1FAD5",
  charcoal: "#1F2937",
  muted: "#6B7280",
  bg: "#FFFFFF",
  bgSubtle: "#F9FAFB",
  danger: "#DC2626",
  success: "#059669",
  warning: "#D97706",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

export const typography = {
  h1: { fontSize: 32, fontWeight: "700" as const, lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: "700" as const, lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: "600" as const, lineHeight: 28 },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 24 },
  bodyBold: { fontSize: 16, fontWeight: "600" as const, lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: "400" as const, lineHeight: 20 },
  tiny: { fontSize: 12, fontWeight: "500" as const, lineHeight: 16 },
} as const;

export const shadow = {
  sm: {
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;
