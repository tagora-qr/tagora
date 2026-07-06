/**
 * Onboarding — 3 ekranlı tanıtım (swipe ile ilerler).
 * PagerView kullanmadan basit FlatList paginated approach.
 */
import { useState, useRef } from "react";
import { View, Text, StyleSheet, FlatList, Dimensions, Pressable, type NativeSyntheticEvent, type NativeScrollEvent } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { Logo } from "@/components/Logo";
import { colors, radius, spacing, typography } from "@/lib/theme";

const { width } = Dimensions.get("window");

const slides = [
  {
    key: "reach",
    emoji: "📞",
    title: "Ulaşılabilir kal",
    body:
      "Telefonunu cama yazma. Tagora sticker'ıyla anonim iletişim aç, kimliğin sende kalsın.",
  },
  {
    key: "one",
    emoji: "🎯",
    title: "Tek hesap, sonsuz sticker",
    body:
      "Araban, kapı zilin, evcil hayvanın, bagajın — hepsini tek panelden yönet.",
  },
  {
    key: "privacy",
    emoji: "🔒",
    title: "Privacy senin hakkın",
    body:
      "KVKK Md.11 self-service. Mesajlar 90 gün sonra silinir. Tek tıkla verimi indir veya hesabımı sil.",
  },
] as const;

export default function Onboarding() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const listRef = useRef<FlatList>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / width);
    if (p !== page) setPage(p);
  };

  const next = () => {
    if (page < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: page + 1, animated: true });
    } else {
      router.push("/(auth)/login");
    }
  };

  return (
    <Screen padded={false}>
      <View style={styles.top}>
        <Logo size="sm" />
        <Pressable onPress={() => router.push("/(auth)/login")} hitSlop={12}>
          <Text style={styles.skip}>Atla</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.emojiBox}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === page ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <Button
          label={page === slides.length - 1 ? "Başla" : "İleri"}
          onPress={next}
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  skip: { ...typography.bodyBold, color: colors.muted },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  emojiBox: {
    width: 140,
    height: 140,
    borderRadius: radius.xxl,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxxl,
  },
  emoji: { fontSize: 68 },
  title: { ...typography.h1, color: colors.navy, textAlign: "center", marginBottom: spacing.md },
  body: { ...typography.body, color: colors.muted, textAlign: "center", maxWidth: 320 },
  bottom: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: colors.navy, width: 24 },
  dotInactive: { backgroundColor: colors.navyMuted },
});
