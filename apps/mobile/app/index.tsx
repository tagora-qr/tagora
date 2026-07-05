/**
 * Kök route — sadece splash / loading gösterir.
 * Auth guard (_layout.tsx içinde) session'a göre redirect eder.
 */
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "@/lib/theme";

export default function Index() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.navy} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
});
