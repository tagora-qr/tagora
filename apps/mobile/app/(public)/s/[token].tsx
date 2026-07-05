/**
 * Scanner ekranı — /s/[token]
 *
 * Universal Link (tagora.link/s/xxxxx) tarandığında burası açılır.
 * Anonim ziyaretçi bu ekrandan sticker sahibine mesaj yollar.
 *
 * Akış (web'deki scanner-client.tsx ile birebir aynı):
 *   FORM → SENDING → CHAT (real-time subscribe)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { supabase } from "@/lib/supabase";
import { createSupabaseScannerClient } from "@/lib/supabase-scanner";
import {
  getScannerSession,
  setScannerSession,
} from "@/lib/scanner-storage";
import { colors, radius, spacing, typography, shadow } from "@/lib/theme";
import {
  getQuickTemplates,
  moderateMessage,
  USE_CASE_LABELS,
  type StickerUseCase,
} from "@tagora/shared";

const APP_URL = process.env.EXPO_PUBLIC_APP_URL ?? "https://tagora.com.tr";

type Phase = "loading" | "form" | "sending" | "chat" | "not_found";

interface ChatMessage {
  id: string;
  sender: "owner" | "scanner" | "system";
  body: string;
  sent_at: string;
}

interface StickerInfo {
  use_case: StickerUseCase | null;
  label: string | null;
}

export default function ScannerScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [phase, setPhase] = useState<Phase>("loading");
  const [sticker, setSticker] = useState<StickerInfo | null>(null);

  const [body, setBody] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const flatListRef = useRef<FlatList>(null);

  // 1) Sticker doğrula + varsa mevcut session'ı hydrate et
  useEffect(() => {
    if (!token || !/^[0-9A-Za-z]{10}$/.test(token)) {
      setPhase("not_found");
      return;
    }

    let cancelled = false;

    (async () => {
      const { data: pub, error: pubErr } = await supabase
        .from("sticker_public_info")
        .select("use_case, label")
        .eq("token", token)
        .maybeSingle();

      if (cancelled) return;

      if (pubErr || !pub) {
        setPhase("not_found");
        return;
      }
      setSticker(pub as StickerInfo);

      // Mevcut session var mı?
      const existing = await getScannerSession(token);
      if (cancelled) return;

      if (existing) {
        setSessionToken(existing);
        await hydrateConversation(existing);
      } else {
        setPhase("form");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // 2) Realtime subscription — best-effort (WebSocket'te x-scanner-session
  //    header'ı gitmediği için RLS fail edebiliyor; polling fallback aşağıda).
  useEffect(() => {
    if (!conversationId || !sessionToken) return;

    const scannerClient = createSupabaseScannerClient(sessionToken);
    const channel = scannerClient
      .channel(`scan-conv-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev, m],
          );
        },
      )
      .subscribe();

    return () => {
      void scannerClient.removeChannel(channel);
    };
  }, [conversationId, sessionToken]);

  // 2b) Polling fallback — 3 saniye interval, service_role endpoint ile RLS bypass
  useEffect(() => {
    if (!conversationId || !sessionToken) return;

    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(`${APP_URL}/api/scanner/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_token: sessionToken,
            conversation_id: conversationId,
          }),
        });
        const json = (await res.json()) as
          | { ok: true; messages: ChatMessage[] }
          | { ok: false; error: string };
        if (cancelled || !json.ok) return;
        setMessages((prev) => {
          const known = new Set(prev.map((m) => m.id));
          const additions = json.messages.filter((m) => !known.has(m.id));
          return additions.length ? [...prev, ...additions] : prev;
        });
      } catch (e) {
        console.warn("[scanner] polling failed", e);
      }
    };

    const interval = setInterval(tick, 3000);
    void tick();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [conversationId, sessionToken]);

  // 3) Chat mesajları güncellendiğinde en alta scroll
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const hydrateConversation = useCallback(async (sessionTok: string) => {
    try {
      // x-scanner-session header ile RLS bypass — web'deki scanner client ile aynı.
      const scannerClient = createSupabaseScannerClient(sessionTok);
      const { data: convs } = await scannerClient
        .from("conversations")
        .select("id, messages(id, sender, body, sent_at)")
        .order("created_at", { ascending: false })
        .limit(1);

      const conv = convs?.[0];
      if (conv) {
        setConversationId(conv.id);
        const msgs = ((conv as unknown as { messages?: ChatMessage[] }).messages ?? [])
          .sort((a, b) => a.sent_at.localeCompare(b.sent_at));
        setMessages(msgs);
        setPhase("chat");
      } else {
        setPhase("form");
      }
    } catch (e) {
      console.warn("[scanner] hydrate failed", e);
      setPhase("form");
    }
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // Client-side moderation pre-check
      const verdict = moderateMessage(trimmed);
      if (!verdict.allowed) {
        setError(
          verdict.reason === "threat"
            ? "Tehdit içerikli mesajlara izin verilmiyor."
            : verdict.reason === "phishing"
              ? "Phishing veya kişisel bilgi taşıyan mesajlar bloke edilir."
              : "Mesaj kurallarımızla uyumlu değil.",
        );
        return;
      }

      setError(null);
      setPhase("sending");

      try {
        const res = await fetch(`${APP_URL}/api/scanner/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sticker_token: token,
            scanner_session_token: sessionToken,
            display_name: displayName.trim() || null,
            body: trimmed,
          }),
        });

        const json = (await res.json()) as
          | {
              ok: true;
              session_token: string;
              conversation_id: string;
              message: ChatMessage;
            }
          | { ok: false; error: string };

        if (!json.ok) {
          setError(json.error);
          setPhase("form");
          return;
        }

        await setScannerSession(token!, json.session_token);
        setSessionToken(json.session_token);
        setConversationId(json.conversation_id);
        setMessages((prev) => [...prev, json.message]);
        setBody("");
        setPhase("chat");
      } catch (e) {
        console.error("[scanner] send failed", e);
        setError("Bağlantı hatası. Tekrar dene.");
        setPhase("form");
      }
    },
    [token, sessionToken, displayName],
  );

  // ============================== UI ==============================

  if (phase === "loading") {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navy} />
      </SafeAreaView>
    );
  }

  if (phase === "not_found") {
    return (
      <SafeAreaView style={styles.centered}>
        <View style={styles.card}>
          <Text style={styles.emojiBig}>🔍</Text>
          <Text style={styles.h2}>Bu sticker bulunamadı</Text>
          <Text style={styles.muted}>
            QR kod geçersiz olabilir veya sticker henüz sahibine eşlenmemiş.
          </Text>
          <Pressable style={styles.btnPrimary} onPress={() => router.replace("/")}>
            <Text style={styles.btnPrimaryText}>Ana sayfaya dön</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const useCaseInfo =
    (sticker?.use_case && USE_CASE_LABELS[sticker.use_case]) ??
    USE_CASE_LABELS.other;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* Sticker context banner */}
        <View style={styles.contextCard}>
          <View style={styles.contextRow}>
            <Text style={styles.emoji}>{useCaseInfo.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.contextTag}>{useCaseInfo.tr.toUpperCase()}</Text>
              <Text style={styles.contextTitle}>
                {sticker?.label || `${useCaseInfo.tr} sahibi`}
              </Text>
            </View>
          </View>
          <Text style={styles.contextSubtitle}>
            Bu sticker sahibiyle anonim mesajlaşabilirsin.
          </Text>
          <Text style={styles.contextPrivacy}>
            🔒 Telefonun, kimliğin, lokasyonun paylaşılmaz
          </Text>
        </View>

        {/* İçerik: form veya chat */}
        {phase === "chat" ? (
          <ChatView
            ref={flatListRef}
            messages={messages}
            onSend={send}
          />
        ) : (
          <FormView
            body={body}
            setBody={setBody}
            displayName={displayName}
            setDisplayName={setDisplayName}
            error={error}
            useCase={sticker?.use_case ?? null}
            phase={phase}
            onSubmit={() => void send(body)}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =========================================================================
// FORM VIEW
// =========================================================================
function FormView({
  body,
  setBody,
  displayName,
  setDisplayName,
  error,
  useCase,
  phase,
  onSubmit,
}: {
  body: string;
  setBody: (v: string) => void;
  displayName: string;
  setDisplayName: (v: string) => void;
  error: string | null;
  useCase: StickerUseCase | null;
  phase: Phase;
  onSubmit: () => void;
}) {
  const templates = useMemo(() => getQuickTemplates(useCase, "tr"), [useCase]);
  const disabled = phase === "sending" || body.trim().length === 0;

  return (
    <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
      {/* Hızlı şablonlar */}
      <Text style={styles.label}>Hızlı şablon seç</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.templatesRow}
      >
        {templates.map((t) => (
          <Pressable
            key={t.id}
            style={styles.templateChip}
            onPress={() => setBody(t.body)}
          >
            <Text style={styles.templateChipText}>
              {t.emoji} {t.body.length > 28 ? t.body.slice(0, 28) + "…" : t.body}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.divider} />

      {/* Mesaj */}
      <Text style={styles.label}>Mesajın</Text>
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder="Sahibine ne demek istersin?"
        placeholderTextColor={colors.muted}
        multiline
        maxLength={2000}
        style={styles.textarea}
      />
      <Text style={styles.charCount}>{body.length}/2000</Text>

      {/* İsim */}
      <Text style={styles.label}>Adın (opsiyonel)</Text>
      <TextInput
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Geçici takma ad — boş bırakabilirsin"
        placeholderTextColor={colors.muted}
        maxLength={40}
        style={styles.input}
      />

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      <Pressable
        style={[styles.btnPrimary, disabled && styles.btnDisabled]}
        onPress={onSubmit}
        disabled={disabled}
      >
        <Text style={styles.btnPrimaryText}>
          {phase === "sending" ? "Gönderiliyor…" : "Anonim Olarak Gönder"}
        </Text>
      </Pressable>

      <Text style={styles.footNote}>
        Gönderdikten sonra sahibi cevaplayınca burada görürsün.
        {"\n"}Telefon ve kimliğin gizli kalır.
      </Text>
    </ScrollView>
  );
}

// =========================================================================
// CHAT VIEW
// =========================================================================
type ChatViewRef = FlatList<ChatMessage>;

const ChatView = (() => {
  // Named function w/ ref forwarding-lite (no forwardRef gerektirmez)
  return function ChatViewInner({
    messages,
    onSend,
  }: {
    messages: ChatMessage[];
    onSend: (text: string) => void;
  }) {
    const [draft, setDraft] = useState("");
    const listRef = useRef<ChatViewRef>(null);

    useEffect(() => {
      if (messages.length > 0) {
        setTimeout(
          () => listRef.current?.scrollToEnd({ animated: true }),
          100,
        );
      }
    }, [messages.length]);

    const submit = () => {
      const t = draft.trim();
      if (!t) return;
      onSend(t);
      setDraft("");
    };

    return (
      <View style={styles.chatContainer}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.chatList}
          ListEmptyComponent={
            <Text style={styles.chatEmpty}>Henüz mesaj yok…</Text>
          }
        />
        <View style={styles.chatCompose}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Cevap yaz…"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={2000}
            style={styles.chatInput}
          />
          <Pressable
            style={[styles.btnSend, !draft.trim() && styles.btnDisabled]}
            disabled={!draft.trim()}
            onPress={submit}
          >
            <Text style={styles.btnSendText}>Gönder</Text>
          </Pressable>
        </View>
      </View>
    );
  };
})();

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.sender === "system") {
    return (
      <View style={styles.systemBubble}>
        <Text style={styles.systemText}>{message.body}</Text>
      </View>
    );
  }
  const isMine = message.sender === "scanner";
  return (
    <View
      style={[
        styles.bubbleWrap,
        isMine ? styles.bubbleRight : styles.bubbleLeft,
      ]}
    >
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={isMine ? styles.bubbleTextMine : styles.bubbleTextOther}>
          {message.body}
        </Text>
      </View>
    </View>
  );
}

