/**
 * Bottom tabs — Stickers / Inbox / Profil
 *
 * Android 15 edge-to-edge modda sistem nav bar tab bar'ın altına düşüyor;
 * useSafeAreaInsets ile dinamik yükseklik veriyoruz ki tab butonları
 * sistem butonlarıyla çakışmasın.
 */
import { Tabs } from "expo-router";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, typography } from "@/lib/theme";

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
      <Text style={styles.emoji}>{emoji}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // iOS home indicator (>0) ya da Android nav bar için ekstra yer
  // Minimum 12px padding — dokunma alanı sistem butonlarına çok yakın olmasın
  const bottomPad = Math.max(insets.bottom, 12);
  // Tab bar toplam yükseklik: label (16) + icon (36) + üst padding (8) + alt pad
  const tabHeight = 60 + bottomPad;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { ...typography.tiny, marginTop: 2 },
        tabBarStyle: {
          borderTopColor: colors.navyMuted,
          backgroundColor: colors.bg,
          height: tabHeight,
          paddingTop: 8,
          paddingBottom: bottomPad,
          // Android edge-to-edge modunda absolute positioning gerekmiyor;
          // insets zaten doğru hesaplanıyor
          ...(Platform.OS === "android" && {
            elevation: 8,
          }),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Stickers",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏷️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  iconBoxActive: { backgroundColor: colors.accent },
  emoji: { fontSize: 20 },
});
