/**
 * Profil ekranı — hesap bilgisi + KVKK self-service + subscription durumu + çıkış.
 */
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  Linking,
  Platform,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { colors, radius, spacing, typography } from "@/lib/theme";
import { computeSubscription } from "@/lib/subscription";

const APP_URL =
  process.env.EXPO_PUBLIC_APP_URL ?? "https://tagora.com.tr";

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, user, signOut, refreshProfile } = useAuth();
  const subscription = computeSubscription(profile);

  // Ekran her aç/kapa'da profile refresh — subscription güncel kalsın
  useEffect(() => {
    void refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [handoffBusy, setHandoffBusy] = useState(false);

  /**
   * Web sayfası aç. Kullanıcı mobil'de authenticated ise handoff endpoint'i
   * ile magic-link üretip web'de otomatik login olarak açar. Session yoksa
   * fallback: direkt URL aç (kullanıcı web'de login olur).
   */
  const openWebPage = async (path: string) => {
    setHandoffBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let urlToOpen = APP_URL + path;

      if (session?.access_token) {
        try {
          const res = await fetch(APP_URL + "/api/mobile/handoff", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ redirect: path }),
          });
          const json = await res.json();
          if (res.ok && json.ok && json.action_link) {
            urlToOpen = json.action_link;
          }
          // Fallback: session var ama handoff başarısız → direkt URL aç,
          // web'de login zorunlu olacak.
        } catch (e) {
          console.warn("[handoff] fetch hata, fallback URL:", e);
        }
      }

      await WebBrowser.openBrowserAsync(urlToOpen, {
        controlsColor: colors.navy,
        toolbarColor: colors.bg,
        dismissButtonStyle: "close",
      });
      // Kullanıcı geri döndüğünde profile'ı tazele (ödeme yaptıysa yansısın)
      await refreshProfile();
    } catch (e) {
      Alert.alert(
        "Bağlantı açılamadı",
        `${APP_URL}${path}\n\nİnternet bağlantını kontrol et.`,
      );
    } finally {
      setHandoffBusy(false);
    }
  };

  const exportData = async () => {
    const { error } = await supabase.rpc("export_my_data" as never);
    if (error) {
      Alert.alert("Hata", error.message);
      return;
    }
    Alert.alert(
      "Verin hazır",
      "Web dashboard'dan JSON dosyası olarak indirebilirsin.",
      [
        { text: "Şimdi Aç", onPress: () => openWebPage("/dashboard") },
        { text: "Kapat", style: "cancel" },
      ],
    );
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
            const { error } = await supabase.rpc("delete_my_account" as never);
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

  const enableNotifications = async () => {
    if (!user?.id) return;
    const token = await import("@/lib/push").then((m) =>
      m.registerForPushNotifications(user.id),
    );
    if (token) {
      Alert.alert(
        "Bildirimler aktif ✓",
        "Sticker'ına biri mesaj yollayınca telefonuna bildirim düşecek.",
      );
      return;
    }
    // İzin verilmedi — direkt ayarlar sayfasını aç
    const label = Platform.OS === "ios" ? "Ayarlar" : "Sistem Ayarları";
    const path =
      Platform.OS === "ios"
        ? "Ayarlar → Tagora → Bildirimler → İzin Ver"
        : "Ayarlar → Uygulamalar → Tagora → Bildirimler → Aç";
    Alert.alert(
      "İzin gerekli",
      `Bildirim gönderebilmemiz için sistem ayarlarından izin vermen lazım.\n\n${path}`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: `${label} Aç`,
          onPress: () => {
            void Linking.openSettings();
          },
        },
      ],
    );
  };

  return (
    <Screen padded={false} scrollable>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profil</Text>

        {/* Hesap kartı */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Hesap</Text>
          <Row label="E-posta" value={profile?.email ?? user?.email ?? "—"} />
          <Row label="Plan" value={getPlanLabel(subscription)} />
          <Row label="Dil" value={(profile?.locale ?? "tr").toUpperCase()} />
          <View style={styles.sep} />
          <Pressable
            onPress={() => openWebPage("/dashboard/settings")}
            style={styles.actionRow}
            disabled={handoffBusy}
          >
            <Text style={styles.actionEmoji}>✏️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionLabel}>
                {handoffBusy ? "Açılıyor…" : "Bilgileri düzenle"}
              </Text>
              <Text style={styles.actionSub}>
                Email, isim, telefon numarası
              </Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        </View>

        {/* Subscription CTA — durum bazlı */}
        <SubscriptionCard
          subscription={subscription}
          onRenew={() => openWebPage("/dashboard/subscription")}
        />

        {/* Shop CTA */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Satın al</Text>
          <Pressable
            onPress={() => openWebPage("/shop")}
            style={styles.actionRow}
          >
            <Text style={styles.actionEmoji}>🏷️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionLabel}>Yeni Sticker satın al</Text>
              <Text style={styles.actionSub}>
                4 tasarım · 5-50 adetlik paketler · kargoyla kapıya
              </Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
          <View style={styles.sep} />
          <Pressable
            onPress={() => openWebPage("/dashboard/orders")}
            style={styles.actionRow}
          >
            <Text style={styles.actionEmoji}>📦</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionLabel}>Siparişlerim</Text>
              <Text style={styles.actionSub}>Sipariş durumu + takip numaraları</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
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
            onPress={() => openWebPage("/privacy")}
            style={styles.actionRow}
          >
            <Text style={styles.actionEmoji}>🔒</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionLabel}>Gizlilik Politikası</Text>
              <Text style={styles.actionSub}>
                KVKK aydınlatma + veri işleme
              </Text>
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
              <Text style={styles.actionSub}>
                Anonimleştir + tüm sticker'ları deaktive et
              </Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        </View>

        {/* Bildirim ayarları */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Uygulama</Text>
          <Pressable onPress={enableNotifications} style={styles.actionRow}>
            <Text style={styles.actionEmoji}>🔔</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionLabel}>Bildirimleri aç</Text>
              <Text style={styles.actionSub}>
                Sticker'ına mesaj geldiğinde anında haberdar ol
              </Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
          <View style={styles.sep} />
          <Pressable
            onPress={() => openWebPage("/")}
            style={styles.actionRow}
          >
            <Text style={styles.actionEmoji}>🌐</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionLabel}>Web sitesi</Text>
              <Text style={styles.actionSub}>tagora.com.tr</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        </View>

        {/* DEV-only: native scanner ekranını test et */}
        {__DEV__ && (
          <View
            style={[styles.card, { borderColor: colors.accent, borderWidth: 2 }]}
          >
            <Text style={styles.cardHeader}>🧪 DEV — Test Araçları</Text>
            <Pressable
              onPress={() => router.push("/(public)/s/HFaxME0G5r" as never)}
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

        <Button
          label="Çıkış Yap"
          onPress={handleSignOut}
          variant="secondary"
          fullWidth
          size="lg"
          style={{ marginTop: spacing.xl }}
        />

        <Text style={styles.version}>Tagora v0.2.0</Text>
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

/**
 * Plan label — subscription state'e göre insan-okur değer.
 */
function getPlanLabel(
  sub: ReturnType<typeof computeSubscription>,
): string {
  switch (sub.state) {
    case "none":
      return "Deneme başlamadı";
    case "active":
      return `Aktif · ${sub.daysRemaining} gün kaldı`;
    case "warning":
      return `Aktif · ${sub.daysRemaining} gün kaldı`;
    case "grace":
      return `Ek süre · ${sub.daysUntilReadonly} gün`;
    case "readonly":
      return "Süresi doldu";
    default:
      return "—";
  }
}

/**
 * Subscription kart — duruma göre renk + CTA + bilgi.
 */
function SubscriptionCard({
  subscription,
  onRenew,
}: {
  subscription: ReturnType<typeof computeSubscription>;
  onRenew: () => void;
}) {
  const sub = subscription;

  // Henüz trial başlamamış → sticker claim'e teşvik
  if (sub.state === "none") {
    return (
      <View style={[styles.card, styles.subInfo]}>
        <Text style={styles.cardHeader}>Abonelik</Text>
        <Text style={styles.subBody}>
          İlk sticker'ını claim et — 1 yıl ücretsiz deneme otomatik başlar. 🎁
        </Text>
      </View>
    );
  }

  // Aktif ve rahat (>30 gün)
  if (sub.state === "active") {
    return (
      <View style={[styles.card, styles.subOk]}>
        <View style={styles.subHeaderRow}>
          <Text style={styles.subEmoji}>✓</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.subTitle}>Abonelik aktif</Text>
            <Text style={styles.subBody}>
              {sub.daysRemaining} gün sonra yenilenmesi gerekiyor.
            </Text>
          </View>
        </View>
        <Pressable onPress={onRenew} style={styles.subCtaSecondary}>
          <Text style={styles.subCtaSecondaryText}>Şimdi yenile — 99 TL</Text>
        </Pressable>
      </View>
    );
  }

  // Warning / grace / readonly → renkli CTA
  const palette = getPalette(sub.state);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}
    >
      <View style={styles.subHeaderRow}>
        <Text style={styles.subEmoji}>{palette.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.subTitle, { color: palette.text }]}>
            {getStateTitle(sub)}
          </Text>
          <Text style={[styles.subBody, { color: palette.text }]}>
            {getStateBody(sub)}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={onRenew}
        style={[styles.subCta, { backgroundColor: palette.cta }]}
      >
        <Text style={styles.subCtaText}>Yenile — 99 TL/yıl →</Text>
      </Pressable>
    </View>
  );
}

