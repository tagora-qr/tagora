# Tagora — Privacy-first QR Sticker Platform

> Bir QR, sonsuz bağlantı. Telefonunu paylaşmadan ulaşılabilir kal.

Tagora, kullanıcıların araç camına telefon numarası yazmak yerine, QR sticker ile anonim iletişim kurmasını sağlayan privacy-first bir platformdur. Web + Mobile + Sticker satış operasyonu üçlüsünden oluşur.

**Ürün durumu**: Sprint 1 tamamlandı — web + mobile canlıda, uçtan uca çalışıyor. Sprint 2-3 devam ediyor.

## Mimari

```
tagora/                            (monorepo — pnpm workspaces)
├─ apps/
│  ├─ web/                         Next.js 15 App Router (Vercel'de deploy — tagora.com.tr)
│  │  ├─ src/app/                  Landing, /shop, /login, /dashboard, /kvkk /privacy /terms /cookies
│  │  ├─ src/app/s/[token]/        Scanner sayfası (app gerektirmez)
│  │  ├─ src/app/api/              Server endpoints (waitlist, claim, scanner send, KVKK export/delete)
│  │  └─ src/lib/                  Supabase clients (server/browser/scanner)
│  │
│  └─ mobile/                      Expo SDK 54 + React Native 0.81 (iOS + Android)
│     ├─ app/                      expo-router file-based (auth/onboarding, tabs/stickers/inbox/profile)
│     ├─ app/claim.tsx             Native QR scanner (expo-camera)
│     ├─ app/inbox/[id].tsx        Real-time chat
│     └─ src/                      theme, supabase client, auth context
│
├─ packages/
│  ├─ db/                          Supabase migrations + TS types (10 tablo + RLS + KVKK cron)
│  └─ shared/                      Token generator (Base62 crypto random), moderation, quick templates
│
├─ legal/tr/                       KVKK Aydınlatma / Gizlilik / ToS / Çerez politikaları (markdown)
│
├─ scripts/
│  └─ generate-tokens.mjs          Batch token üreteci (üretici için CSV çıktısı + DB insert)
│
├─ tagora-master-plan.pdf          10 fazlık strateji dokümanı (Sprint 0 sonu)
└─ 01…10-*.md                      Master plan fazlarının detay markdown'ları
```

## Hızlı başlangıç

### 1. Ön koşullar
- Node 20+, pnpm 9+
- Supabase hesap (EU/Frankfurt region!)
- iOS için Xcode veya Expo Go, Android için Android Studio veya Expo Go

### 2. Kur
```bash
git clone https://github.com/tagora-qr/tagora.git
cd tagora
pnpm install

cp .env.example .env.local
cp .env.example apps/web/.env.local     # Next.js için ayrı yer bekler
cp .env.example apps/mobile/.env         # EXPO_PUBLIC_* prefix'li
```

