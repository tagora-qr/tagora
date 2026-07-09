/**
 * Chat ekranı — sahip tarafı, real-time Supabase subscription ile.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { formatRelativeTime } from "@/lib/utils";
import { USE_CASE_LABELS } from "@tagora/shared";
import { colors, radius, spacing, typography } from "@/lib/theme";
import type { Message, StickerUseCase } from "@tagora/db";
import { useAuth } from "@/lib/auth-context";
import { computeSubscription } from "@/lib/subscription";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";

export default function ChatScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const conversationId = params.id;
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const subscription = computeSubscription(profile);

  const [messages, setMessages] = useState<Message[]>([]);
  const [stickerInfo, setStickerInfo] = useState<{
    label: string | null;
    token: string;
    use_case: StickerUseCase | null;
  } | null>(null);
  const [scannerName, setScannerName] = useState<string>("Anonim ziyaretçi");
  const [scannerSessionId, setScannerSessionId] = useState<string | null>(null);
  const [scannerBlocked, setScannerBlocked] = useState<boolean>(false);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  const load = useCallback(async () => {
    // Konuşma bilgisini al (sticker_id + scanner_session_id çekmek için)
    const { data: conv } = await supabase
      .from("conversations")
      .select("sticker_id, scanner_session_id")
      .eq("id", conversationId)
      .maybeSingle();

    if (conv?.sticker_id) {
      const { data: sticker } = await supabase
        .from("stickers")
        .select("label, token, use_case")
        .eq("id", conv.sticker_id)
        .maybeSingle();
      setStickerInfo(sticker as typeof stickerInfo);
    }

    if (conv?.scanner_session_id) {
      setScannerSessionId(conv.scanner_session_id);
      const { data: session } = await supabase
        .from("scanner_sessions")
        .select("display_name, is_blocked")
        .eq("id", conv.scanner_session_id)
        .maybeSingle();
      const sess = session as { display_name: string | null; is_blocked: boolean } | null;
      if (sess?.display_name?.trim()) setScannerName(sess.display_name.trim());
      setScannerBlocked(sess?.is_blocked ?? false);
    }

    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("sent_at", { ascending: true });

    setMessages((msgs as Message[] | null) ?? []);

    // Okunmamış sayacı sıfırla
    await supabase
      .from("conversations")
      .update({ unread_owner_count: 0 })
      .eq("id", conversationId);

    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    void load();

    const channel = supabase
      .channel(`conv-mobile-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, load]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    if (!subscription.canReply) {
      Alert.alert(
        "Cevap yazma kapalı",
        "Aboneliğin sona erdiği için mesaj gönderemiyorsun. Yenilemek için tagora.com.tr/dashboard/subscription adresine git.",
      );
      return;
    }
    setSending(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender: "owner",
        body: text,
      })
      .select("*")
      .single();
    setSending(false);

    if (error || !data) {
      Alert.alert("Hata", error?.message ?? "Mesaj gönderilemedi.");
      return;
    }
    setDraft("");
    setMessages((prev) =>
      prev.some((x) => x.id === data.id) ? prev : [...prev, data as Message],
    );
  };

  const info =
    (stickerInfo?.use_case && USE_CASE_LABELS[stickerInfo.use_case]) ??
    USE_CASE_LABELS.other;

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color={colors.navy} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Text style={styles.back}>← Inbox</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.headerRow}>
            <Text style={styles.headerEmoji}>{info.emoji}</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {scannerName}
            </Text>
          </View>
          <Text style={styles.headerSub} numberOfLines={1}>
            {scannerBlocked ? "🚫 Engelli · " : ""}
            {stickerInfo?.label ? `${stickerInfo.label} · ` : ""}
            {stickerInfo?.token ? `/s/${stickerInfo.token}` : ""}
          </Text>
        </View>
        <Pressable
          hitSlop={16}
          onPress={() => {
            Alert.alert(
              scannerName,
              scannerBlocked
                ? `${scannerName} şu anda engelli — sana mesaj gönderemez.`
                : `${scannerName} ile konuşma seçenekleri:`,
              [
                {
                  text: scannerBlocked ? "🔓 Engeli kaldır" : "🚫 Kişiyi engelle",
                  style: scannerBlocked ? "default" : "destructive",
                  onPress: async () => {
                    if (!scannerSessionId) {
                      Alert.alert("Hata", "Scanner session bulunamadı.");
                      return;
                    }
                    const nextValue = !scannerBlocked;
                    const { data: updated, error } = await supabase
                      .from("scanner_sessions")
                      .update({ is_blocked: nextValue })
                      .eq("id", scannerSessionId)
                      .select("id");
                    if (error) {
                      Alert.alert("Hata", error.message);
                      return;
                    }
                    if (!updated || updated.length === 0) {
                      Alert.alert(
                        "Değiştirilemedi",
                        "Bu scanner'ı bloklama yetkin olmayabilir. Yönetici ile iletişime geç.",
                      );
                      return;
                    }
                    setScannerBlocked(nextValue);
                    Alert.alert(
                      nextValue ? "Kişi engellendi" : "Engel kaldırıldı",
                      nextValue
                        ? `${scannerName} artık sana mesaj gönderemez.`
                        : `${scannerName} tekrar mesaj gönderebilir.`,
                    );
                  },
                },
                {
                  text: "🗑️ Konuşmayı sil",
                  style: "destructive",
                  onPress: () => {
                    Alert.alert(
                      "Konuşmayı sil",
                      `${scannerName} ile olan tüm mesajlar ve konuşma kalıcı olarak silinir. Bu işlem geri alınamaz.`,
                      [
                        { text: "Vazgeç", style: "cancel" },
                        {
                          text: "Sil",
                          style: "destructive",
                          onPress: async () => {
                            const { error: msgErr } = await supabase
                              .from("messages")
                              .delete()
                              .eq("conversation_id", conversationId);
                            if (msgErr) {
                              Alert.alert("Hata (mesajlar)", msgErr.message);
                              return;
                            }
                            const { data: deleted, error } = await supabase
                              .from("conversations")
                              .delete()
                              .eq("id", conversationId)
                              .select("id");
                            if (error) {
                              Alert.alert("Hata", error.message);
                              return;
                            }
                            if (!deleted || deleted.length === 0) {
                              Alert.alert(
                                "Silinemedi",
                                "Konuşma silme yetkin yok görünüyor.",
                              );
                              return;
                            }
                            router.back();
                          },
                        },
                      ],
                    );
                  },
                },
                { text: "Vazgeç", style: "cancel" },
              ],
            );
          }}
        >
          <Text style={styles.menuBtn}>⋯</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Bubble message={item} scannerName={scannerName} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          ListEmptyComponent={
            <Text style={styles.emptyChat}>Henüz mesaj yok.</Text>
          }
        />

        {subscription.shouldShowBanner && (
          <SubscriptionBanner info={subscription} compact />
        )}

        <View
          style={[
            styles.compose,
            { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm },
          ]}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={
              subscription.canReply
                ? "Cevap yaz…"
                : "🔒 Aboneliğini yenile — cevap yazma kapalı"
            }
            placeholderTextColor={colors.muted}
            style={[
              styles.composeInput,
              !subscription.canReply && styles.composeInputLocked,
            ]}
            multiline
            maxLength={2000}
            editable={subscription.canReply}
          />
          <Pressable
            onPress={send}
            disabled={sending || !draft.trim() || !subscription.canReply}
            style={[
              styles.sendBtn,
              (!draft.trim() || sending || !subscription.canReply) && {
                opacity: 0.4,
              },
            ]}
          >
            <Text style={styles.sendBtnText}>{sending ? "…" : "Gönder"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({
  message,
  scannerName,
}: {
  message: Message;
  scannerName: string;
}) {
  const isMine = message.sender === "owner";
  const isSystem = message.sender === "system";

  if (isSystem) {
    return (
      <View style={styles.systemWrap}>
        <View style={styles.systemBubble}>
          <Text style={styles.systemText}>{message.body}</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.bubbleWrap,
        isMine ? styles.bubbleWrapMine : styles.bubbleWrapTheirs,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleTheirs,
        ]}
      >
        <Text
          style={[
            styles.bubbleSender,
            isMine ? { color: colors.accent } : { color: colors.navy, opacity: 0.7 },
          ]}
        >
          {isMine ? "SEN" : scannerName.toUpperCase()}
        </Text>
        <Text
          style={[
            styles.bubbleText,
            isMine ? { color: "#FFF" } : { color: colors.charcoal },
          ]}
        >
          {message.body}
        </Text>
        <Text
          style={[
            styles.bubbleTime,
            isMine ? { color: "rgba(255,255,255,0.6)" } : { color: colors.muted },
          ]}
        >
          {formatRelativeTime(message.sent_at)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.navyMuted,
    gap: spacing.md,
  },
  back: { ...typography.bodyBold, color: colors.navy },
  deleteBtn: { ...typography.bodyBold, color: colors.danger },
  menuBtn: { fontSize: 24, color: colors.navy, fontWeight: "700", paddingHorizontal: 8 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerEmoji: { fontSize: 20 },
  headerTitle: { ...typography.bodyBold, color: colors.navy },
  headerSub: { ...typography.tiny, color: colors.muted, marginTop: 2, fontFamily: "monospace" },
  listContent: { padding: spacing.lg, flexGrow: 1 },
  emptyChat: { ...typography.body, color: colors.muted, textAlign: "center", marginTop: spacing.xxxl },
  bubbleWrap: { maxWidth: "80%" },
  bubbleWrapMine: { alignSelf: "flex-end" },
  bubbleWrapTheirs: { alignSelf: "flex-start" },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
  },
  bubbleMine: { backgroundColor: colors.navy },
  bubbleTheirs: { backgroundColor: colors.navyMuted },
  bubbleText: { ...typography.body, lineHeight: 22 },
  bubbleTime: { ...typography.tiny, fontSize: 10, marginTop: 4 },
  bubbleSender: { fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 2 },
  systemWrap: { alignItems: "center" },
  systemBubble: {
    backgroundColor: colors.navyMuted,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  systemText: { ...typography.tiny, color: colors.muted },
  compose: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.navyMuted,
    // paddingBottom inline olarak veriliyor — safe area insets'e göre
  },
  composeInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.navyBorder,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: colors.charcoal,
  },
  composeInputLocked: {
    backgroundColor: "#F3F4F6",
    borderColor: "#FCA5A5",
    color: colors.muted,
  },
  sendBtn: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.lg,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnText: { ...typography.bodyBold, color: "#FFF" },
});
