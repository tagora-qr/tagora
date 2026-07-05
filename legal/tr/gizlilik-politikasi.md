# Gizlilik Politikası

**Yürürlük Tarihi**: 2026-07-05
**Versiyon**: 1.0

Tagora Teknoloji ("**Tagora**", "**biz**") olarak sunduğumuz web sitesi (`tagora.com.tr`, `tagora.link`), mobil uygulama ("**Tagora**") ve bu platformlar üzerinden sunduğumuz QR sticker hizmetlerini ("**Hizmet**") kullanırken kişisel verilerinizin korunmasına en yüksek özeni gösteririz.

Bu Gizlilik Politikası; Tagora'nın kişisel verileri hangi ilkelerle işlediğini, hangi ürün özelliklerinde hangi verilerin toplandığını, kimlerle paylaşıldığını, ne kadar süre saklandığını ve haklarınızı **kolayca anlaşılır bir dille** özetlemektedir.

Detaylı yasal metin için [KVKK Aydınlatma Metni](/kvkk) sayfamıza bakınız.

---

## 1. Temel İlkeler

Tagora'nın veri işleme yaklaşımı **"Privacy by Design"** felsefesine dayanır:

- **Minimum veri**: Sadece hizmeti sunmak için gereken veriyi toplarız.
- **Şeffaflık**: Hangi verinin neden işlendiğini herkes görsün diye açıkça yazarız.
- **Kontrol sende**: Verilerini istediğin an indir, sil veya taşı — herhangi bir müzakere olmadan.
- **AB veri yerleşimi**: Tüm verilerin Avrupa Birliği'nde (Frankfurt) tutulur.
- **Uçtan uca**: Mesajlaşma altyapımız uçtan uca şifreleme yol haritasındadır (v1).
- **Anonimlik varsayılan**: Sticker'ınızı tarayan üçüncü kişiler bize kim olduklarını söylemek zorunda değildir.

---

## 2. Neyi, Ne Zaman, Neden Topluyoruz?

Aşağıdaki tablo tüm veri toplama noktalarımızı özetler. Ayrıntılı bilgi için ilgili bölüme tıklayın.