function getPalette(state: string) {
  switch (state) {
    case "warning":
      return {
        bg: "#FEF3C7",
        border: colors.warning,
        text: "#78350F",
        cta: colors.warning,
        emoji: "⚠️",
      };
    case "grace":
      return {
        bg: "#FED7AA",
        border: "#EA580C",
        text: "#7C2D12",
        cta: "#EA580C",
        emoji: "🟠",
      };
    case "readonly":
      return {
        bg: "#FEE2E2",
        border: colors.danger,
        text: "#7F1D1D",
        cta: colors.danger,
        emoji: "🔒",
      };
    default:
      return {
        bg: colors.bgSubtle,
        border: colors.navyBorder,
        text: colors.navy,
        cta: colors.navy,
        emoji: "ℹ️",
      };
  }
}

function getStateTitle(sub: ReturnType<typeof computeSubscription>): string {
  switch (sub.state) {
    case "warning":
      return `${sub.daysRemaining} gün sonra bitiyor`;
    case "grace":
      return "Aboneliğin sona erdi";
    case "readonly":
      return "Cevap yazma kapalı";
    default:
      return "";
  }
}

function getStateBody(sub: ReturnType<typeof computeSubscription>): string {
  switch (sub.state) {
    case "warning":
      return "Kesintisiz kullanım için hemen yenile.";
    case "grace":
      return `${sub.daysUntilReadonly} gün ek süren var. Ondan sonra cevap yazma kapatılacak.`;
    case "readonly":
      return "Yenile ve sisteme tam özelliklerle devam et.";
    default:
      return "";
  }
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    // Alt tab bar ve nav bar'a yer bırak
    paddingBottom: 120,
  },
  title: { ...typography.h2, color: colors.navy, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.navyBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    ...typography.tiny,
    color: colors.muted,
    fontWeight: "700",
    marginBottom: spacing.md,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  rowLabel: { ...typography.body, color: colors.muted },
  rowValue: {
    ...typography.bodyBold,
    color: colors.navy,
    flexShrink: 1,
    textAlign: "right",
  },
  // Subscription card
  subOk: {
    backgroundColor: "#F0FDF4",
    borderColor: colors.success,
  },
  subInfo: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  subHeaderRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  subEmoji: { fontSize: 28 },
  subTitle: { ...typography.bodyBold, color: colors.navy },
  subBody: { ...typography.tiny, color: colors.charcoal, marginTop: 2 },
  subCta: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  subCtaText: {
    ...typography.bodyBold,
    fontSize: 14,
    color: "#FFFFFF",
  },
  subCtaSecondary: {
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.navyBorder,
  },
  subCtaSecondaryText: {
    ...typography.tiny,
    fontSize: 13,
    color: colors.navy,
    fontWeight: "600",
  },
  // Actions
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
  sep: {
    height: 1,
    backgroundColor: colors.navyMuted,
    marginVertical: spacing.xs,
  },
  version: {
    ...typography.tiny,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
