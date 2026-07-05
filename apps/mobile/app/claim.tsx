/**
 * Claim ekranı — QR scanner ile sticker'ı hesaba ekle.
 *
 * Akış:
 * 1. expo-camera ile kamera aç
 * 2. QR taranınca URL parse et → token çıkar
 * 3. Use-case + label sor (form)
 * 4. Supabase claim endpoint'ini çağır (RLS bypass için service_role gerek — bunu web'in
 *    /api/stickers/claim endpoint'ine POST ediyoruz)
 *
 * Not: MVP'de mobile'dan claim için web endpoint'i kullanıyoruz.
 * Sprint 3'te native Edge Function veya direct RPC ile yapılır.
 */
import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TextInput, Alert, Pressable, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing, typography } from "@/lib/theme";
import { USE_CASE_LABELS, isValidStickerToken } from "@tagora/shared";
import type { StickerUseCase } from "@tagora/db";

type Phase = "camera" | "form" | "submitting";

export default function Claim() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>("camera");
  const [token, setToken] = useState("");
  const [useCase, setUseCase] = useState<StickerUseCase>("vehicle");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scannedRef = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const onScan = ({ data }: { data: string }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;

    // URL formatında ise token'ı çıkar: https://tagora.app/s/<token>
    const match = data.match(/\/s\/([0-9A-Za-z]{10})/);
    const extracted = match?.[1] ?? data.trim();

    if (!isValidStickerToken(extracted)) {
      Alert.alert(
        "Geçersiz QR",
        "Bu QR bir Tagora sticker'ı değil. Kod: " + extracted.slice(0, 20),
        [{ text: "Tekrar tara", onPress: () => (scannedRef.current = false) }],
      );
      return;
    }

    setToken(extracted);
    setPhase("form");
  };

  const submit = async () => {
    setError(null);
    setPhase("submitting");

    const session = (await supabase.auth.getSession()).data.session;
    if (!session) {
      setError("Oturum bulunamadı. Yeniden giriş yap.");
      setPhase("form");
      return;
    }

    // Web endpoint'ine POST — service_role RLS bypass ile claim eder
    const apiUrl = `${process.env.EXPO_PUBLIC_APP_URL}/api/stickers/claim`;
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          token,
          use_case: useCase,
          label: label.trim() || null,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Bilinmeyen hata");
        setPhase("form");
        return;
      }
      // Başarılı — geri dön
      router.back();
    } catch {
      setError("Bağlantı hatası. Dev server çalışıyor mu?");
      setPhase("form");
    }
  };

  if (!permission) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.navy} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permission}>
        <Text style={styles.emoji}>📷</Text>
        <Text style={styles.h1}>Kamera izni gerekli</Text>
        <Text style={styles.subtitle}>
          Sticker QR&apos;ını okumak için kameraya erişmemiz lazım.
        </Text>
        <Button label="İzin ver" onPress={requestPermission} size="lg" style={{ marginTop: spacing.lg }} />
        <Pressable onPress={() => router.back()} style={{ marginTop: spacing.md }}>
          <Text style={styles.linkText}>İptal</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === "camera") {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={onScan}
        />

        <View style={styles.overlay}>
          <View style={styles.overlayTop}>
            <Pressable onPress={() => router.back()} hitSlop={16}>
              <Text style={styles.overlayClose}>← Kapat</Text>
            </Pressable>
            <Text style={styles.overlayTitle}>QR Kodu Tara</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.frameWrap}>
            <View style={styles.frame} />
            <Text style={styles.frameHint}>
              Sticker&apos;ın QR kodunu buradaki çerçeveye tut
            </Text>
          </View>

          <View style={styles.overlayBottom}>
            <Pressable
              onPress={() => {
                setToken("");
                setPhase("form");
              }}
            >
              <Text style={styles.overlayLink}>Elle kod gir →</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // Form phase
  return (
    <View style={styles.formScreen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formHeader}>
            <Pressable onPress={() => router.back()} hitSlop={16}>
              <Text style={styles.linkText}>← İptal</Text>
            </Pressable>
            <Text style={styles.formTitle}>Sticker Detayları</Text>
          </View>

          <Text style={styles.label}>Sticker Kodu</Text>
          <TextInput
            value={token}
            onChangeText={(v) => setToken(v.trim())}
            placeholder="örn. k7n2pXyZ4A"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={10}
            style={[styles.input, styles.tokenInput]}
          />

          <Text style={styles.label}>Ne için kullanacaksın?</Text>
          <View style={styles.useCaseGrid}>
            {(Object.keys(USE_CASE_LABELS) as StickerUseCase[]).map((key) => {
              const item = USE_CASE_LABELS[key];
              const selected = key === useCase;
              return (
                <Pressable
                  key={key}
                  onPress={() => setUseCase(key)}
                  style={[styles.useCaseCard, selected && styles.useCaseCardActive]}
                >
                  <Text style={styles.useCaseEmoji}>{item.emoji}</Text>
                  <Text
                    style={[
                      styles.useCaseLabel,
                      selected && { color: colors.navy },
                    ]}
                  >
                    {item.tr}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>İsim ver (opsiyonel)</Text>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="örn. Mavi Skoda"
            placeholderTextColor={colors.muted}
            maxLength={40}
            style={styles.input}
          />

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          <Button
            label="Sticker&apos;ı Kaydet"
            onPress={submit}
            loading={phase === "submitting"}
            disabled={phase === "submitting"}
            size="lg"
            fullWidth
            style={{ marginTop: spacing.xl }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  permission: {
    flex: 1,
    padding: spacing.xxl,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  emoji: { fontSize: 64, marginBottom: spacing.md },
  h1: { ...typography.h2, color: colors.navy, marginBottom: spacing.sm, textAlign: "center" },
  subtitle: { ...typography.body, color: colors.muted, textAlign: "center", marginHorizontal: spacing.md },
  linkText: { ...typography.bodyBold, color: colors.navy },

  cameraContainer: { flex: 1, backgroundColor: "#000" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 27, 61, 0.4)",
    justifyContent: "space-between",
  },
  overlayTop: {
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  overlayClose: { ...typography.bodyBold, color: "#FFFFFF" },
  overlayTitle: { ...typography.bodyBold, color: "#FFFFFF" },
  frameWrap: { alignItems: "center" },
  frame: {
    width: 260,
    height: 260,
    borderRadius: radius.xl,
    borderColor: colors.accent,
    borderWidth: 4,
    backgroundColor: "transparent",
  },
  frameHint: {
    ...typography.body,
    color: "#FFFFFF",
    marginTop: spacing.xl,
    textAlign: "center",
    paddingHorizontal: spacing.xxl,
  },
  overlayBottom: { alignItems: "center", paddingBottom: 50 },
  overlayLink: {
    ...typography.bodyBold,
    color: colors.accent,
    padding: spacing.md,
  },

  formScreen: { flex: 1, backgroundColor: colors.bg },
  formContent: { padding: spacing.xl, paddingTop: 60 },
  formHeader: { marginBottom: spacing.lg },
  formTitle: { ...typography.h2, color: colors.navy, marginTop: spacing.md },
  label: {
    ...typography.caption,
    color: colors.charcoal,
    fontWeight: "600",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  input: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.navyBorder,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    color: colors.charcoal,
    backgroundColor: colors.bg,
  },
  tokenInput: {
    fontFamily: "monospace",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  useCaseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  useCaseCard: {
    borderWidth: 1,
    borderColor: colors.navyBorder,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    minWidth: 92,
    backgroundColor: colors.bg,
  },
  useCaseCardActive: {
    borderColor: colors.navy,
    borderWidth: 2,
    backgroundColor: colors.accentSoft,
  },
  useCaseEmoji: { fontSize: 28, marginBottom: 4 },
  useCaseLabel: { ...typography.tiny, color: colors.muted, fontWeight: "600" },
  errorBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "#FEE2E2",
  },
  errorText: { ...typography.caption, color: colors.danger },
});
