/**
 * Stickers ekranı — kullanıcının kayıtlı sticker'ları.
 */
import { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { Logo } from "@/components/Logo";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing, typography } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import { computeSubscription } from "@/lib/subscription";
import { USE_CASE_LABELS } from "@tagora/shared";
import type { Sticker } from "@tagora/db";

export default function StickersScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const subscription = computeSubscription(profile);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("stickers")
      .select("*")
      .order("created_at", { ascending: false });
    setStickers((data as Sticker[] | null) ?? []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Logo />
        <Pressable
          onPress={() => router.push("/claim")}
          hitSlop={12}
          style={styles.addBtn}
        >
          <Text style={styles.addBtnText}>+ Yeni</Text>
        </Pressable>
      </View>

      <FlatList
        data={stickers}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={colors.navy}
          />
        }
        ListHeaderComponent={
          <View>
            {subscription.shouldShowBanner && (
              <SubscriptionBanner info={subscription} />
            )}
            <Text style={styles.title}>Stickerlarım</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <EmptyState onClaim={() => router.push("/claim")} />
          )
        }
        renderItem={({ item }) => (
          <StickerCard
            sticker={item}
            onPress={() => router.push(`/sticker/${item.id}` as never)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />
    </Screen>
  );
}

function StickerCard({
  sticker,
  onPress,
}: {
  sticker: Sticker;
  onPress: () => void;
}) {
  const useCaseInfo =
    (sticker.use_case && USE_CASE_LABELS[sticker.use_case]) ??
    USE_CASE_LABELS.other;

  const badge =
    sticker.status === "active"
      ? { color: colors.success, label: "Aktif", bg: "#D1FAE5" }
      : sticker.status === "claimed"
        ? { color: colors.warning, label: "Hazır", bg: "#FEF3C7" }
        : { color: colors.muted, label: sticker.status, bg: colors.bgSubtle };

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}>
      <View style={styles.cardTop}>
        <Text style={styles.cardEmoji}>{useCaseInfo.emoji}</Text>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.color }]}>
            {badge.label}
          </Text>
        </View>
      </View>
      <Text style={styles.cardTitle}>
        {sticker.label || `${useCaseInfo.tr} sticker'ı`}
      </Text>
      <Text style={styles.cardMeta}>
        {sticker.scan_count} taranma · <Text style={styles.mono}>/s/{sticker.token}</Text>
      </Text>
    </Pressable>
  );
}

function EmptyState({ onClaim }: { onClaim: () => void }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>📦</Text>
      <Text style={styles.emptyTitle}>Henüz sticker&apos;ın yok</Text>
      <Text style={styles.emptyBody}>
        Elindeki fiziksel sticker&apos;ın QR kodunu kameraya göster ve hesabına
        ekle.
      </Text>
      <Button
        label="QR Kodu Tara"
        onPress={onClaim}
        size="lg"
        style={{ marginTop: spacing.xl }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  addBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  addBtnText: { ...typography.bodyBold, color: colors.navy },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
  title: { ...typography.h2, color: colors.navy, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.navyBorder,
    padding: spacing.lg,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  cardEmoji: { fontSize: 34 },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: { ...typography.tiny, fontWeight: "600" },
  cardTitle: { ...typography.bodyBold, color: colors.navy },
  cardMeta: { ...typography.tiny, color: colors.muted, marginTop: 4 },
  mono: { fontFamily: "monospace", fontSize: 11 },
  empty: {
    alignItems: "center",
    marginTop: spacing.xxxl,
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.navyBorder,
    backgroundColor: colors.bgSubtle,
  },
  emptyEmoji: { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, color: colors.navy, marginBottom: spacing.sm },
  emptyBody: { ...typography.body, color: colors.muted, textAlign: "center" },
});
