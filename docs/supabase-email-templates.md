# Supabase Auth Email Templates — Türkçe / Tagora Brand

Bu dosya Supabase Dashboard → **Authentication → Emails → Templates** altındaki
6 email şablonunu içerir. Her şablonun **Subject** ve **HTML body**'sini olduğu gibi
paste et. Custom SMTP ayarlarında Brevo bağlı olduğu için gönderim `bildirim@tagora.com.tr`
adresinden çıkar.

## Kullanılan Supabase değişkenleri

- `{{ .ConfirmationURL }}` — aksiyon linki (magic link, confirm vb.)
- `{{ .Token }}` — 6 haneli OTP kodu (opsiyonel — kullanıcı direkt kod da girebilir)
- `{{ .Email }}` — kullanıcı email adresi
- `{{ .SiteURL }}` — https://tagora.com.tr

## Tagora brand renkleri

- Navy: `#0c1e40`
- Accent (gold): `#f5b83c`
- Charcoal text: `#111827`
- Background: `#f9fafb`

---

## 1) Confirm signup (yeni kayıt)

**Subject:**

```
Tagora — Hesabını Onayla
```

**HTML body:**

```html
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#f9fafb;color:#111827;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:#ffffff;border-radius:12px;padding:32px 24px;border:1px solid #e5e7eb;">
      <div style="font-size:22px;font-weight:800;color:#0c1e40;margin-bottom:4px;letter-spacing:-0.02em;">Tagora</div>
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:24px;">Gizlilik-önce QR sticker</div>

      <h1 style="font-size:20px;margin:0 0 12px;color:#0c1e40;">Hoş geldin!</h1>
      <p style="line-height:1.6;margin:8px 0;color:#374151;">
        Tagora'ya kaydolduğun için teşekkürler. Devam etmek için aşağıdaki butona basıp email adresini onayla.
      </p>

      <p style="text-align:center;margin:24px 0;">
        <a href="{{ .ConfirmationURL }}"
           style="display:inline-block;background:#0c1e40;color:#f5b83c;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
          Email Adresimi Onayla →
        </a>
      </p>

      <p style="font-size:13px;color:#6b7280;line-height:1.6;">
        Ya da 6 haneli kodu girmek istersen:
        <br>
        <strong style="font-size:22px;letter-spacing:0.15em;color:#0c1e40;font-family:'SF Mono',Menlo,monospace;">{{ .Token }}</strong>
      </p>

      <p style="font-size:12px;color:#9ca3af;margin-top:24px;line-height:1.5;">
        Bu linki sen istemediysen bu maili görmezden gelebilirsin — hesabın oluşturulmaz.
      </p>
    </div>
    <div style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px;line-height:1.5;">
      Tagora · <a href="https://tagora.com.tr" style="color:#6b7280;">tagora.com.tr</a> · <a href="mailto:destek@tagora.com.tr" style="color:#6b7280;">destek@tagora.com.tr</a>
    </div>
  </div>
</body>
</html>
```

---

## 2) Magic Link (mevcut kullanıcı giriş)

**Subject:**

```
Tagora — Giriş Linkin
```

**HTML body:**

```html
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#f9fafb;color:#111827;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:#ffffff;border-radius:12px;padding:32px 24px;border:1px solid #e5e7eb;">
      <div style="font-size:22px;font-weight:800;color:#0c1e40;margin-bottom:4px;letter-spacing:-0.02em;">Tagora</div>
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:24px;">Gizlilik-önce QR sticker</div>

      <h1 style="font-size:20px;margin:0 0 12px;color:#0c1e40;">Giriş linki geldi 🔑</h1>
      <p style="line-height:1.6;margin:8px 0;color:#374151;">
        Aşağıdaki butona tıklayarak şifresiz giriş yapabilirsin. Link 60 dakika geçerlidir.
      </p>

      <p style="text-align:center;margin:24px 0;">
        <a href="{{ .ConfirmationURL }}"
           style="display:inline-block;background:#0c1e40;color:#f5b83c;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
          Tagora'ya Giriş Yap →
        </a>
      </p>

      <p style="font-size:13px;color:#6b7280;line-height:1.6;">
        Ya da uygulamada 6 haneli kodu kullanabilirsin:
        <br>
        <strong style="font-size:22px;letter-spacing:0.15em;color:#0c1e40;font-family:'SF Mono',Menlo,monospace;">{{ .Token }}</strong>
      </p>

      <p style="font-size:12px;color:#9ca3af;margin-top:24px;line-height:1.5;">
        Bu linki sen istemediysen bu maili görmezden gel — kimse hesabına giriş yapamaz.
      </p>
    </div>
    <div style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px;line-height:1.5;">
      Tagora · <a href="https://tagora.com.tr" style="color:#6b7280;">tagora.com.tr</a> · <a href="mailto:destek@tagora.com.tr" style="color:#6b7280;">destek@tagora.com.tr</a>
    </div>
  </div>
</body>
</html>
```

---

## 3) Change Email Address (email değişikliği)

**Subject:**

```
Tagora — Yeni Email Adresini Onayla
```

**HTML body:**

