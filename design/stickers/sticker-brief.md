# Tagora Sticker — Üretim Brief

## Genel

Tagora, kullanıcıların araç, kapı, evcil hayvan, bagaj ve bisiklet gibi objelerine yapıştırdığı QR sticker aracılığıyla anonim iletişim sağlayan bir platformdur. Bu doküman sticker üretimi için gerekli teknik ve tasarım spesifikasyonunu içerir.

## SKU Matrisi

| Kod | Use Case | Boyut | CTA | Dosya |
|---|---|---|---|---|
| TAG-VEHICLE-5 | Araç | 50 × 50 mm | ARAÇ SAHİBİNE YAZ → | `sticker-vehicle-5x5.svg` |
| TAG-DOOR-5 | Kapı / Ev | 50 × 50 mm | EV SAHİBİNE YAZ → | `sticker-door-5x5.svg` |
| TAG-LUGGAGE-5 | Bagaj / Valiz | 50 × 50 mm | SAHİBİNE ULAŞ → | `sticker-luggage-5x5.svg` |
| TAG-PET-3 | Evcil hayvan | 30 × 30 mm | SAHİBİNE ULAŞ → | `sticker-pet-3x3.svg` |
| TAG-BIKE-3 | Bisiklet | 30 × 30 mm | SAHİBİNE ULAŞ → | `sticker-bike-3x3.svg` |

**Toplam:** 5 farklı tasarım × 2 die-cut boyut. Her SKU için farklı miktarda basılabilir.

## Boyut ve Kesim

- **5×5 cm** (araç, kapı, bagaj)
  - Kesim: kare, köşe yarıçapı **4 mm** (rounded square)
  - Bleed: **3 mm** her kenar (toplam 56 × 56 mm baskı alanı)
  - Safe zone: dışarıdan **3 mm** içeri (metin ve QR bu zone içinde kalmalı)

- **3×3 cm** (evcil hayvan, bisiklet)
  - Kesim: kare, köşe yarıçapı **3 mm**
  - Bleed: **2 mm** her kenar (toplam 34 × 34 mm baskı alanı)
  - Safe zone: dışarıdan **2 mm** içeri

## Malzeme (İKİ VARYANT — kullanım yerine göre)

### Varyant A: Standart Outdoor Sticker (kapı, bagaj, pet tasması, bike)

- **Yüzey:** Matte outdoor vinyl, UV korumalı **5+ yıl** dış mekan
- **Kalınlık:** 80-100 mikron
- **Yapıştırıcı:** Solvent-based permanent adhesive
- **Kaplama:** İsteğe bağlı **anti-graffiti lamine**

### Varyant B: Inside Window Decal (araç camı için — kritik)

