# @tagora/mobile

Tagora'nın native mobil uygulaması — Expo SDK 52 + React Native 0.76 + Expo Router (file-based routing) + Supabase.

## Ekran haritası

```
app/
├─ _layout.tsx                  Root providers + auth gate
├─ index.tsx                    Splash / redirect
├─ (auth)/
│  ├─ onboarding.tsx            3 ekranlı tanıtım
│  └─ login.tsx                 Magic link auth
├─ (tabs)/                      Bottom tabs (Stickers / Inbox / Profil)
│  ├─ index.tsx                 Sticker listesi
│  ├─ inbox.tsx                 Konuşmalar
│  └─ profile.tsx               Hesap + KVKK self-service
├─ claim.tsx                    QR scanner modal (expo-camera)
└─ inbox/[id].tsx               Chat ekranı (real-time)
```

## Ön koşullar

- Node 20+, pnpm 9+
- iOS için: macOS + Xcode 15+ (Simulator) veya iPhone + Expo Go app
- Android için: Android Studio (Emulator) veya Android telefon + Expo Go app
- Backend zaten kurulu olmalı (bkz. `apps/web/README.md`)

## Kurulum

Root'ta zaten `pnpm install` yaptıysan mobile paketi de kurulmuştur:

```bash
cd apps/mobile
```

## Env dosyası

Zaten oluşturulmuş `apps/mobile/.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ `EXPO_PUBLIC_APP_URL` — telefon fiziksel cihazsa `localhost:3000` çalışmaz.
Mac'in local IP'si kullan: `EXPO_PUBLIC_APP_URL=http://192.168.1.XX:3000`.
IP öğrenmek için: Sistem Tercihleri → Ağ → Wi-Fi → Detaylar.

## Çalıştırma

```bash
# Expo dev server başlat (root'tan)
pnpm --filter @tagora/mobile start

# Ya da:
cd apps/mobile
pnpm start
```

Terminal'de bir QR kod belirir. iPhone'da **Expo Go** app'i indir, QR'ı kameradan tara. Emülatörde:

```bash
pnpm --filter @tagora/mobile ios       # iOS Simulator
pnpm --filter @tagora/mobile android   # Android Emulator
```

## Auth akışı — magic link + deep link

1. Kullanıcı e-mail girer, "Giriş Linki Gönder"
2. Supabase magic link e-postası gelir
3. E-mail'den linke tıklar → **cihazda tarayıcı açılır**
4. Tarayıcı Tagora app'e `tagora://` scheme ile yönlendirir
5. `_layout.tsx` içindeki `Linking.addEventListener("url")` bunu yakalar
6. `supabase.auth.setSession(...)` ile session kurulur
7. Ana sekmelere redirect

**Not**: Expo Go'da development sırasında deep link farklı çalışır — `exp://...` prefix'i kullanılır. Prod build'te `tagora://` çalışır. Test için:
- Development: E-postadaki link Expo Go'yu açar, session yine kurulur
- Production: EAS Build ile standalone binary alınca deep link native çalışır

## Sticker claim — QR scanner

`app/claim.tsx` modal olarak açılır. `expo-camera` + `CameraView.onBarcodeScanned` ile QR okur. URL formatını parse eder:

```
https://tagora.app/s/<10-char-token>
→ extract token → validate → form
```

Claim işlemi web'deki `/api/stickers/claim` endpoint'ine POST atar (service_role RLS bypass için). Development'ta bu `http://localhost:3000/api/stickers/claim` — dolayısıyla dev server açık olmalı.

## Chat — real-time subscription

`app/inbox/[id].tsx` içinde:

```ts
supabase.channel(`conv-mobile-${conversationId}`)
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages",
      filter: `conversation_id=eq.${conversationId}` },
    (payload) => setMessages(prev => [...prev, payload.new]))
  .subscribe();
```

Web ile aynı Supabase Realtime kanalı — mobile'dan mesaj gönderirsen web'de canlı, tersi de.

## KVKK self-service

`app/(tabs)/profile.tsx`:
- **Verimi indir** → `supabase.rpc("export_my_data")` — JSON döner
- **Hesabımı sil** → `supabase.rpc("delete_my_account")` — anonimleştir + sticker'ları retire et
- **Bildirimler** → Sprint 3'te expo-notifications ile aktif

## Sprint 3 için planlı

- [ ] Push notifications (expo-notifications + Supabase Edge Function trigger)
- [ ] expo-file-system ile `export_my_data` JSON'u cihaza kaydet + Share sheet
- [ ] Local biometric lock (expo-local-authentication) — chat aç önce Face/Touch ID
- [ ] Deep link'ten direkt scanner sayfası aç (üçüncü taraf QR reader'lardan)
- [ ] Sticker detay ekranı
- [ ] i18n (next-intl mobile alternatifi: i18n-js)

## EAS Build (production, Sprint 4)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios       # TestFlight için
eas build --platform android   # APK/AAB için
eas submit                     # Store'a yükle
```

Store submission öncesi:
- App icon (1024×1024)
- Splash screen tasarımı
- App Store metadata (screenshot, description, KVKK URL)
- App Store review — anonim iletişim policy'si için content moderation dökümanı hazır tutmalı