| Ne Zaman | Ne Toplanır | Neden |
|---|---|---|
| Hesap oluştururken | E-posta | Giriş yapabilmen için |
| Sipariş verirken | Ad, adres, telefon | Kargonun sana ulaşabilmesi için |
| Ödeme yaparken | Kart bilgileri (Tagora'da **saklanmaz**) | Ödemenin işlenmesi için — iyzico işler |
| Sticker'ını isimlendirirken | Verdiğin ad ("Mavi Skoda") | Sticker'ını sen tanıyabilesin diye |
| Biri sticker'ını tarayınca | Anonim mesaj + geçici cihaz izi | İletişim kurulabilmesi + spam koruması |
| Uygulamayı kullanırken | Cihaz bilgisi + IP (hash'li) | Güvenlik ve hata tespiti |
| Bültenlere abone olursan | E-posta + izin tarihi | İzin verdiğin içerikleri sana yollamak |

---

## 3. Ne Yapmıyoruz

Verilerinizle **asla** yapmayacağımız şeylerin listesi:

- ❌ Verilerinizi üçüncü taraflara **satmayız**
- ❌ Reklam ağlarıyla veri **paylaşmayız**
- ❌ İzniniz olmadan pazarlama e-postası **atmayız**
- ❌ Telefon numaranızı sticker'ı tarayan kişiye **göstermeyiz** — Tagora'nın var olma sebebi budur
- ❌ Sohbet içeriklerinizi ürün geliştirme için **okumayız** (istatistiksel analiz sadece anonim/toplu yapılır)
- ❌ Konum verinizi **istemez, toplamayız**
- ❌ Rehberinize, fotoğraflarınıza **erişmeyiz** (kamera erişimi sadece QR tarama sırasında ve o karede kullanılır)

---

## 4. Sticker Sahibi Olarak Verileriniz

Tagora'ya kayıt olduğunuzda:

### Verilerinizin Konumu
- **Nerede**: AB, Frankfurt (Supabase EU region)
- **Nasıl**: Şifreli (kolon bazlı) veritabanı, HTTPS iletişim
- **Kim erişebilir**: Sadece siz (self-service), veri güvenlik ekibi (denetim için), yetkili kamu makamı (yasal talep halinde)

### İletişim Verileriniz
- E-posta: giriş ve transactional bildirimler için
- Telefon: iki faktörlü doğrulama ve premium'da sesli arama için (opsiyonel, şifrelenmiş saklanır)

### Sticker & Kullanım Verileriniz
- Verdiğiniz isim ve kullanım türü
- Kaç kez tarandığı (istatistik)
- Kimlerle konuştuğunuz (anonim ziyaretçi kimlik/isim değil, sadece geçici oturum)
- Mesaj içerikleri **90 gün** sonra otomatik soft-delete edilir

### Ödeme Verileriniz
Kart bilgilerinizi **Tagora tutmaz**. iyzico işler, PCI-DSS uyumlu ortamda saklanır. Biz sadece işlem sonucu ("başarılı / başarısız", işlem numarası, tutar) alırız.

---

## 5. Sticker'ı Tarayan Ziyaretçi Olarak Verileriniz

Bir Tagora sticker'ının QR kodunu taradığınızda:

### Toplanan Veriler
- Verdiğiniz geçici takma ad (opsiyonel — boş bırakılabilir)
- Yazdığınız mesaj içeriği
- Cihaz parmak izi hash'i (IP + tarayıcı + ekran) — **sadece spam koruması için**

### Neyi Toplamıyoruz
- Adınızı, soyadınızı
- E-postanızı
- Telefon numaranızı
- Konumunuzu (GPS)
- Sosyal medya hesaplarınızı

### Ne Kadar Süre Tutulur
- **Cihaz parmak izi hash**: 24 saat sonra otomatik null'lanır
- **Oturum tokeni**: 7 gün sonra silinir
- **Mesaj içeriği**: Sticker sahibiyle olan konuşma boyunca, sonra 90 gün, sonra soft-delete

### Sizi Kim Görür
- Sadece o sticker'ın sahibi mesajlarınızı görür (KVKK'ya uygun kısıtlı erişim)
- Tagora çalışanları sadece rapor / abuse durumunda görür
- Yetkili kamu makamı sadece yasal talep halinde görür

Sticker'ı tarayarak Tagora'nın bir üyesi olmuş **sayılmazsınız**. Herhangi bir hesap oluşturmuş **olmaz**, otomatik pazarlama listesine **eklenmezsiniz**.

---

## 6. Çerezler ve Benzer Teknolojiler

Web sitemizde ve uygulamamızda aşağıdaki çerez tiplerini kullanırız:

### 6.1 Zorunlu Çerezler
Hizmet sunabilmemiz için mutlaka gerekenler:
- **Auth token**: Kimlik doğrulama (giriş yaptığınız hesap)
- **Session ID**: Sayfa deneyimi ve form doldurmalar
- **CSRF token**: Güvenlik

Bu çerezleri devre dışı bırakırsanız hizmet çalışmaz.

### 6.2 Fonksiyonel Çerezler
Deneyiminizi kişiselleştirir:
- Dil tercihi (TR/EN)
- Karanlık/aydınlık mod

### 6.3 Analitik Çerezler
Ürünü nasıl geliştireceğimizi anlamak için:
- **Plausible Analytics** kullanıyoruz — **çerezsiz, IP anonim**, KVKK uyumlu
- Facebook Pixel, Google Analytics gibi izleyici sistemleri **kullanmıyoruz**

Daha detaylı bilgi için [Çerez Politikası](/cookies) sayfamıza bakınız.

---

## 7. Haklarınız

KVKK m.11 ve GDPR Md.15-21 kapsamındaki haklarınız:

- ✅ **Erişim**: Verilerinizi tek tıkla JSON olarak indirin
- ✅ **Düzeltme**: Yanlış bilgileri app'ten düzeltin
- ✅ **Silme**: "Hesabımı sil" — 30 gün içinde anonimleştirme
- ✅ **Taşınabilirlik**: JSON export = başka platforma taşıyabilirsiniz
- ✅ **İşleme İtirazı**: Pazarlama izinlerini istediğiniz an geri çekin
- ✅ **Otomatik Karar İtirazı**: Sizi etkileyecek otomatik karar almıyoruz zaten

Bu hakları kullanmak için:
- **Uygulama**: Profil → KVKK & Verim
- **E-posta**: `kvkk@tagora.com.tr`

Cevap süresi: **30 gün**, ücretsiz.

---

## 8. Veri Güvenliği

Kişisel verilerinizi korumak için katmanlı güvenlik önlemleri:

- **HTTPS/TLS 1.3** iletişim şifrelemesi
- **PostgreSQL** kolon bazlı hassas veri şifreleme (`pgp_sym_encrypt`)
- **bcrypt** ile parola hash'leme
- **Row-Level Security (RLS)** — her tabloya erişimde kimlik kontrolü
- **DDoS koruması** (Cloudflare)
- **Sentry** ile hata izleme (kişisel veri filtrelenmiş)
- **AB veri yerleşimi** — Frankfurt Region (KVKK ve GDPR uyum)
- **Otomatik yedekleme** — 30 gün rezervasyon
- **Veri ihlali müdahale planı** — 72 saat KVKK bildirim

Bir güvenlik açığı bulursanız `security@tagora.com.tr` üzerinden bize bildirin. Responsible disclosure yaklaşımını takdirle karşılarız.

---

## 9. AB / GDPR Uyumluluğu

AB'de yaşıyorsanız GDPR haklarınız Türkiye KVKK haklarınızla eşdeğerdir (ve bazen daha genişletilmiştir). Aşağıdaki noktalar özellikle önemlidir:

- **Yasal dayanak**: Sözleşme ifası (Md.6(1)(b)), meşru menfaat (Md.6(1)(f)), açık rıza (Md.6(1)(a))
- **AB temsilcisi**: [Sprint 8'de EU representative atanacak (EDPO veya benzeri)]
- **Denetim otoritesi**: Kendi ülkenizin veri koruma otoritesine şikayet edebilirsiniz
- **Uluslararası aktarımlar**: Standart sözleşme maddeleri (SCC) ile korunur

---

## 10. Çocukların Gizliliği

Tagora, **13 yaş altındaki çocuklardan** bilerek veri toplamaz. 13-18 yaş arası kullanıcılar için ebeveyn/vasi izni önerilir. Çocuğunuza ait bir hesap tespit ederseniz `kvkk@tagora.com.tr` üzerinden bildirin — 7 gün içinde silinir.

Sticker'ın çocuğunuzun çantasına veya eşyasına takılıyorsa, **QR'ı tarayan kişi çocuğunuzun kimliğini görmez** — Tagora'nın anonim iletişim modelinin temel amacı bu koruma zaten sağlar.

---

## 11. Değişiklikler

Bu Politika'yı ürün özellikleri, mevzuat veya iş süreçleri değişimine göre güncelleriz. Önemli değişikliklerde:
- E-posta bildirim
- Uygulama içi bildirim
- İnceleme için 30 günlük süre

Güncel versiyon her zaman `tagora.com.tr/privacy` adresindedir.

**Versiyon geçmişi**:
- v1.0 — 2026-07-05 — İlk versiyon

---

## 12. Bize Ulaşın

Bu politika hakkında sorularınız için:

- **KVKK Sorumlusu**: `kvkk@tagora.com.tr`
- **Güvenlik konuları**: `security@tagora.com.tr`
- **Genel destek**: `destek@tagora.com.tr`
- **Web**: `https://tagora.com.tr`

---

_Tagora — Ulaşılabilir kal, anonim kal._
