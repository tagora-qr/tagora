/**
 * Tagora logo — SVG olmadan minimal, StyleSheet ile.
 * Web'deki SVG logonun native karşılığı.
 */
import { View, Text, StyleSheet } from "react-native";
import { colors, radius, spacing } from "@/lib/theme";

interface Props {
  variant?: "default" | "light";
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
}

export function Logo({
  variant = "default",
  size = "md",
  showWordmark = true,
}: Props) {
  const dim = size === "sm" ? 28 : size === "lg" ? 44 : 34;
  const fontSize = size === "sm" ? 16 : size === "lg" ? 24 : 20;
  const fg = variant === "light" ? "#FFFFFF" : colors.navy;

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.box,
          {
            width: dim,
            height: dim,
            backgroundColor: fg,
            borderRadius: radius.md,
          },
        ]}
      >
        {/* T harfi */}
        <View
          style={[
            styles.tBar,
            {
              width: dim * 0.55,
              backgroundColor: colors.accent,
              top: dim * 0.28,
            },
          ]}
        />
        <View
          style={[
            styles.tStem,
            {
              width: dim * 0.12,
              height: dim * 0.5,
              backgroundColor: colors.accent,
              top: dim * 0.28,
              left: dim * 0.44,
            },
          ]}
        />
      </View>
      {showWordmark && (
        <Text
          style={[
            styles.wordmark,
            { fontSize, color: fg, marginLeft: spacing.sm },
          ]}
        >
          Tagora
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  box: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  tBar: { height: 4, position: "absolute", borderRadius: 2 },
  tStem: { position: "absolute", borderRadius: 2 },
  wordmark: { fontWeight: "700", letterSpacing: -0.5 },
});
