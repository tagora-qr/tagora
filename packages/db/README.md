# @tagora/db

Tagora veritabanı şeması (Supabase / Postgres) + TypeScript tipleri.

## Yapı

```
supabase/
  migrations/
    20260520000001_initial_schema.sql   # Tablolar, enums, triggerlar
    20260520000002_rls_policies.sql     # Row-Level Security
    20260520000003_cron_cleanup.sql     # KVKK cleanup fonksiyonları
src/
  types.ts                              # Domain tipleri + Database tipi
  index.ts
```

## Local Setup

### 1. Supabase CLI ile (önerilen)

```bash
# Bir kere kur
npm install -g supabase

# Bu klasörde init (root'tan):
cd packages/db
supabase init                    # supabase/config.toml oluşturur (opsiyonel)
supabase start                   # local Postgres + studio başlat (Docker gerekli)

# Migration'ları çalıştır
supabase db reset                # tüm migration'ları yeniden uygular
```

### 2. Supabase Cloud (production)

```bash
# Supabase dashboard'dan project oluştur (region: Frankfurt — KVKK!)
# Sonra:
supabase link --project-ref YOUR_PROJECT_ID
supabase db push                 # migration'ları cloud'a yansıt
```

### 3. Manuel (CLI yoksa)

Supabase Studio → SQL Editor → her bir `.sql` dosyasını sırasıyla çalıştır.

## TypeScript Type Generation (production)

```bash
supabase gen types typescript --project-id YOUR_ID > src/database.types.ts
```

Şimdilik `types.ts` manuel yazılmış — schema değişince güncelle.

## KVKK Cleanup Jobs

3 zamanlı görev var:

```sql
-- Hepsini birden çalıştır:
select * from public.run_kvkk_cleanup();

-- Tek tek:
select public.purge_expired_fingerprints();   -- 24sa eski device hash'leri
select public.purge_expired_sessions();       -- 7gün eski scanner sessions
select public.soft_delete_old_messages();     -- 90gün eski mesajlar
```

Production'da pg_cron veya Supabase Scheduled Functions ile günlük çalıştır.

## Veri Sahibi Hakları (KVKK Md.11)

```sql
-- Kullanıcı kendi verisini export eder
select public.export_my_data();    -- jsonb döner

-- Kullanıcı hesabını siler (anonimleştirir)
select public.delete_my_account();
```

İkisi de authenticated context'te çalışır (auth.uid() üzerinden).

## Şema Genel Bakış

```
users ── 1:N ── stickers ── 1:N ── conversations ── 1:N ── messages
                  │                      │
                  │                      │
                  └── 1:N ── scanner_sessions
                  └── 1:N ── abuse_reports
```

- **users**: sticker sahibi (auth.users ile 1:1)
- **stickers**: tekil sticker, `token` = public scanner URL anahtarı
- **scanner_sessions**: anonim ziyaretçi (24sa fingerprint TTL, 7gün session TTL)
- **conversations**: sahip ↔ scanner konuşması (sticker_id + scanner_session_id unique)
- **messages**: chat mesajları (90gün sonra soft-delete)
- **abuse_reports**: spam/şikayet kuyruğu

## Güvenlik

- **RLS açık** her tabloda
- Phone field `pgp_sym_encrypt` ile şifrelenmeli (uygulama tarafında)
- Service role key SADECE backend'de (admin / cron / token batch generation)
- Anon key RLS'e tabi → sadece scanner akışları için yeterli