// =========================================================================
// STYLES
// =========================================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: colors.bg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.navyBorder,
    padding: spacing.xxl,
    alignItems: "center",
    ...shadow.sm,
    maxWidth: 360,
  },
  emojiBig: { fontSize: 56, marginBottom: spacing.md },
  h2: { ...typography.h2, color: colors.navy, marginBottom: spacing.sm, textAlign: "center" },
  muted: { ...typography.caption, color: colors.muted, marginBottom: spacing.lg, textAlign: "center" },

  contextCard: {
    margin: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.navy,
    ...shadow.md,
  },
  contextRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.md },
  emoji: { fontSize: 36 },
  contextTag: { ...typography.tiny, color: colors.accent, letterSpacing: 1.5 },
  contextTitle: { ...typography.h3, color: colors.bg, marginTop: 2 },
  contextSubtitle: { ...typography.body, color: "rgba(255,255,255,0.85)", marginBottom: spacing.sm },
  contextPrivacy: { ...typography.tiny, color: "rgba(255,255,255,0.6)" },

  formScroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  label: { ...typography.caption, fontWeight: "600", color: colors.charcoal, marginBottom: spacing.sm },
  templatesRow: { marginBottom: spacing.md },
  templateChip: {
    borderWidth: 1,
    borderColor: colors.navyBorder,
    backgroundColor: colors.bgSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginRight: spacing.sm,
  },
  templateChipText: { ...typography.caption, color: colors.navy },
  divider: { height: 1, backgroundColor: colors.navyBorder, marginVertical: spacing.md },
  textarea: {
    borderWidth: 1,
    borderColor: colors.navyBorder,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 100,
    textAlignVertical: "top",
    ...typography.body,
    color: colors.charcoal,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.navyBorder,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.charcoal,
    marginBottom: spacing.md,
  },
  charCount: { ...typography.tiny, color: colors.muted, textAlign: "right", marginBottom: spacing.md },
  errorBox: {
    backgroundColor: "#FEF2F2",
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.caption, color: colors.danger },
  btnPrimary: {
    backgroundColor: colors.navy,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.lg,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  btnPrimaryText: { ...typography.bodyBold, color: colors.bg },
  btnDisabled: { opacity: 0.5 },
  footNote: {
    ...typography.tiny,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.lg,
  },

  // Chat
  chatContainer: { flex: 1, marginHorizontal: spacing.lg, marginBottom: spacing.md },
  chatList: { padding: spacing.md, gap: spacing.sm },
  chatEmpty: { ...typography.caption, color: colors.muted, textAlign: "center", padding: spacing.xxl },
  chatCompose: {
    flexDirection: "row",
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.navyBorder,
    paddingTop: spacing.md,
    alignItems: "flex-end",
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.navyBorder,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
    maxHeight: 100,
    ...typography.body,
    color: colors.charcoal,
  },
  btnSend: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md - 2,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSendText: { ...typography.bodyBold, color: colors.bg },

  // Message bubbles
  bubbleWrap: { maxWidth: "80%" },
  bubbleLeft: { alignSelf: "flex-start" },
  bubbleRight: { alignSelf: "flex-end" },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.xl,
  },
  bubbleMine: { backgroundColor: colors.navy },
  bubbleOther: { backgroundColor: colors.navyMuted },
  bubbleTextMine: { ...typography.body, color: colors.bg },
  bubbleTextOther: { ...typography.body, color: colors.charcoal },
  systemBubble: {
    alignSelf: "center",
    backgroundColor: colors.navyMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  systemText: { ...typography.tiny, color: colors.muted },
});