- **Kullanım:** Cam **içeriden** yapıştırılır, dış camdan okunur
- **Malzeme:** **Clear polyester (PET) film** — 100-125 mikron
- **Baskı:** **Mirror / reverse print** — tasarım ters basılır ki cam üzerinden düz okunsun
- **Yapıştırıcı:** Ön yüzde (cama temas eden taraf) — permanent veya static cling opsiyonu
- **Ömür:** **8+ yıl** (UV, yağmur, sıcak/soğuk cam korur — açık outdoor vinyl'den 2x)
- **Rulo yönlendirmesi:** Adhesive önde, ink layer arkada — matbaa spec'i bunun için kritik

**Üretici için not:** Araç sticker'ları için **reverse print / inside window** varyantı istiyoruz. Kapı/bagaj/pet/bike için **standart outdoor** yeter.

**Kesin olarak KAÇINILMASI GEREKENLER:**
- ❌ Parlak (glossy) opaque vinyl araç camında — yansıma QR taramayı zorlaştırır
- ❌ Static cling (yapışkansız) — 6 ay sonra cama tutunmuyor, kalkıyor
- ❌ Termal transfer sticker — 6 ay dayanmaz
- ❌ Perforated one-way film — bu bus reklam için, küçük QR sticker'a değil

## Renk Paleti

| Renk | HEX (RGB) | CMYK Yaklaşık | Pantone Yakın | Kullanım |
|---|---|---|---|---|
| Navy | `#0F1B3D` | C:100 M:87 Y:32 K:47 | 289 C | Ana background, QR modülleri |
| Accent | `#D4F36A` | C:20 M:0 Y:70 K:0 | 380 C (soft) | Badge, CTA, wordmark |
| Beyaz | `#FFFFFF` | C:0 M:0 Y:0 K:0 | Kağıt | QR paneli, locator squares iç kısmı |

**Kontrast oranı QR/beyaz:** ~98% (WCAG AAA), min 70%'in çok üzerinde — güneşte de sorunsuz taranır.

## QR Kod Spesifikasyonu

⚠️ **Kritik:** SVG dosyalarındaki QR pattern **PLACEHOLDER**'dır. Her sticker için **unique QR** üretilecek.

- **QR versiyonu:** Version 4 (33 × 33 modül grid)
- **Error correction level:** **H (%30)** — sticker çizilse/kirlense çalışır
- **Encode edilecek URL:** `https://tagora.link/s/<10-char-token>` (her sticker için farklı Base62 token)
- **Modül boyutu (min):** 5×5 sticker için ≥ **0.9 mm**, 3×3 sticker için ≥ **0.6 mm**
- **Quiet zone (safe boşluk):** QR etrafında minimum **4 modül** beyaz alan
- **Renk:** Modüller navy `#0F1B3D` üzerine beyaz `#FFFFFF` background

### Unique QR nasıl üretilecek?

Tagora tarafında `scripts/generate-tokens.mjs` ile üretilen batch CSV üreticiye gönderilecek. Örnek:

```
token,qr_url
HFaxME0G5r,https://tagora.link/s/HFaxME0G5r
xY7pQ2mN8L,https://tagora.link/s/xY7pQ2mN8L
...
```

Üretici bu CSV'i **variable data printing** akışında SVG template'e enjekte edecek (Illustrator variables veya Prinergy Impose gibi araçlarla).

## Tasarım Öğeleri

### 5×5 Sticker (araç, kapı, bagaj)

- **Layout:**
  - Navy card (r=4mm) full sticker background
  - Sağ üst köşe: **Accent circle (r≈4.5mm)** + emoji ikon (araç 🚗 / kapı 🚪 / bagaj 🧳)
  - Merkez: **Beyaz QR paneli** (r=2mm) — QR alanı 35×24 mm
  - Alt kısım:
    - **CTA metni** (accent renkli, extra bold, letter-spacing 1.2) — use case'e göre değişir
    - **URL fallback** `tagora.link/s/xxxxx` (beyaz, monospace)
    - **TAGORA wordmark** (accent, opacity 0.6, letter-spacing 3)

### 3×3 Sticker (pet, bike)

- **Layout:**
  - Navy card (r=3mm)
  - Sol üst köşe: sadece emoji (badge yok — yer az)
  - Merkez: **Beyaz QR paneli** (relative büyük)
  - Alt: **"SAHİBİNE ULAŞ →"** + `tagora.link` mini text

## Font

- **Font family:** `system-ui, -apple-system, sans-serif` (SVG'de belirtildi)
- Print için üretici tarafında **outline'a çevrilebilir** — Illustrator "Create Outlines" komutu ile
- Alternatif: **Inter** (Google Fonts, open source, TR karakter destekli) — safer choice

## MOQ ve Fiyat Beklentisi (RFQ hazırlığı için)

İlk parti için hedef:

| SKU | İlk Batch | Yıl 1 Toplam |
|---|---|---|
| Araç 5×5 | 2,000 adet | 10,000 adet |
| Kapı 5×5 | 500 adet | 3,000 adet |
| Bagaj 5×5 | 500 adet | 3,000 adet |
| Pet 3×3 | 1,000 adet | 5,000 adet |
| Bike 3×3 | 500 adet | 2,000 adet |
| **TOPLAM** | **4,500 adet** | **23,000 adet** |

**Fiyat hedef aralığı:** 0.80 TL — 1.50 TL / adet (üretim + baskı, KDV hariç)

## Teslimat Formatı

Üreticiden istenecek final teslimat:

1. **Kesilmiş sticker'lar** — her SKU için ayrı, roll veya sheet formatta
2. **QR taranabilirlik testi** — her batch'ten random 10 sticker, mobile QR reader ile scan edilebilir olmalı
3. **Renk uygunluğu** — Pantone bookuna göre navy ve accent tolerans içinde
4. **QC raporu** — parti başına adet, kesim hatası oranı (≤ %0.5 hedef)

## Üretici İçin Notlar

- SVG'ler `viewBox="0 0 240 240"` (5cm) veya `viewBox="0 0 180 180"` (3cm) kullanır. Print için `width="50mm"` veya `width="30mm"` attribute'u dosyalarda mevcut.
- CMYK dönüşümü üretici tarafında yapılacak (bu SVG'ler RGB'dir — web tasarımından port).
- Bleed henüz eklenmedi. **Üretici tasarımı 3mm/2mm bleed ile export etmeli.**

## İletişim

Detay ve teknik sorular için: `omer@complify.io` — Ömer Kılınç, Tagora / Complify

---

**Versiyon:** 1.0 · Temmuz 2026
**Değişecek olanlar (v2 için):** Her token için otomatik QR üretim script'i (`generate-print-batch.mjs`), CMYK export otomatik, Pantone book referans PDF ekli.
