/**
 * Sticker detay + düzenle ekranı.
 *
 * - Label (isim) düzenle
 * - Kullanım amacı (use_case) değiştir
 * - Kaydet / Vazgeç
 * - Tehlikeli bölge: sticker'ı kaldır (owner_id = null → deaktive, token yeniden claim'lenebilir)
 */
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { USE_CASE_LABELS } from "@tagora/shared";
import { colors, radius, spacing, typography, shadow } from "@/lib/theme";
import type { Sticker, StickerUseCase } from "@tagora/db";

export default function StickerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sticker, setSticker] = useState<Sticker | null>(null);
  const [label, setLabel] = useState("");
  const [useCase, setUseCase] = useState<StickerUseCase>("other");

  const load = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from("stickers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) {
      Alert.alert("Bulunamadı", "Bu sticker mevcut değil veya erişimin yok.");
      router.back();
      return;
    }
    const s = data as Sticker;
    setSticker(s);
    setLabel(s.label ?? "");
    setUseCase((s.use_case as StickerUseCase | null) ?? "other");
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!sticker) return;
    setSaving(true);
    const { error } = await supabase
      .from("stickers")
      .update({
        label: label.trim() || null,
        use_case: useCase,
      })
      .eq("id", sticker.id);
    setSaving(false);
    if (error) {
      Alert.alert("Kaydedilemedi", error.message);
      return;
    }
    router.back();
  };

  const deactivate = () => {
    Alert.alert(
      "Sticker'ı kaldır",
      "Bu sticker artık kimseye ulaşmayacak. QR taranırsa 'Sticker bulunamadı' hatası verir. İstediğinde tekrar QR ile ekleyebilirsin.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Kaldır",
          style: "destructive",
          onPress: async () => {
            if (!sticker) return;
            const { error } = await supabase
              .from("stickers")
              .update({
                owner_id: null,
                status: "retired",
                label: null,
                use_case: null,
              })
              .eq("id", sticker.id);
            if (error) {
              Alert.alert("Hata", error.message);
              return;
            }
            router.back();
          },
        },
      ],
    );
  };

  if (loading || !sticker) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color={colors.navy} />
      </SafeAreaView>
    );
  }

  const useCases = Object.keys(USE_CASE_LABELS) as StickerUseCase[];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Text style={styles.back}>← Stickerlar</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Sticker Düzenle</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Sticker kimlik kartı */}
          <View style={styles.identityCard}>
            <Text style={styles.identityToken}>/s/{sticker.token}</Text>
            <Text style={styles.identityMeta}>
              {sticker.scan_count} taranma · {sticker.status.toUpperCase()}
            </Text>
          </View>

          {/* Label */}
          <Text style={styles.label}>Sticker adı</Text>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="Örn: 34 ABC 123 (araç plakası)"
            placeholderTextColor={colors.muted}
            maxLength={40}
            style={styles.input}
          />
          <Text style={styles.hint}>
            Bu isim scanner'a görünmez, sadece senin kendi listende gözükür.
          </Text>

          {/* Use case picker */}
          <Text style={[styles.label, { marginTop: spacing.xl }]}>
            Kullanım amacı
          </Text>
          <View style={styles.pickerGrid}>
            {useCases.map((k) => {
              const info = USE_CASE_LABELS[k];
              if (!info) return null;
              const selected = useCase === k;
              return (
                <Pressable
                  key={k}
                  onPress={() => setUseCase(k)}
                  style={[
                    styles.pickerCell,
                    selected && styles.pickerCellSelected,
                  ]}
                >
                  <Text style={styles.pickerEmoji}>{info.emoji}</Text>
                  <Text
                    style={[
                      styles.pickerLabel,
                      selected && styles.pickerLabelSelected,
                    ]}
                  >
                    {info.tr}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Save button */}
          <Pressable
            onPress={save}
            disabled={saving}
            style={[styles.saveBtn, saving && { opacity: 0.5 }]}
          >
            <Text style={styles.saveBtnText}>
              {saving ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
            </Text>
          </Pressable>

          {/* Danger zone */}
          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>Tehlikeli bölge</Text>
            <Text style={styles.dangerBody}>
              Sticker'ı kaldır: hesabından çıkarır, kimse mesaj gönderemez.
            </Text>
            <Pressable onPress={deactivate} style={styles.dangerBtn}>
              <Text style={styles.dangerBtnText}>Sticker'ı kaldır</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  },
  back: { ...typography.bodyBold, color: colors.navy },
  headerTitle: { ...typography.bodyBold, color: colors.navy },
  scroll: { padding: spacing.xl, paddingBottom: 60 },

  identityCard: {
    backgroundColor: colors.navy,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadow.md,
  },
  identityToken: {
    ...typography.h3,
    color: colors.accent,
    fontFamily: "monospace",
  },
  identityMeta: { ...typography.tiny, color: "rgba(255,255,255,0.7)", marginTop: 4 },

  label: { ...typography.caption, fontWeight: "600", color: colors.charcoal, marginBottom: spacing.sm },
  hint: { ...typography.tiny, color: colors.muted, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.navyBorder,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.charcoal,
  },

  pickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pickerCell: {
    borderWidth: 1,
    borderColor: colors.navyBorder,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 90,
    flexGrow: 1,
    backgroundColor: colors.bg,
  },
  pickerCellSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  pickerEmoji: { fontSize: 28 },
  pickerLabel: { ...typography.tiny, color: colors.charcoal, marginTop: 4 },
  pickerLabelSelected: { color: colors.bg, fontWeight: "700" },

  saveBtn: {
    backgroundColor: colors.navy,
    paddingVertical: spacing.md + 4,
    borderRadius: radius.lg,
    alignItems: "center",
    marginTop: spacing.xxl,
  },
  saveBtnText: { ...typography.bodyBold, color: colors.bg },

  dangerZone: {
    marginTop: spacing.xxxl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
  },
  dangerTitle: { ...typography.bodyBold, color: colors.danger, marginBottom: spacing.xs },
  dangerBody: { ...typography.tiny, color: colors.charcoal, marginBottom: spacing.md },
  dangerBtn: {
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    alignItems: "center",
  },
  dangerBtnText: { ...typography.bodyBold, color: colors.danger },
});
