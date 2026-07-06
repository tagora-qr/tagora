# Tagora Roadmap

**Bugünün tarihi:** 2026-07-06 (canlı)

Bu belge biriken fikirleri ve planları kategori bazlı organize eder. Task listesi çalışan işler için; bu roadmap **gelecek hikayesi** için.

## Öncelik legendı

- 🔴 **Kritik** — Şu haftada halledilmesi lazım
- 🟡 **Önemli** — Bu ay içinde
- 🟢 **İdeal** — Sonraki 3 ay içinde
- 🔵 **Enterprise / Uzak vadeli** — Talep gelirse veya ölçek büyürse

---

## 📱 Mobil App Yayını

### 🔴 iOS App Store (öncelik)
- [ ] Apple Developer Program başvurusu **← YANIT BEKLENİYOR**
- [ ] EAS iOS build kurulumu (`eas.json`)
- [ ] iOS icon + splash screen assetleri
- [ ] TestFlight ile kendi test
- [ ] App Store listing (kısa/uzun açıklama, kategori, keywords)
- [ ] 6.5" iPhone screenshots (1290×2796) — 6-8 adet
- [ ] Data Safety form
- [ ] Content rating
- [ ] Submit for review

### 🟡 Google Play (Android)
- [ ] Play Console verify tamamla (Android device + phone number) **← ARKADAŞ / ALINACAK TELEFON BEKLENİYOR**
- [ ] EAS Android build (`gradle` config)
- [ ] Play Store listing (feature graphic 1024×500, screenshots)
- [ ] Data safety
- [ ] Content rating
- [ ] Internal test → Closed test → Production

### 🟢 App Yayına Geçince
- [ ] Vercel env: `NEXT_PUBLIC_APP_STORE_URL` set
- [ ] Vercel env: `NEXT_PUBLIC_GOOGLE_PLAY_URL` set
- [ ] Homepage app section otomatik güncellenecek ("Yakında" → link)

---

## ✨ Ürün Özellikleri

### 🟡 Sticker Özelleştirme — Katman 2 (Dijital)

**Ne:** QR taranınca açılan sayfa, kullanıcının seçimlerine göre değişir.

**MVP kapsamı:**
- Karşılama mesajı (300 karakter, moderation filter)
- Bilgi kartı (200 karakter) — "Ne için kullanıyorum"
- Tema (açık/koyu/sistem)
- Accent renk (6 preset + custom hex)

**Teknik:**
- Migration: `stickers.customization jsonb`
- Sayfa: `/dashboard/stickers/[id]/customize` — form + canlı preview
- Server: `/s/[token]` render customization'ı okur

**Efor:** ~2 saat

### 🔵 Sticker Özelleştirme — Katman 1 (Fiziksel)

**Ne:** Sipariş anında sticker'ın kendisi özelleştirilir (renk, kenar, emoji).

**Dezavantaj:** Bulk print ekonomik değil, birim 3-5x, teslim 10-14 gün. Enterprise segmenti için ideal (5.000+ adet özel baskı).

**Kapsamı:**
- Sipariş formunda tasarım seçici
- Preview render (canvas ile)
- Matbaacıyla print-on-demand ilişkisi (mevcut RFQ + özel baskı)

**Efor:** ~1 hafta (matbaacı bağlantısı ekleyerek)

### 🟡 Business Dashboard MVP

**Ne:** B2B müşteriler için sipariş takip + kullanım metriklerini gösteren self-service portal.

**Kapsamı:**
- `/dashboard/business` — kurumsal görünüm
- Sipariş geçmişi + fatura download
- Sticker durum matrisi (dağıtılan / aktif / taranan)
- Toplu tarama istatistikleri (kişi bazında değil, toplu)
- Ekip üyeleri (basit invite)

**Efor:** ~4 saat

### 🟢 Kullanıcı Fotoğrafı / Media

**Ne:** Sticker'a resmi (pet, araç, obje fotoğrafı) yüklemek — QR taranınca da görünsün.

**Neden zor:** Supabase Storage + moderation (uygunsuz içerik filtresi) + CDN resize.

**Efor:** ~1 gün

### 🟢 Newsletter / Email Digest

**Ne:** Waitlist üyeleri + kullanıcılara haftalık rehber, ipuçları, kampanyalar.

**Kapsamı:**
- Cron endpoint (haftalık trigger)
- Template'ler (Brevo)
- Segmentation (waitlist / user / customer)
- Unsubscribe

**Efor:** ~4 saat

---

## 📝 İçerik & SEO

### 🟡 Blog — 2 makale daha
Task #82'de plan vardı, 3 yazıldı, 2 eksik:
- [ ] "KVKK ve QR sticker: Kişisel verileriniz nasıl korunur?"
- [ ] "Kayıp bagajınızı nasıl bulursunuz? Havalimanı ipuçları"

Blog altyapısı hazır (`articles.ts`), sadece 2 obje eklemek. **Efor: ~45 dk**

### 🟢 Yerel SEO
- [ ] Şehir bazlı landing sayfaları ("İstanbul'da QR sticker")
- [ ] Google My Business profil
- [ ] Yerel dizinlere (İç Anadolu Rehberi, Nirvam, İşportal) kayıt

