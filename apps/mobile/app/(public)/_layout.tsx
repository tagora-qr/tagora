/**
 * Public route group — auth gerektirmez.
 *
 * Şu an sadece scanner: /s/[token]
 * (Anonim ziyaretçi QR taradığında Universal Link ile buraya düşer.)
 */
import { Stack } from "expo-router";

export default function PublicLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    />
  );
}
