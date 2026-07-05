/**
 * Root layout — providers ve auth-based navigation guard.
 *
 * ⚠️ Polyfills MUST run before any Supabase / crypto usage:
 * - react-native-get-random-values: crypto.getRandomValues() polyfill (@tagora/shared token.ts için)
 * - react-native-url-polyfill: URL constructor + Supabase realtime için
 */
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";

import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

/** Deep link (tagora://auth-callback?...) veya session'a göre redirect */
function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Deep link handler — magic link callback için
  useEffect(() => {
    const handleUrl = async ({ url }: { url: string }) => {
      const parsed = Linking.parse(url);
      // Magic link callback: tagora://auth-callback?access_token=...&refresh_token=...
      const params = parsed.queryParams ?? {};
      const accessToken =
        (params["access_token"] as string) ?? (params["code"] as string);
      const refreshToken = params["refresh_token"] as string | undefined;

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        router.replace("/(tabs)/");
      }
    };

    // İlk açılış URL'i
    Linking.getInitialURL().then((url) => url && handleUrl({ url }));
    const sub = Linking.addEventListener("url", handleUrl);
    return () => sub.remove();
  }, [router]);

  // Auth state'e göre redirect
  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!session && !inAuthGroup) {
      router.replace("/(auth)/onboarding");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)/");
    }
  }, [session, loading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="claim"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen name="inbox/[id]" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <AuthGate />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
