# Tagora Sticker RFQ — Email Template

> **Kullanım:** Aşağıdaki metni her matbaacıya kişiselleştirerek gönder. `{{FIRMA_ADI}}`, `{{TARİH}}` gibi placeholder'ları doldur. Ekler ayrı bölümde listelendi.

---

## Konu (Subject)

```
Tagora QR Sticker Üretimi — Fiyat Teklifi Talebi (4,500 adet ilk parti)
```

---

## Email Metni

```
Merhaba {{FIRMA_ADI}} ekibi,

Ben Ömer Kılınç, Tagora'nın kurucusuyum. Tagora, kullanıcıların araç,
kapı, evcil hayvan, bagaj ve bisiklet gibi objelerine yapıştırdığı QR
sticker aracılığıyla anonim iletişim kurmasını sağlayan bir platformdur
(web + iOS + Android). Yakın zamanda beta lansmanına hazırlanıyoruz ve
üretici arayışı için sizinle iletişime geçtim.

İlk parti için toplam 4,500 adet vinyl sticker basımına ihtiyacımız var.
Detaylar aşağıda:

────────────────────────────────────────────────────
ÜRÜN SPESİFİKASYONU
────────────────────────────────────────────────────
• Ürün      : QR kod içeren yapışkanlı sticker
• Boyutlar  : İki farklı ölçü:
                – 50 × 50 mm (kare, köşe yarıçapı 4 mm)
                – 30 × 30 mm (kare, köşe yarıçapı 3 mm)
• Malzeme   : İKİ VARYANT (kullanım yerine göre):

              Varyant A — Standart outdoor vinyl (KAPI, BAGAJ, PET, BİKE):
                – Matte outdoor vinyl, UV korumalı 5+ yıl
                – 80-100 mikron, solvent-based permanent
                – İsteğe bağlı anti-graffiti lamine

              Varyant B — Inside window decal (SADECE ARAÇ):
                ⚠ Cam içeriden yapıştırılır, dış camdan okunur
                – Clear polyester (PET) film, 100-125 mikron
                – Baskı MIRROR / REVERSE (tasarım ters basılır)
                – Yapıştırıcı ön yüzde (cama temas eden)
                – Ömür 8+ yıl (cam UV/su korur — outdoor vinyl'den 2x)
• Renkler   : Navy (#0F1B3D) + Accent (#D4F36A) + Beyaz
                – Baskı: CMYK (dosyalar RGB, dönüşüm size ait)
• Bleed     : 5×5 için 3 mm, 3×3 için 2 mm
• Baskı     : Dijital veya offset (kalite eşit ise farksız)

────────────────────────────────────────────────────
ÖZEL DURUM: HER STICKER BENZERSİZ QR KOD İÇERİR
────────────────────────────────────────────────────
Her sticker unique bir Base62 token içerir (örn: HFaxME0G5r).
Bu, tarafımızdan CSV manifest olarak üretilir ve size teslim edilir.
Sizden variable data printing (değişken veri baskısı) ile bu tokenları
her sticker'a farklı QR olarak enjekte etmenizi rica ediyoruz.
CSV format örneği ekte mevcut.

────────────────────────────────────────────────────
İLK PARTİ SİPARİŞ MİKTARI
────────────────────────────────────────────────────
SKU              | Boyut  | Adet  | Kullanım
────────────────────────────────────────────────────
TAG-VEHICLE-5   | 5×5    | 2,000 | Araç sticker'ı
TAG-DOOR-5      | 5×5    |   500 | Ev / kapı
TAG-LUGGAGE-5   | 5×5    |   500 | Bagaj / valiz
TAG-PET-3       | 3×3    | 1,000 | Evcil hayvan tasması
TAG-BIKE-3      | 3×3    |   500 | Bisiklet gövdesi
────────────────────────────────────────────────────
TOPLAM                     4,500 adet

Yıl 1 tahmini toplam: ~23,000 adet (aylık ~2,000 adet)

────────────────────────────────────────────────────
TEKLİF FORMATI RİCASI
────────────────────────────────────────────────────
Lütfen aşağıdaki bilgileri içeren teklif hazırlayabilir misiniz:

1. Adet başı fiyat (KDV hariç, TL cinsinden)
   – 5×5 Varyant A (standart vinyl): 500 / 1000 / 2000 / 5000 kademeli
   – 5×5 Varyant B (inside window decal, mirror print): 500 / 1000 / 2000 / 5000
   – 3×3 boyut için: 500 / 1000 / 2000 / 5000 kademeli
2. MOQ (minimum sipariş adedi) — SKU başına
3. Anti-graffiti lamine ek maliyeti (opsiyonel)
4. Variable data printing (unique QR) ek maliyeti — varsa
5. Teslimat süresi (siparişten sonra kaç iş günü)
6. Ödeme koşulları (kapora %, avans, sipariş sonrası vade)
7. Numune örneği alabilir miyiz?
   – Standart 2 adet + Inside window decal 2 adet (araç için kritik test)
8. Firmanızın QC prosedürü nasıl işliyor? Kesim/renk toleransları?
9. Inside window decal deneyiminiz var mı? Referans göstermek gerekirse
   hangi projeleri örnek verebilirsiniz?

────────────────────────────────────────────────────
EKLER (bu email'e attach edilecek)
────────────────────────────────────────────────────
1. sticker-brief.md      — Detaylı teknik spesifikasyon
2. sticker-vehicle-5x5.svg  \
   sticker-door-5x5.svg     |
   sticker-luggage-5x5.svg  | 5 use case tasarım örnekleri
   sticker-pet-3x3.svg      |
   sticker-bike-3x3.svg    /
3. numune-manifest.csv   — Variable data printing için örnek CSV format

────────────────────────────────────────────────────
TARAFIMIZDAN BEKLENEN
────────────────────────────────────────────────────
• Baskı öncesi test numunesi (2-3 adet) — QR taranabilirlik doğrulaması
• Anlaşma sonrası: her batch'ten random 10 sticker QR test edilir
• Renk uygunluğu (Pantone 289 C yakını Navy)
• Kesim toleransı ≤ %0.5 (5×5 için ±0.3mm)
• Teslimat: 4,500 sticker'ın SKU'ya göre ayrılmış paketlenmiş şekilde

────────────────────────────────────────────────────
İLETİŞİM
────────────────────────────────────────────────────
Ömer Kılınç
Tagora — Kurucusu
E-posta: omer@complify.io
Telefon: +90 5xx xxx xxxx (SMS/WhatsApp da açık)
Web    : https://tagora.com.tr

Sorularınız için her zaman ulaşabilirsiniz. Ayrıntılı bir teklif için
1-2 hafta bekleyebilir, aciliyet durumunda önceliklendirebilirim.

Teklifinizi bekliyor, iş birliği için sabırsızlanıyorum.

Saygılarımla,
Ömer Kılınç
Tagora
```

