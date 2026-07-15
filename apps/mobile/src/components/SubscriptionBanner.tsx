/**
 * SubscriptionBanner — abonelik durumuna göre bilgi barı.
 *
 * Sadece durum bilgisi gösterir; satın alma / yenileme akışı MOBİLDE YOK.
 * Kullanıcı hesap yönetimini tagora.com.tr üzerinden yapar (fiziksel sticker
 * + backend hizmeti — App Store Guideline 3.1.5 kapsamında).
 *
 * "compact" prop'u kısa versiyon için — chat ekranı gibi az yerin olduğu
 * sayfalarda kullanılır.
 */
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/lib/theme";
import type { SubscriptionInfo } from "@/lib/subscription";

interface Props {
  info: SubscriptionInfo;
  compact?: boolean;
}

export function SubscriptionBanner({ info, compact = false }: Props) {
  if (!info.shouldShowBanner) return null;

  const style = getStyleForState(info.state);
  const message = getMessage(info, compact);

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
    </View>
  );
}

function getMessage(info: SubscriptionInfo, compact: boolean) {
  switch (info.state) {
    case "warning":
      return {
        title: compact
          ? `Süren ${info.daysRemaining} gün sonra doluyor`
          : `Süren ${info.daysRemaining} gün sonra doluyor`,
        body: "Hesap yönetimi tagora.com.tr üzerinden yapılır.",
      };
    case "grace":
      return {
        title: "Süren doldu",
        body: `${info.daysUntilReadonly} gün ek süren var. Ondan sonra cevap yazma kapatılacak.`,
      };
    case "readonly":
      return {
        title: "🔒 Cevap yazma kapalı",
        body: "Hesap yönetimi tagora.com.tr üzerinden yapılır.",
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
      };
    case "grace":
      return {
        container: { backgroundColor: "#FED7AA", borderColor: "#EA580C" },
        title: { color: "#7C2D12" },
        body: { color: "#7C2D12" },
      };
    case "readonly":
      return {
        container: { backgroundColor: "#FEE2E2", borderColor: colors.danger },
        title: { color: "#7F1D1D" },
        body: { color: "#7F1D1D" },
      };
    default:
      return {
        container: { backgroundColor: colors.bgSubtle, borderColor: colors.navyBorder },
        title: { color: colors.navy },
        body: { color: colors.charcoal },
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
});
