/**
 * Profil ekranı — hesap bilgisi + KVKK self-service + çıkış.
 */
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, Linking } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing, typography } from "@/lib/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, user, signOut } = useAuth();

  const exportData = async () => {
    const { data, error } = await supabase.rpc("export_my_data");
    if (error) {
      Alert.alert("Hata", error.message);
      return;
    }
    Alert.alert(
      "Verin hazır",
      "Web dashboard'dan JSON dosyası olarak indir: " +
        (process.env.EXPO_PUBLIC_APP_URL ?? "http://localhost:3000") +
        "/api/account/export",
      [{ text: "Tamam" }],
    );
    // Sprint 3: expo-file-system ile local'e kaydet + Share sheet
    void data;
  };

  const deleteAccount = () => {
    Alert.alert(
      "Hesabımı sil",
      "Tüm verilerin anonimleştirilir, sticker'ların deaktive edilir. Bu işlem geri alınamaz.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.rpc("delete_my_account");
            if (error) {
              Alert.alert("Hata", error.message);
              return;
            }
            await signOut();
            router.replace("/(auth)/onboarding");
          },
        },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert("Çıkış yap", "Emin misin?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Çıkış",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <Screen padded={false} scrollable>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profil</Text>

        {/* Hesap kartı */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Hesap</Text>
          <Row label="E-posta" value={profile?.email ?? user?.email ?? "—"} />
          <Row label="Plan" value={(profile?.tier ?? "free").toUpperCase()} />
          <Row label="Dil" value={(profile?.locale ?? "tr").toUpperCase()} />
        </View>

        {/* Premium promo (v1) */}
        <View style={styles.premiumBox}>
          <Text style={styles.premiumEmoji}>⭐</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.premiumTitle}>Premium yakında</Text>
            <Text style={styles.premiumBody}>
              Maskelenmiş sesli arama, family share, premium tasarımlar.
            </Text>
          </View>
        </View>

        {/* KVKK */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>KVKK — Verim</Text>
          <Pressable onPress={exportData} style={styles.actionRow}>
            <Text style={styles.actionEmoji}>📥</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionLabel}>Verimi indir</Text>
              <Text style={styles.actionSub}>JSON formatında export</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>

          <View style={styles.sep} />

          <Pressable
            onPress={async () => {
              const url =
                (process.env.EXPO_PUBLIC_APP_URL ?? "http://localhost:3000") +
                "/privacy";
              try {
                await Linking.openURL(url);
              } catch (e) {
                Alert.alert(
                  "Bağlantı açılamadı",
                  `URL: ${url}\n\nİnternet bağlantını veya domain'i kontrol et.`,
                );
              }
            }}
            style={styles.actionRow}
          >
            <Text style={styles.actionEmoji}>🔒</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionLabel}>Gizlilik Politikası</Text>
              <Text style={styles.actionSub}>KVKK aydınlatma + AB veri yerleşimi</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>

          <View style={styles.sep} />

          <Pressable onPress={deleteAccount} style={styles.actionRow}>
            <Text style={styles.actionEmoji}>🗑</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionLabel, { color: colors.danger }]}>
                Hesabımı sil
              </Text>
              <Text style={styles.actionSub}>Anonimleştir + tüm sticker'ları deaktive et</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        </View>

        {/* Bildirim ayarları */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Uygulama</Text>
          <Pressable
            onPress={async () => {
              if (!user?.id) return;
              const token = await import("@/lib/push").then((m) =>
                m.registerForPushNotifications(user.id),
              );
              if (token) {
                Alert.alert(
                  "Bildirimler aktif ✓",
                  "Sticker'ına biri mesaj yollayınca telefonuna bildirim düşecek.",
                );
              } else {
                Alert.alert(
                  "İzin gerekli",
                  "iPhone Ayarlar → Bildirimler → Expo Go → Bildirimlere İzin Ver.",
                );
              }
            }}
            style={styles.actionRow}
          >
            <Text style={styles.actionEmoji}>🔔</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionLabel}>Bildirimleri aç</Text>
              <Text style={styles.actionSub}>
                Sticker'ına mesaj geldiğinde anında haberdar ol
              </Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        </View>

        {/* DEV-only: native scanner ekranını test et */}
        {__DEV__ && (
          <View style={[styles.card, { borderColor: colors.accent, borderWidth: 2 }]}>
            <Text style={styles.cardHeader}>🧪 DEV — Test Araçları</Text>
            <Pressable
              onPress={() =>
                router.push("/(public)/s/HFaxME0G5r" as never)
              }
              style={styles.actionRow}
            >
              <Text style={styles.actionEmoji}>📱</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionLabel}>Native scanner ekranını aç</Text>
                <Text style={styles.actionSub}>
                  Test sticker: HFaxME0G5r · Deep link akışını simüle eder
                </Text>
              </View>
              <Text style={styles.chev}>›</Text>
            </Pressable>
          </View>
        )}

        <Button label="Çıkış Yap" onPress={handleSignOut} variant="secondary" fullWidth size="lg" style={{ marginTop: spacing.xl }} />

        <Text style={styles.version}>Tagora v0.1.0 · MVP</Text>
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: 60 },
  title: { ...typography.h2, color: colors.navy, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.navyBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: { ...typography.tiny, color: colors.muted, fontWeight: "700", marginBottom: spacing.md, textTransform: "uppercase" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  rowLabel: { ...typography.body, color: colors.muted },
  rowValue: { ...typography.bodyBold, color: colors.navy },
  premiumBox: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  premiumEmoji: { fontSize: 32 },
  premiumTitle: { ...typography.bodyBold, color: colors.navy },
  premiumBody: { ...typography.tiny, color: colors.charcoal, marginTop: 2 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionEmoji: { fontSize: 22 },
  actionLabel: { ...typography.bodyBold, color: colors.navy },
  actionSub: { ...typography.tiny, color: colors.muted, marginTop: 2 },
  chev: { ...typography.h3, color: colors.muted },
  sep: { height: 1, backgroundColor: colors.navyMuted, marginVertical: spacing.xs },
  version: {
    ...typography.tiny,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