---

## Kişiselleştirme İpuçları

Her firmayı biraz araştır, email'e küçük dokunuşlar ekle:

- **Firma web sitesinden bir referans**: "Sitenizde gördüğüm outdoor uygulamaları için portföyünüzü inceledim, özellikle X projeniz ilgimi çekti."
- **Yakın konum vurgusu**: "İstanbul içinde numune teslim ile ilgili esneklik varsa memnun olurum."
- **Response time expectation**: "Teklif için 1 hafta içinde geri dönüş yaparsanız çok memnun olurum, ancak detaylı analiz için 2 haftaya kadar süreyi anlayışla karşılarım."

## Follow-up Stratejisi

- **T+3 gün**: kısa "email ulaştı mı?" hatırlatma
- **T+7 gün**: "gerekli bilgiler eksikse iletebiliriz" hatırlatma
- **T+14 gün**: son takip, sonra firmayı listeden çıkar

## Karar Kriterleri (Firma değerlendirme)

Teklifler geldiğinde bunlara bak:

| Kriter | Ağırlık | Notlar |
|---|---|---|
| Adet başı fiyat | 30% | 500-5000 arası kademe kritik |
| Variable data printing yeteneği | 25% | Unique QR olmadan olmaz |
| Teslimat süresi | 15% | ≤ 15 iş günü hedef |
| Numune kalitesi | 15% | Fiziksel test şart |
| MOQ esnekliği | 10% | 500 altı da alabilir mi? |
| Ödeme koşulları | 5% | %30-50 avans OK, %100 avans risk |
