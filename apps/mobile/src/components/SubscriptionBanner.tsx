/**
 * SubscriptionBanner — abonelik durumuna göre uyarı barı.
 *
 * "compact" prop'u kısa versiyon için — chat ekranı gibi az yerin olduğu
 * sayfalarda kullanılır.
 *
 * Yenile CTA → web dashboard'a yönlendirir (mobil'de payment akışı yok).
 */
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/lib/theme";
import type { SubscriptionInfo } from "@/lib/subscription";

const RENEW_URL = "https://tagora.com.tr/dashboard/subscription";

interface Props {
  info: SubscriptionInfo;
  compact?: boolean;
}

export function SubscriptionBanner({ info, compact = false }: Props) {
  if (!info.shouldShowBanner) return null;

  const style = getStyleForState(info.state);
  const message = getMessage(info, compact);

  const openRenew = () => {
    Linking.openURL(RENEW_URL).catch(() => {
      // Sessizce yut — kullanıcı sonra tekrar deneyecek
    });
  };

  return (
    <View style={[styles.banner, style.container, compact && styles.compact]}>
      <View style={styles.textCol}>
        <Text style={[styles.title, style.title, compact && styles.titleCompact]}>
          {message.title}
        </Text>
        {!compact && (
          <Text style={[styles.body, style.body]}>{message.body}</Text>
        )}
      </View>
      <Pressable
        onPress={openRenew}
        style={[styles.cta, style.cta]}
        hitSlop={8}
      >
        <Text style={[styles.ctaText, style.ctaText]}>
          {compact ? "Yenile" : "Yenile →"}
        </Text>
      </Pressable>
    </View>
  );
}

function getMessage(info: SubscriptionInfo, compact: boolean) {
  switch (info.state) {
    case "warning":
      return {
        title: compact
          ? `Aboneliğin ${info.daysRemaining} gün sonra bitiyor`
          : `Aboneliğin ${info.daysRemaining} gün sonra bitiyor`,
        body: "Kesintisiz kullanım için hemen yenile — 99 TL/yıl.",
      };
    case "grace":
      return {
        title: "Aboneliğin sona erdi",
        body: `${info.daysUntilReadonly} gün ek süren var. Ondan sonra cevap yazma kapatılacak.`,
      };
    case "readonly":
      return {
        title: "🔒 Cevap yazma kapalı",
        body: "Aboneliğini yenile — sadece 99 TL/yıl.",
      };
    default:
      return { title: "", body: "" };
  }
}

function getStyleForState(state: SubscriptionInfo["state"]) {
  switch (state) {
    case "warning":
      return {
        container: { backgroundColor: "#FEF3C7", borderColor: colors.warning },
        title: { color: "#78350F" },
        body: { color: "#78350F" },
        cta: { backgroundColor: colors.warning },
        ctaText: { color: "#FFFFFF" },
      };
    case "grace":
      return {
        container: { backgroundColor: "#FED7AA", borderColor: "#EA580C" },
        title: { color: "#7C2D12" },
        body: { color: "#7C2D12" },
        cta: { backgroundColor: "#EA580C" },
        ctaText: { color: "#FFFFFF" },
      };
    case "readonly":
      return {
        container: { backgroundColor: "#FEE2E2", borderColor: colors.danger },
        title: { color: "#7F1D1D" },
        body: { color: "#7F1D1D" },
        cta: { backgroundColor: colors.danger },
        ctaText: { color: "#FFFFFF" },
      };
    default:
      return {
        container: { backgroundColor: colors.bgSubtle, borderColor: colors.navyBorder },
        title: { color: colors.navy },
        body: { color: colors.charcoal },
        cta: { backgroundColor: colors.navy },
        ctaText: { color: colors.accent },
      };
  }
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  compact: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: 0,
    marginTop: 0,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
  },
  textCol: {
    flex: 1,
  },
  title: {
    ...typography.bodyBold,
    fontSize: 14,
    marginBottom: 2,
  },
  titleCompact: {
    fontSize: 13,
    marginBottom: 0,
  },
  body: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
  },
  cta: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  ctaText: {
    ...typography.tiny,
    fontSize: 12,
    fontWeight: "700",
  },
});
