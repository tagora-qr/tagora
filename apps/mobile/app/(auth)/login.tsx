/**
 * Login — 6 haneli OTP kodu ile giriş + dev shortcut.
 *
 * ADIM 1: E-mail gir → Supabase signInWithOtp() → e-posta ile 6 haneli kod gelir
 * ADIM 2: Kodu gir → verifyOtp() → session kurulur → dashboard
 *
 * ⚠️ DEV SHORTCUT (__DEV__ true iken görünür):
 * Web'in /api/dev/mobile-signin endpoint'ini çağırır. Supabase custom SMTP
 * template'i mobile OTP'yi düzgün render etmediği için geçici yol.
 * Sprint 4'te bu blok kaldırılıp Netgsm SMS OTP ile değiştirilecek.
 */
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking as RNLinking,
} from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { Logo } from "@/components/Logo";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing, typography } from "@/lib/theme";

type Phase = "email" | "code";

const APP_URL = process.env.EXPO_PUBLIC_APP_URL ?? "http://localhost:3000";

// Apple App Store Review demo account — reviewer'lar OTP mail'ini alamaz,
// bu email için özel dev shortcut butonu her build'de görünür.
const APPLE_REVIEW_EMAIL = "apple.review@tagora.com.tr";

export default function Login() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  // Apple guideline 1.2 UGC gereği: kullanıcı Kullanım Şartları ve objectionable
  // content politikasını explicit olarak kabul etmeli (link okuma yetmez).
  const [termsAccepted, setTermsAccepted] = useState(false);

  const sendCode = async () => {
    if (!termsAccepted) {
      Alert.alert(
        "Kullanım Şartları",
        "Devam etmek için Kullanım Şartları ve KVKK metnini kabul etmelisin.",
      );
      return;
    }
    if (!email.includes("@")) {
      Alert.alert("Geçersiz e-posta", "Doğru bir e-posta adresi gir.");
      return;
    }
    setLoading(true);
    const redirectTo = Linking.createURL("/auth-callback");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
    });
    setLoading(false);
    if (error) {
      Alert.alert("Hata", error.message);
      return;
    }
    setPhase("code");
  };

  const verifyCode = async () => {
    const trimmed = code.trim();
    // Supabase OTP length 6 veya 8 hane olabilir (config'e göre)
    if (!/^\d{6,8}$/.test(trimmed)) {
      Alert.alert("Geçersiz kod", "6-8 haneli sayısal kodu gir.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: trimmed,
      type: "email",
    });
    setLoading(false);
    if (error || !data.session) {
      Alert.alert("Doğrulama başarısız", error?.message ?? "Kod hatalı olabilir.");
      return;
    }
    // Auth state change listener otomatik redirect yapacak
  };

  /**
   * Dev shortcut: email göndermeden direkt OTP kodu al + verify et.
   */
  const devShortcutSignIn = async () => {
    if (!email.includes("@")) {
      Alert.alert("Geçersiz e-posta", "Doğru bir e-posta adresi gir.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${APP_URL}/api/dev/mobile-signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const json = await res.json();

      if (!json.ok) {
        setLoading(false);
        Alert.alert("Dev shortcut hatası", json.error ?? "Endpoint hata verdi.");
        return;
      }

      // Alınan OTP kodunu doğrudan verify et
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: json.email_otp,
        type: "email",
      });

      setLoading(false);
      if (error || !data.session) {
        Alert.alert(
          "Verify başarısız",
          error?.message ?? "OTP kodu Supabase tarafından reddedildi.",
        );
        return;
      }
      // Session kuruldu; auth state change → dashboard
    } catch (e) {
      setLoading(false);
      Alert.alert(
        "Bağlantı hatası",
        `Web dev server'a ulaşılamadı: ${APP_URL}\n\n` +
          "Dev server çalışıyor mu? EXPO_PUBLIC_APP_URL doğru IP mi?\n\n" +
          String(e),
      );
    }
  };

  return (
    <Screen bg={colors.bg}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.top}>
          <Pressable
            onPress={() => (phase === "code" ? setPhase("email") : router.back())}
            hitSlop={16}
          >
            <Text style={styles.back}>← Geri</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <Logo />

          {phase === "email" ? (
            <>
              <Text style={styles.h1}>Hoş geldin</Text>
              <Text style={styles.subtitle}>
                E-postanı gir; sana 6 haneli giriş kodu yollayalım.
              </Text>

              <Text style={styles.label}>E-posta</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="ornek@mail.com"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                editable={!loading}
                style={styles.input}
              />

              {/* Apple 1.2 UGC — explicit terms acceptance checkbox */}
              <Pressable
                onPress={() => setTermsAccepted((v) => !v)}
                style={styles.termsRow}
                hitSlop={8}
              >
                <View
                  style={[
                    styles.checkbox,
                    termsAccepted && styles.checkboxChecked,
                  ]}
                >
                  {termsAccepted && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.termsText}>
                    <Text
                      style={styles.termsLink}
                      onPress={() =>
                        RNLinking.openURL(
                          (process.env.EXPO_PUBLIC_APP_URL ??
                            "https://tagora.com.tr") + "/terms",
                        )
                      }
                    >
                      Kullanım Şartları
                    </Text>
                    {" ve "}
                    <Text
                      style={styles.termsLink}
                      onPress={() =>
                        RNLinking.openURL(
                          (process.env.EXPO_PUBLIC_APP_URL ??
                            "https://tagora.com.tr") + "/kvkk",
                        )
                      }
                    >
                      KVKK Aydınlatma
                    </Text>
                    {"'yı okudum ve kabul ediyorum. Uygunsuz içerik veya taciz için sıfır tolerans politikasını anladım."}
                  </Text>
                </View>
              </Pressable>

              <Button
                label={loading ? "Yolluyor…" : "Kodu Gönder"}
                onPress={sendCode}
                loading={loading}
                size="lg"
                fullWidth
                disabled={!termsAccepted}
                style={{
                  marginTop: spacing.md,
                  opacity: termsAccepted ? 1 : 0.4,
                }}
              />

              {/* Dev shortcut — development'ta veya Apple review email için görünür */}
              {(__DEV__ ||
                email.trim().toLowerCase() === APPLE_REVIEW_EMAIL) && (
                <View style={styles.devBox}>
                  <Text style={styles.devLabel}>
                    {__DEV__ ? "⚡ Dev Modu" : "🍎 Apple Review Girişi"}
                  </Text>
                  <Text style={styles.devHint}>
                    {__DEV__
                      ? "E-mail beklemeden doğrudan giriş yap (SMTP template debug'i sürerken kullanılır)."
                      : "App Store Review reviewer'lar için hazırlanmış demo account girişi."}
                  </Text>
                  <Button
                    label={__DEV__ ? "Dev: Direkt Giriş" : "Reviewer: Direkt Giriş"}
                    onPress={devShortcutSignIn}
                    variant="secondary"
                    size="md"
                    fullWidth
                    style={{ marginTop: spacing.sm }}
                  />
                </View>
              )}

            </>
          ) : (
            <>
              <Text style={styles.h1}>Kodu gir</Text>
              <Text style={styles.subtitle}>
                <Text style={{ fontWeight: "600", color: colors.charcoal }}>
                  {email}
                </Text>{" "}
                adresine 6 haneli kod yolladık. Kodu aşağı gir.
              </Text>

              <Text style={styles.label}>Doğrulama kodu</Text>
              <TextInput
                value={code}
                onChangeText={(v) => setCode(v.replace(/[^0-9]/g, "").slice(0, 8))}
                placeholder="00000000"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={8}
                editable={!loading}
                style={[styles.input, styles.codeInput]}
              />

              <Button
                label={loading ? "Doğrulanıyor…" : "Giriş Yap"}
                onPress={verifyCode}
                loading={loading}
                size="lg"
                fullWidth
                style={{ marginTop: spacing.lg }}
              />

              <Pressable
                onPress={() => {
                  setCode("");
                  setPhase("email");
                }}
                style={{ marginTop: spacing.md, alignItems: "center" }}
              >
                <Text style={styles.tryAgain}>Farklı e-posta / kod bekleme</Text>
              </Pressable>

              <Text style={styles.consent}>
                Kod gelmediyse spam klasörünü kontrol et. E-posta bazen 30-60
                saniye sürebilir.
              </Text>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { paddingVertical: spacing.md },
  back: { ...typography.bodyBold, color: colors.navy },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  h1: { ...typography.h1, color: colors.navy, marginTop: spacing.xl },
  subtitle: { ...typography.body, color: colors.muted, lineHeight: 22 },
  label: {
    ...typography.caption,
    color: colors.charcoal,
    marginTop: spacing.md,
    fontWeight: "600",
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
  codeInput: {
    fontSize: 22,
    letterSpacing: 6,
    textAlign: "center",
    fontFamily: "monospace",
    fontWeight: "700",
  },
  // Terms acceptance checkbox — Apple guideline 1.2 UGC gereği
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.navyBorder,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  checkboxTick: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 16,
  },
  termsText: {
    ...typography.tiny,
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
  },
  termsLink: {
    color: colors.navy,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  consent: {
    ...typography.tiny,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.lg,
    lineHeight: 18,
  },
  tryAgain: {
    ...typography.bodyBold,
    color: colors.navy,
    textDecorationLine: "underline",
  },
  devBox: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  devLabel: { ...typography.bodyBold, color: colors.navy },
  devHint: { ...typography.tiny, color: colors.charcoal, marginTop: 2, lineHeight: 16 },
});
