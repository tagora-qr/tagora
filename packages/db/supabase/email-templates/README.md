# Supabase Auth Email Templates — Tagora

Bu klasördeki HTML dosyaları Supabase Cloud dashboard'a **manuel copy-paste**
edilir (Supabase Cloud email template'leri versiyon kontrolüne almıyor).

## Kurulum yeri

Supabase Dashboard → **Authentication** → **Email Templates**

Her template için:
1. İlgili sekmeyi seç (Confirm signup, Magic Link, Change Email Address vs)
2. **Subject** alanına aşağıdaki tablodan başlığı yaz
3. **Message (HTML)** alanına aynı isimli `.html` dosyanın içeriğini yapıştır
4. **Save** bas

## Template dosyaları

| Dosya | Supabase sekmesi | Subject |
|-------|------------------|---------|
| `magic-link.html` | Magic Link | `Tagora giriş kodun: {{ .Token }}` |
| `confirm-signup.html` | Confirm signup | `Tagora'ya hoş geldin — email'ini doğrula` |
| `change-email.html` | Change Email Address | `Tagora — yeni email adresini onayla` |
| `reset-password.html` | Reset Password | `Tagora — şifre sıfırlama link'in` |
| `invite.html` | Invite user | `Seni Tagora'ya davet ediyoruz` |
| `reauth.html` | Reauthentication | `Tagora — kimliğini yeniden doğrula` |

## Değişkenler (Supabase Auth)

- `{{ .Token }}` — 6 haneli OTP kodu (login/change-email için)
- `{{ .TokenHash }}` — link için kullanılan hash
- `{{ .ConfirmationURL }}` — Supabase'in oluşturduğu tıklanabilir link
- `{{ .Email }}` — mevcut email adresi
- `{{ .NewEmail }}` — yeni email (change-email için)
- `{{ .SiteURL }}` — https://tagora.com.tr

## Brand tokens

- Navy: `#0F1B3D`
- Lime accent: `#D4F36A`
- Cream bg: `#F9F7F1`
- Text: `#0F1B3D`
- Muted: `#6B7280`
- Border: `rgba(15, 27, 61, 0.1)`

## SMTP

Brevo (`bildirim@tagora.com.tr`) üzerinden gönderiliyor.
DNS doğrulaması: `tagora.com.tr` — SPF + DKIM aktif.