```html
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#f9fafb;color:#111827;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:#ffffff;border-radius:12px;padding:32px 24px;border:1px solid #e5e7eb;">
      <div style="font-size:22px;font-weight:800;color:#0c1e40;margin-bottom:4px;letter-spacing:-0.02em;">Tagora</div>
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:24px;">Gizlilik-önce QR sticker</div>

      <h1 style="font-size:20px;margin:0 0 12px;color:#0c1e40;">Email değişikliğini onayla</h1>
      <p style="line-height:1.6;margin:8px 0;color:#374151;">
        Tagora hesabında email adresini değiştirmek istedin. Yeni adresin <strong>{{ .Email }}</strong>.
        Değişikliği onaylamak için butona bas.
      </p>

      <p style="text-align:center;margin:24px 0;">
        <a href="{{ .ConfirmationURL }}"
           style="display:inline-block;background:#0c1e40;color:#f5b83c;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
          Yeni Email Adresimi Onayla →
        </a>
      </p>

      <p style="font-size:12px;color:#9ca3af;margin-top:24px;line-height:1.5;">
        Bu değişikliği sen yapmadıysan hemen <a href="mailto:destek@tagora.com.tr" style="color:#0c1e40;">destek@tagora.com.tr</a> ile iletişime geç.
      </p>
    </div>
    <div style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px;line-height:1.5;">
      Tagora · <a href="https://tagora.com.tr" style="color:#6b7280;">tagora.com.tr</a> · <a href="mailto:destek@tagora.com.tr" style="color:#6b7280;">destek@tagora.com.tr</a>
    </div>
  </div>
</body>
</html>
```

---

## 4) Reset Password (şifre yenileme)

**NOT:** Şu an magic link akışı kullandığımız için bu template pratikte tetiklenmez.
Yine de default İngilizce kalmasın diye Türkçe versiyon.

**Subject:**

```
Tagora — Şifreni Yenile
```

**HTML body:**

```html
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#f9fafb;color:#111827;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:#ffffff;border-radius:12px;padding:32px 24px;border:1px solid #e5e7eb;">
      <div style="font-size:22px;font-weight:800;color:#0c1e40;margin-bottom:4px;letter-spacing:-0.02em;">Tagora</div>
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:24px;">Gizlilik-önce QR sticker</div>

      <h1 style="font-size:20px;margin:0 0 12px;color:#0c1e40;">Şifre yenileme linki</h1>
      <p style="line-height:1.6;margin:8px 0;color:#374151;">
        Aşağıdaki butonla yeni bir şifre belirleyebilirsin.
      </p>

      <p style="text-align:center;margin:24px 0;">
        <a href="{{ .ConfirmationURL }}"
           style="display:inline-block;background:#0c1e40;color:#f5b83c;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
          Yeni Şifre Belirle →
        </a>
      </p>

      <p style="font-size:12px;color:#9ca3af;margin-top:24px;line-height:1.5;">
        Şifreni sen yenilemek istemediysen bu maili görmezden gelebilirsin.
      </p>
    </div>
    <div style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px;line-height:1.5;">
      Tagora · <a href="https://tagora.com.tr" style="color:#6b7280;">tagora.com.tr</a> · <a href="mailto:destek@tagora.com.tr" style="color:#6b7280;">destek@tagora.com.tr</a>
    </div>
  </div>
</body>
</html>
```

---

## 5) Invite user (davet)

**Subject:**

```
Tagora'ya Davet Edildin
```

**HTML body:**

```html
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#f9fafb;color:#111827;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:#ffffff;border-radius:12px;padding:32px 24px;border:1px solid #e5e7eb;">
      <div style="font-size:22px;font-weight:800;color:#0c1e40;margin-bottom:4px;letter-spacing:-0.02em;">Tagora</div>
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:24px;">Gizlilik-önce QR sticker</div>

      <h1 style="font-size:20px;margin:0 0 12px;color:#0c1e40;">Tagora'ya davetlisin 🎉</h1>
      <p style="line-height:1.6;margin:8px 0;color:#374151;">
        Tagora'ya davet edildin. Aşağıdaki butonla hesabını oluştur ve başla.
      </p>

      <p style="text-align:center;margin:24px 0;">
        <a href="{{ .ConfirmationURL }}"
           style="display:inline-block;background:#0c1e40;color:#f5b83c;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
          Daveti Kabul Et →
        </a>
      </p>
    </div>
    <div style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px;line-height:1.5;">
      Tagora · <a href="https://tagora.com.tr" style="color:#6b7280;">tagora.com.tr</a> · <a href="mailto:destek@tagora.com.tr" style="color:#6b7280;">destek@tagora.com.tr</a>
    </div>
  </div>
</body>
</html>
```

---

## 6) Reauthentication (kimlik doğrulama)

**Subject:**

```
Tagora — Kimlik Doğrulama Kodu
```

**HTML body:**

```html
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;background:#f9fafb;color:#111827;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:#ffffff;border-radius:12px;padding:32px 24px;border:1px solid #e5e7eb;">
      <div style="font-size:22px;font-weight:800;color:#0c1e40;margin-bottom:4px;letter-spacing:-0.02em;">Tagora</div>
      <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:24px;">Gizlilik-önce QR sticker</div>

      <h1 style="font-size:20px;margin:0 0 12px;color:#0c1e40;">Kimlik doğrulama kodu</h1>
      <p style="line-height:1.6;margin:8px 0;color:#374151;">
        Kritik bir işlem için kimlik doğrulaman gerek. Aşağıdaki kodu uygulamada gir:
      </p>

      <p style="text-align:center;margin:24px 0;">
        <strong style="font-size:32px;letter-spacing:0.2em;color:#0c1e40;font-family:'SF Mono',Menlo,monospace;">{{ .Token }}</strong>
      </p>

      <p style="font-size:12px;color:#9ca3af;margin-top:24px;line-height:1.5;">
        Bu kodu sen istemediysen kimseyle paylaşma ve hemen <a href="mailto:destek@tagora.com.tr" style="color:#0c1e40;">destek@tagora.com.tr</a> ile iletişime geç.
      </p>
    </div>
    <div style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px;line-height:1.5;">
      Tagora · <a href="https://tagora.com.tr" style="color:#6b7280;">tagora.com.tr</a> · <a href="mailto:destek@tagora.com.tr" style="color:#6b7280;">destek@tagora.com.tr</a>
    </div>
  </div>
</body>
</html>
```
