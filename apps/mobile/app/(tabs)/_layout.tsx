/**
 * Bottom tabs — Stickers / Inbox / Profil
 */
import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius, typography } from "@/lib/theme";

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
      <Text style={styles.emoji}>{emoji}</Text>
    </View>
  );
}

export default function TabsLayout() {
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
          height: 78,
          paddingTop: 8,
          paddingBottom: 22,
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
