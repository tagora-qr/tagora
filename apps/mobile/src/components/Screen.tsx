/**
 * Standart ekran container'ı — SafeArea + padding + status bar rengi.
 */
import { View, StyleSheet, ScrollView, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@/lib/theme";

interface Props {
  children: React.ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  bg?: string;
  edges?: ("top" | "bottom" | "left" | "right")[];
}

export function Screen({
  children,
  scrollable = false,
  padded = true,
  style,
  bg = colors.bg,
  edges = ["top"],
}: Props) {
  const inner = (
    <View
      style={[
        styles.inner,
        padded && { paddingHorizontal: spacing.xl },
        style,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={edges}>
      {scrollable ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  inner: { flex: 1 },
  scrollContent: { flexGrow: 1 },
});