### 🟢 Video içerik
- [ ] YouTube kanalı aç (@tagora, task #handle-checklist)
- [ ] "3 dakikada Tagora nedir" tanıtım videosu
- [ ] 5 use case için short-form Reels/TikTok

---

## 📢 Sosyal Medya & PR

### 🔴 İlk Post Yayını
- [ ] Instagram + X header/avatar SVG'leri (20 dk iş, henüz yapılmadı)
- [ ] `first-posts.md` POST 1'i yayınla — Pazartesi 20:15
- [ ] X launch thread — aynı gün 21:00
- [ ] İlk 60 dk yorum aktif ol

### 🟡 30 Günlük Ritim
- [ ] Haftada 3 IG + günlük X post (planlı `content-calendar-30d.md`)
- [ ] Metrik takibi (Instagram Insights + X Analytics + PostHog cross-referans)

### 🟢 Basın Erişimi
- [ ] Media kit hazırla (press@tagora.com.tr için)
- [ ] Webrazzi, Sipsak, Ekonomist outreach
- [ ] Podcast konuğu (Podcast Türkiye startup podcast'leri)

### 🟢 Influencer Collaboration
- [ ] Mikro-influencer (10K-50K) listesi (pet + otomotiv niche)
- [ ] Hediye + review + affiliate program

---

## 💼 B2B

### 🟡 Business Lead → Fulfilment Pipeline
- [ ] Admin panelde "Teklif hazırla" akışı (PDF generator?)
- [ ] Kurumsal fatura sistemi (Logo Yazılım / Paraşüt entegrasyonu)
- [ ] Kurumsal ödeme (BDDK onaylı EFT tak kabul)

### 🔵 Enterprise Features
- [ ] White-label (özel domain, tema, logo)
- [ ] REST API (public, dokümanla)
- [ ] Webhook (event bazlı)
- [ ] SSO (SAML/OIDC)
- [ ] Ekip yönetimi (çoklu kullanıcı, roller)

**Not:** Şu an /business sayfasında "Enterprise" etiketiyle işaretli. Gerçek Enterprise müşteri gelince yol haritası sıkılaştırılır.

---

## 🔧 Teknik & Altyapı

### 🔴 tagora.link DNS
- [ ] Registrar destek yanıtı bekle (task #36)
- [ ] Kısa link akışı yaygınlaşınca test et

### 🟡 Supabase Türkiye Region
- [ ] Supabase'in TR region duyurusunu takip et
- [ ] Duyurulunca migration planı yap (KVKK için ideal)

### 🟢 Rate Limiting
- [ ] Login endpoint (magic link) — brute force koruması
- [ ] Chat endpoint — spam koruması
- [ ] Business lead endpoint — zaten var (5 dk cooldown)

### 🟢 Monitoring & Alerts
- [ ] Sentry alerting (Slack veya email) — kritik hatalarda ping
- [ ] PostHog anomaly detection (dönüşüm oranı düşüşü)
- [ ] Uptime monitoring (Better Stack / UptimeRobot)

### 🟢 CI/CD İyileştirme
- [ ] E2E testler (Playwright / Cypress)
- [ ] Automated Lighthouse audits
- [ ] Preview deployment link comments

---

## 🎨 Görsel Assets

### 🔴 Sosyal Medya Header/Avatar
- [ ] Instagram profil fotoğrafı 320×320 (SVG hazır, PNG üret)
- [ ] X profil fotoğrafı 400×400
- [ ] X header 1500×500

### 🟡 Sticker Ürün Fotoğrafları
- [ ] Gerçek sticker'ları çekim
- [ ] Beş use-case senaryo (araç camında, kapıda, tasmada, valizde, bisikletta)
- [ ] Shop sayfasında package card'lara ekle
- [ ] Landing hero'da fake QR yerine gerçek fotoğraf

### 🟢 3D Renderler
- [ ] Sticker isometric 3D render (marketing malzemesi için)
- [ ] Anaimasyonlu explainer video

---

## 📊 Analytics & Growth

### 🟡 PostHog Setup Devam
- [ ] Funnel'a event ekle: `sticker:claimed`, `chat:message_sent`
- [ ] Retention chart (7 gün / 30 gün)
- [ ] A/B test framework (feature flags)

### 🟢 Attribution
- [ ] UTM template'i (Instagram, X, Blog, Email)
- [ ] Referral program (kullanıcı tavsiye etsin, kredi kazansın)

---

## Toplam Değerlendirme

**Şu an kritik yolda:**
1. iOS App Store yayını (Apple onayı bekleniyor)
2. Android verification (Android telefon lazım)
3. İlk sosyal medya postu (header'lar bekleniyor)

**Bir sonraki büyük değer:**
1. Sticker özelleştirme Katman 2 (2 saat, hızlı yatırım)
2. Business dashboard MVP (4 saat, B2B için)
3. Blog 2 makale (45 dk, SEO trafik için)

**Uzak vadeli:**
1. Enterprise white-label (talep gelince)
2. YouTube + short-form video (marka bilinirliği için)
3. Fiziksel sticker özelleştirme (Enterprise partner ile)

---

_Bu belge yaşayan bir doküman — plan değiştikçe güncellenir. Sürekli güncel tutmak için: her sprint sonunda 10 dakika ayırıp tamamlananları çıkart, yenileri ekle._
