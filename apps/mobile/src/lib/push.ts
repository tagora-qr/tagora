/**
 * Push notifications helper — Expo Push Token registration + notification handling.
 *
 * Akış:
 *   1. Uygulama açılışında (session var ise) permission iste
 *   2. Expo Push Token üret (Expo Go'da Expo credentials, prod'da APN/FCM)
 *   3. Token'ı public.users.push_token'a yaz (Supabase upsert)
 *   4. Kullanıcı bildirime tıklayınca → conversation'a yönlendir
 *
 * Not: iOS'ta permission dialog'u ilk `getPermissionsAsync` sonrası tetiklenir.
 *      Android'de otomatik (API 32'ye kadar). API 33+ için POST_NOTIFICATIONS runtime.
 */
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { supabase } from "./supabase";

// Foreground'de gelen bildirimlerde ne göster?
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Permission + token — session var iken çağırılır. Idempotent. */
export async function registerForPushNotifications(
  userId: string,
): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("[push] Simulator — push tokens are not available");
    return null;
  }

  // Android channel (API 26+)
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Tagora",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0F1B3D",
    });
  }

  // Permission
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    console.log("[push] Permission denied");
    return null;
  }

  // Expo Push Token
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  try {
    const tokenResult = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenResult.data;

    // DB'ye yaz (auth_user_id ile update)
    const { error } = await supabase
      .from("users")
      .update({ push_token: token })
      .eq("auth_user_id", userId);

    if (error) {
      console.warn("[push] token save failed", error.message);
      return null;
    }

    console.log("[push] token registered", token.slice(0, 20) + "…");
    return token;
  } catch (e) {
    console.warn("[push] getExpoPushTokenAsync failed", e);
    return null;
  }
}

/** Notification tap listener — kullanıcı bildirime tıklayınca conversation'a yönlendir.
 *  Returns cleanup fn — useEffect return'ünden çağırılmalı. */
export function attachNotificationResponseListener(
  onConversation: (conversationId: string) => void,
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data as {
        type?: string;
        conversation_id?: string;
      } | null;

      if (data?.type === "new_message" && data.conversation_id) {
        onConversation(data.conversation_id);
      }
    },
  );

  return () => subscription.remove();
}