### 3. Supabase kur
1. [Supabase Dashboard](https://supabase.com/dashboard) → New Project, **Region: Frankfurt (eu-central-1)** — KVKK için kritik
2. Project Settings → API → URL & anon key & service_role key → env dosyalarına
3. SQL Editor'de sırayla çalıştır:
   - `packages/db/supabase/migrations/20260520000001_initial_schema.sql`
   - `packages/db/supabase/migrations/20260520000002_rls_policies.sql`
   - `packages/db/supabase/migrations/20260520000003_cron_cleanup.sql`
4. Authentication → Providers → Email → Magic Link enable
5. Authentication → URL Configuration → Site URL + Redirect URLs

### 4. Custom SMTP (Resend)
Free tier'da 2 email/saat sınırı var. Auth email'leri için Resend SMTP kur (bkz. Sprint 3 notları).

### 5. Dev
```bash
pnpm dev:web                   # Next.js — localhost:3000
pnpm dev:mobile                # Expo Metro — iPhone Expo Go'da QR tara
```

### 6. Test sticker üret
```bash
node scripts/generate-tokens.mjs 10 --insert
# 10 unique QR token DB'ye insert eder + CSV çıktısı
```

## Deploy

### Web (Vercel)
```bash
cd apps/web
vercel --prod
```

Vercel monorepo config'i `apps/web/vercel.json`'da tanımlı:
- Region: Frankfurt (Supabase EU ile aynı — minimum latency)
- Build: root'tan `pnpm --filter @tagora/web build`
- Custom domain: `tagora.com.tr`

### Mobile (EAS Build — Sprint 4-5)
```bash
cd apps/mobile
eas build --platform ios      # TestFlight
eas build --platform android  # APK/AAB
```

## Kritik mimari kararlar

### QR Token Sistemi
- Her sticker `tagora.link/s/<token>` URL'iyle public
- Token = **10 char Base62** cryptographic random (62¹⁰ ≈ 8.4×10¹⁷ kombinasyon)
- Batch üretim: `scripts/generate-tokens.mjs 5000 --insert`

### KVKK & Privacy by Design
- **Veri yerleşimi**: Supabase EU (Frankfurt) zorunlu
- **Scanner cihaz fingerprint**: 24 saat sonra `purge_expired_fingerprints()` null'lar
- **Mesajlar**: 90 gün sonra `soft_delete_old_messages()` soft delete
- **Scanner sessions**: 7 gün TTL, `purge_expired_sessions()` siler
- **User self-service**: `/api/account/export` (JSON) + `/api/account/delete` (RPC `delete_my_account`)
- Cron için: Supabase Scheduled Functions veya pg_cron ile günlük

### RLS (Row-Level Security)
- Tüm 10 tabloda açık
- Helper: `current_user_id()` — auth.uid()'den public.users.id
- Helper: `current_scanner_session_id()` — `x-scanner-session` header'dan (security definer, recursion önleme)
- Scanner sadece kendi session'ını + sticker public subset'i görür
- Owner kendi sticker'ları + conversation'ları + messages'ları görür

### Real-time chat
- Supabase Realtime postgres_changes (INSERT filter with conversation_id)
- Web ve mobile aynı anda subscribe olabilir, çift yön canlı

### Moderation
- `packages/shared/src/moderation.ts` — v0 keyword + regex
- Threat/phishing → hard block (allowed: false)
- Spam/profanity → flag (gönderilir, sahip moderasyon eder)
- Rate limit: günlük 10 mesaj/scanner/sticker

## Sprint durumu

| Sprint | Durum | Ne yapıldı |
|---|---|---|
| Sprint 0 | ✅ | Master plan (Word/PDF), 10 fazlık strateji |
| Sprint 1 | ✅ | Monorepo, Supabase backend, web MVP, mobile MVP, real-time chat, auth, KVKK altyapı |
| Sprint 2 | ✅ | Mobile Expo Go debug, Resend SMTP, email template, mobile OTP auth |
| Sprint 3 | 🔄 | Legal metinleri, domain (tagora.com.tr + tagora.link), Vercel production deploy |
| Sprint 4 | ⏳ | iyzico shop + checkout, GitHub Actions CI/CD |
| Sprint 5 | ⏳ | Sticker üretici RFQ, ilk 5K batch, kargo entegrasyonu |
| Sprint 6 | ⏳ | Beta lansman, App Store submit, closed beta |

## Belgeler

- **Master plan**: `tagora-master-plan.pdf` — 10 fazlık strateji (pazar, isim, PRD, teknik, UX, iş modeli, tedarik, hukuk, sprint, lansman)
- **Hukuk metinleri**: `legal/tr/` — KVKK Aydınlatma, Gizlilik, ToS, Çerez politikaları
- **Faz detayları**: `01-pazar-analizi.md`, `02-isim-marka.md`, ... `10-lansman-buyume.md`

## Lisans

Proprietary © 2026 Tagora Teknoloji. Tüm hakları saklıdır.
