# Release Notes

## v0.2.0 — 2026-07-10

Bu sürüm ile abonelik sistemi, mobil ödeme akışı ve profil ekranı komple yenilendi.
Ayrıca Android 15 edge-to-edge modda alt sistem butonlarıyla çakışan tab bar
sorunu giderildi.

### Yenilikler

- **Yıllık abonelik sistemi** (99 TL/yıl, ilk yıl bedava)
  - İlk sticker'ını claim eden kullanıcı için 1 yıl deneme otomatik başlar
  - Bitmeden 30 gün önce sarı uyarı banner'ı
  - Süre bitince 30 gün ek süre + turuncu banner
  - Ek süre de biterse cevap yazma kapatılır (kırmızı banner + input lock)
- **Profil ekranı yenilendi**
  - Plan artık gerçek abonelik durumunu gösteriyor (Deneme / Aktif · X gün / Ek süre / Süresi doldu)
  - Renkli abonelik kartı: yeşil (aktif), sarı (bitiyor), turuncu (ek süre), kırmızı (kapalı)
  - "Sticker satın al", "Siparişlerim", "Bilgileri düzenle" hızlı erişim
- **Web'de otomatik login (handoff)**
  - Uygulamadan web sayfası açtığında (satın alma, abonelik yenileme, hesap ayarları) web'de tekrar giriş yapmana gerek yok
- **Bildirim izin akışı iyileştirildi**
  - iOS ve Android için ayrı yönergeler
  - "Sistem Ayarlarını Aç" butonu ile direkt Tagora ayarına
- **Chat readonly banner + input kilit**
  - Abonelik biterse chat'te uyarı görürsün, yenileme linki tek tıkla
- **Ana ekran boş görünüm**
  - "Sticker Satın Al" ve "Elimdeki QR'ı Tara" butonları

### Düzeltmeler

- Android 15 edge-to-edge modda tab bar sistem butonlarına çakışıyor sorunu
- Profil ekranında "Çıkış Yap" butonu nav bar altına kalıyor sorunu
- Bildirim izin metninde iOS/Android karışıklığı

---

## v0.1.0 — İlk Play Store yayın

- QR sticker claim + inbox + real-time chat
- Push notification
- KVKK self-service (verini indir, hesabımı sil)
- Deep linking (tagora.link/s/*)
