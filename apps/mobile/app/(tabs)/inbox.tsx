/**
 * Inbox — sahibe gelen anonim konuşmalar.
 * Web'deki gibi iki ayrı sorgu (join RLS recursion'ından kaçınmak için).
 */
import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { supabase } from "@/lib/supabase";
import { formatRelativeTime } from "@/lib/utils";
import { USE_CASE_LABELS } from "@tagora/shared";
import { colors, radius, spacing, typography } from "@/lib/theme";
import type { Conversation, StickerUseCase } from "@tagora/db";

interface InboxItem {
  id: string;
  sticker_id: string;
  scanner_session_id: string;
  last_message_at: string | null;
  unread_owner_count: number;
  scanner_name: string;
  sticker: {
    token: string;
    label: string | null;
    use_case: StickerUseCase | null;
  } | null;
}

export default function InboxScreen() {
  const router = useRouter();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data: convs } = await supabase
      .from("conversations")
      .select("id, sticker_id, scanner_session_id, last_message_at, unread_owner_count")
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(50);

    const convList = (convs as Pick<
      Conversation,
      "id" | "sticker_id" | "scanner_session_id" | "last_message_at" | "unread_owner_count"
    >[] | null) ?? [];
    const stickerIds = convList.map((c) => c.sticker_id).filter(Boolean);
    const sessionIds = convList.map((c) => c.scanner_session_id).filter(Boolean);

    let stickers: { id: string; token: string; label: string | null; use_case: StickerUseCase | null }[] = [];
    if (stickerIds.length > 0) {
      const { data } = await supabase
        .from("stickers")
        .select("id, token, label, use_case")
        .in("id", stickerIds);
      stickers = (data as typeof stickers | null) ?? [];
    }

    let sessions: { id: string; display_name: string | null }[] = [];
    if (sessionIds.length > 0) {
      const { data } = await supabase
        .from("scanner_sessions")
        .select("id, display_name")
        .in("id", sessionIds);
      sessions = (data as typeof sessions | null) ?? [];
    }

    const stickerMap = new Map(stickers.map((s) => [s.id, s]));
    const sessionMap = new Map(sessions.map((s) => [s.id, s]));

    const merged: InboxItem[] = convList.map((c) => {
      const s = stickerMap.get(c.sticker_id);
      const sess = sessionMap.get(c.scanner_session_id);
      const name = sess?.display_name?.trim() || "Anonim ziyaretçi";
      return {
        id: c.id,
        sticker_id: c.sticker_id,
        scanner_session_id: c.scanner_session_id,
        last_message_at: c.last_message_at,
        unread_owner_count: c.unread_owner_count,
        scanner_name: name,
        sticker: s
          ? { token: s.token, label: s.label, use_case: s.use_case }
          : null,
      };
    });
    setItems(merged);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <Screen padded={false}>
      <FlatList
        data={items}
        keyExtractor={(x) => x.id}
        contentContainerStyle={styles.content}
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
        ListHeaderComponent={<Text style={styles.title}>Inbox</Text>}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyBody}>
                Henüz mesaj yok. Birisi sticker&apos;ını tarayınca burada
                görürsün.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <ConversationRow item={item} onPress={() => router.push(`/inbox/${item.id}`)} />
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />
    </Screen>
  );
}

function ConversationRow({
  item,
  onPress,
}: {
  item: InboxItem;
  onPress: () => void;
}) {
  const info =
    (item.sticker?.use_case && USE_CASE_LABELS[item.sticker.use_case]) ??
    USE_CASE_LABELS.other;

  const stickerLabel = item.sticker?.label || info.tr;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: colors.navyMuted },
      ]}
    >
      <Text style={styles.rowEmoji}>{info.emoji}</Text>
      <View style={styles.rowMain}>
        <View style={styles.rowLine}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.scanner_name}
          </Text>
          <Text style={styles.rowTime}>
            {item.last_message_at ? formatRelativeTime(item.last_message_at) : "—"}
          </Text>
        </View>
        <Text style={styles.rowSub} numberOfLines={1}>
          {stickerLabel}
          {item.sticker?.token ? ` · /s/${item.sticker.token}` : ""}
        </Text>
      </View>
      {item.unread_owner_count > 0 && (
        <View style={styles.unread}>
          <Text style={styles.unreadText}>{item.unread_owner_count}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: 40 },
  title: { ...typography.h2, color: colors.navy, marginBottom: spacing.lg },
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
  emptyEmoji: { fontSize: 44, marginBottom: spacing.md },
  emptyBody: { ...typography.body, color: colors.muted, textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  rowEmoji: { fontSize: 26 },
  rowMain: { flex: 1 },
  rowLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowTitle: { ...typography.bodyBold, color: colors.navy, flex: 1, marginRight: spacing.sm },
  rowTime: { ...typography.tiny, color: colors.muted },
  rowSub: { ...typography.tiny, color: colors.muted, marginTop: 2 },
  unread: {
    backgroundColor: colors.accent,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: { ...typography.tiny, color: colors.navy, fontWeight: "700" },
  sep: { height: 1, backgroundColor: colors.navyMuted },
});
