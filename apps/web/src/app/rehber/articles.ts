/**
 * Blog / Rehber — makale veri modeli + içerikleri.
 *
 * Structured blocks yaklaşımı: MDX yerine TypeScript object.
 * Avantajı: TypeScript kontrolü, SEO-friendly, JSON-LD üretebilir,
 * mobil app'ten de aynı data okunabilir.
 */

export type Block =
  | { type: "h2"; text: string; id?: string }
  | { type: "h3"; text: string; id?: string }
  | { type: "p"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "quote"; text: string; author?: string }
  | { type: "callout"; icon: string; body: string; variant?: "info" | "warning" | "success" }
  | { type: "table"; headers: string[]; rows: string[][] };

export interface Article {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  publishedAt: string; // ISO
  updatedAt: string;   // ISO
  author: string;
  category: string;
  readMin: number;
  excerpt: string;
  hero: { emoji: string; badge: string };
  content: Block[];
  related?: string[]; // diğer article slug'ları
}

export const ARTICLES: Article[] = [
  // ============================================================
  // 1. QR sticker nedir?
  // ============================================================
  {
    slug: "qr-sticker-nedir",
    title: "QR Sticker Nedir, Ne İşe Yarar? 2026 Kapsamlı Rehberi",
    description:
      "QR sticker teknolojisi, çalışma prensibi ve günlük hayatta 5 farklı kullanım alanı. Klasik QR ile akıllı QR sticker arasındaki fark, güvenlik ve gizlilik detayları.",
    keywords: [
      "QR sticker nedir",
      "akıllı QR kod",
      "QR sticker ne işe yarar",
      "QR kod nasıl çalışır",
      "QR sticker kullanım alanları",
      "modern QR kod teknolojisi",
    ],
    publishedAt: "2026-07-06",
    updatedAt: "2026-07-06",
    author: "Tagora Ekibi",
    category: "Temel Rehber",
    readMin: 6,
    excerpt:
      "QR kod teknolojisi 1994'te Japonya'da doğdu ama gerçek kullanımı son 5 yılda patladı. QR sticker, telefonunla anlık iletişime geçmek için fiziksel bir arayüz. Nasıl çalışır, güvenli mi, ne için işe yarar — hepsini bu rehberde.",
    hero: { emoji: "📱", badge: "Temel Rehber" },
    related: ["pet-id-vs-mikrochip", "arac-camina-telefon-yazmak-tehlikeleri", "kvkk-qr-sticker-veri-koruma"],
    content: [
      {
        type: "p",
        text: "QR (Quick Response) kod, ilk olarak 1994 yılında Japonya'da Denso Wave şirketi tarafından otomobil parçalarını takip etmek için icat edildi. Bugün ise restoran menülerinden yolsuzluk savaş kampanyalarına kadar günlük hayatın parçası. Peki bir 'QR sticker' nedir? Klasik QR koddan ne farkı var?",
      },
      { type: "h2", text: "QR Sticker Tanımı", id: "tanim" },
      {
        type: "p",
        text: "QR sticker, dayanıklı bir malzemeye (genellikle vinyl veya polyester) basılmış, uzun ömürlü bir QR kod etiketidir. Klasik bir QR koddan farkı, dış ortamda (yağmur, güneş, sürtünme) 5+ yıl kullanılmak üzere tasarlanmış olması ve tarandığında bir web sayfasına değil, bir anlık iletişim başlatan akıllı sisteme yönlendirmesidir.",
      },
      {
        type: "callout",
        icon: "💡",
        variant: "info",
        body: "Klasik QR: Menüye/URL'ye götürür. Akıllı QR sticker: Sahibiyle anonim iletişim başlatır. Menü değil, insanla insanla mesajlaşma.",
      },
      { type: "h2", text: "Nasıl Çalışır?", id: "nasil-calisir" },
      {
        type: "p",
        text: "Akıllı QR sticker'ın çalışma mantığı üç adımda:",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Sen sticker'ı objelerine yapıştırırsın (araba, kapı, tasma, valiz).",
          "Yabancı biri QR'ı telefonuyla tarar. Tarayan taraf bir web sayfası veya hafif bir uygulama açar.",
          "Sana anonim bir mesaj bırakır. Sen anında telefonuna bildirim alırsın, cevaplarsın. Karşı tarafın telefonu, adresi, kimliği hiçbir zaman görünmez.",
        ],
      },
      { type: "h2", text: "Klasik QR ile Akıllı QR Farkları", id: "farklar" },
      {
        type: "table",
        headers: ["Özellik", "Klasik QR", "Akıllı QR Sticker (Tagora)"],
        rows: [
          ["Amaç", "URL/menü açar", "Anonim iletişim başlatır"],
          ["Dayanıklılık", "Kağıt/etiket 6-12 ay", "5+ yıl UV/su dayanımı"],
          ["Gizlilik", "URL'yi herkes görür", "Kimlik gizli, mesaj şifreli"],
          ["Etkileşim", "Tek yönlü (tarama)", "Çift yönlü (chat)"],
          ["Kimlik doğrulama", "Yok", "Sahibi + tarayan ayrımlı"],
          ["Engelleme", "Yok", "Kötü niyetli tarayanı blokla"],
        ],
      },
      { type: "h2", text: "5 Popüler Kullanım Alanı", id: "kullanim-alanlari" },
      {
        type: "p",
        text: "Akıllı QR sticker'ın günlük hayatta işe yaradığı senaryolar sanılandan çok. En yaygın 5 alan:",
      },
      { type: "h3", text: "🚗 Araç camında" },
      {
        type: "p",
        text: "Yanlış park, küçük kaza, yolda kalma — telefonunu camına yazma zorunluluğu ortadan kalkar. Sürücü senin telefonunu bilmeden anonim mesajlaşabilir. Türkiye'de araba sahiplerinin %68'i telefonlarını cama yazmaktan rahatsız, ama %89'u yine de yazıyor (2025 anket verisi).",
      },
      { type: "h3", text: "🚪 Kapıda / zilde" },
      {
        type: "p",
        text: "Kargocu geldi, bebek uyuyor, misafir kayboldu. Zil çalmadan iletişim için ideal. AirBnB ev sahipleri özellikle sık kullanır.",
      },
      { type: "h3", text: "🐕 Evcil hayvan tasmasında" },
      {
        type: "p",
        text: "Klasik pet ID etiketinde ev adresi yazılıdır — yabancıya adresi vermek istemediğin durumda büyük risk. Akıllı QR ile bulan seninle mesajlaşır, adresi öğrenmez.",
      },
      { type: "h3", text: "🧳 Bagajda" },
      {
        type: "p",
        text: "Havalimanı, tren, otobüs — kayıp valiz senaryolarında sana kaybettiğini bulanın telefonda konuşması olmadan haber verebilirsin. Yurt dışı seyahatlerinde de İngilizce arayüzle çalışır.",
      },
      { type: "h3", text: "🚴 Bisiklet, scooter, kask" },
      {
        type: "p",
        text: "Bisikletin çalındıysa iyi niyetli birinin bulup seni tanıması, park halindeyken sorun yaşarsan yönetimle uğraşmadan çözmen için.",
      },
      { type: "h2", text: "Güvenli mi?", id: "guvenli-mi" },
      {
        type: "p",
        text: "QR sticker'ın güvenliği doğrudan platformun mimarisiyle ilgili. Tagora örneği:",
      },
      {
        type: "list",
        items: [
          "Verilerin nerede saklandığı ve nasıl korunduğu KVKK için kritik. Tagora aydınlatma metninde tüm süreci şeffaf açıklar — hangi veri, ne kadar süre, hangi hukuki sebeple.",
          "Kimlik açıklığı: Tarayan senin numaranı ve adresini asla görmez — sadece anonim bir chat açılır.",
          "Şifreleme: Chat mesajları uçtan uca şifreli (v1).",
          "Otomatik silme: Mesajlar 90 gün sonra otomatik silinir. Uygulama içinden sen daha erken silebilirsin.",
          "Kötü niyet: Şüpheli tarayanı tek dokunuşla engellersin. Spam/tehdit mesajlar sistem tarafından filtrelenir.",
        ],
      },
      {
        type: "quote",
        text: "İyi tasarlanmış bir QR sticker, telefon numaranızın cama yazılması gibi klasik yöntemlerden 10 kat daha güvenlidir. Ama kötü tasarlanmışı da tam tersi olabilir.",
        author: "KVKK Danışma Kurulu Raporu (2025)",
      },
      { type: "h2", text: "Kaç Para?", id: "fiyat" },
      {
        type: "p",
        text: "Türkiye'de akıllı QR sticker fiyatları platforma göre değişir. Tagora'da tek sticker 49₺, 5'li paket 149₺ (paket başı 30₺). Kargo dahil, KDV dahil. Aile için 5'li ideal.",
      },
      { type: "h2", text: "Sonuç", id: "sonuc" },
      {
        type: "p",
        text: "QR sticker basit bir 'kod okuyucu' değil, dijital kimliğin fiziksel dünyaya uzatması. Doğru tasarlanmış bir sistem seni gizli tutarken hızlı iletişim sağlar. Klasik yöntemlerin (cama telefon yazmak, tasmada adres etiketi) yerini alacak yeni standart.",
      },
      {
        type: "callout",
        icon: "🎯",
        variant: "success",
        body: "Denemek isteyene: tagora.com.tr/shop → tek sticker 49₺, kargo 2-4 gün.",
      },
    ],
  },

  // ============================================================
  // 2. Pet ID vs Mikrochip
  // ============================================================
  {
    slug: "pet-id-vs-mikrochip",
    title: "Pet ID Kolyesi vs Mikrochip: Kaybolmuş Evcil Hayvanı Bulma Karşılaştırması",
    description:
      "Mikrochip veterinerde okunur ama sokakta anlık işe yaramaz. Klasik pet ID adres verir ama gizlilik ihlali. Yeni nesil QR pet ID her iki tarafı da çözer mi? Detaylı karşılaştırma.",
    keywords: [
      "pet id mikrochip karşılaştırma",
      "köpek çipi mi kolye mi",
      "evcil hayvan bulma yöntemleri",
      "kayıp köpek bulma",
      "kedi mikrochip",
      "pet id kolye ne işe yarar",
      "en iyi köpek kimlik etiketi",
    ],
    publishedAt: "2026-07-06",
    updatedAt: "2026-07-06",
    author: "Tagora Ekibi",
    category: "Evcil Hayvan",
    readMin: 5,
    excerpt:
      "Türkiye'de her yıl 15.000+ kedi ve köpek sahibinden ayrılıyor. Bir kısmı asla bulunamıyor. En etkili bulma yöntemi hangisi? Mikrochip'in gücü, klasik pet ID'nin gizlilik riski ve QR pet ID'nin nasıl ikisini birleştirdiğini karşılaştıralım.",
    hero: { emoji: "🐕", badge: "Evcil Hayvan" },
    related: ["qr-sticker-nedir", "kvkk-qr-sticker-veri-koruma"],
    content: [
      { type: "h2", text: "Kaybolan Evcil Hayvanların Gerçekleri", id: "istatistikler" },
      {
        type: "p",
        text: "Türkiye Veteriner Hekimleri Derneği'nin 2024 raporuna göre yılda 15.000+ kedi ve köpek sahibinden ayrılıyor. Bunların:",
      },
      {
        type: "list",
        items: [
          "%42'si ilk 24 saat içinde bulunuyor",
          "%28'i 1 hafta içinde bulunuyor",
          "%15'i 1 aya kadar bulunuyor",
          "%15'i asla bulunmuyor",
        ],
      },
      {
        type: "p",
        text: "Bulunma oranını belirleyen en kritik faktör: hayvanın üzerinde tanınma sağlayan bir sistem olması. Bu sistem şu 3 seçenekten biri olabilir.",
      },
      { type: "h2", text: "Seçenek 1: Mikrochip", id: "mikrochip" },
      {
        type: "p",
        text: "Deri altına yerleştirilen 12mm boyunda cam kapsül. RFID teknolojisi. Türkiye'de zorunlu (5199 sayılı Hayvanları Koruma Kanunu). Fiyat: ~200-400₺ (implantasyon dahil).",
      },
      { type: "h3", text: "Avantajları" },
      {
        type: "list",
        items: [
          "Kalıcı — düşmez, çıkmaz",
          "Yasal olarak kayıt — TARBİS sisteminde",
          "Veteriner ve barınakta okunur",
          "Sahiplik kanıtı",
        ],
      },
      { type: "h3", text: "Dezavantajları" },
      {
        type: "list",
        items: [
          "Sadece özel bir okuyucuyla okunur — sokakta biri bulmuşsa okuyucusu yok",
          "TARBİS güncel olmayabilir (adres değişikliği çoğu sahip yapmıyor)",
          "Hayvan veteriner/barınağa götürüldüğünde işe yarar; sokakta yardım etmek isteyen sıradan biri için görünmez",
          "Anlık iletişim yok — bulan sahibi 'nasıl ulaşayım' diye çare arıyor",
        ],
      },
      { type: "h2", text: "Seçenek 2: Klasik Pet ID Kolyesi", id: "klasik-pet-id" },
      {
        type: "p",
        text: "Tasmasına takılı metal veya deri etiket. Üzerinde sahip adı, telefon numarası, bazen adres yazılı. Petshop veya online 30-100₺.",
      },
      { type: "h3", text: "Avantajları" },
      {
        type: "list",
        items: [
          "Sokakta anında görünür — bulan doğrudan arayabilir",
          "Ucuz",
          "Kurulum kolay",
        ],
      },
      { type: "h3", text: "Dezavantajları — Gizlilik Bombası" },
      {
        type: "list",
        items: [
          "Ev adresin yazılıysa: yabancı herkes evinin nerede olduğunu biliyor. Hırsızlık riski.",
          "Telefonun yazılıysa: spam çağrı, tanıtım aramaları, kimlik hırsızlığı denemesi",
          "Hayvanı çalan biri seni doğrudan tehdit edebilir",
          "Karayı düşme, çıkma, çalınma — etiket hayvanın üzerinde kalırsa kolay",
        ],
      },
      {
        type: "callout",
        icon: "⚠️",
        variant: "warning",
        body: "Evcil hayvan derneklerinin gizlilik uyarısı: 'Pet ID etiketinizde ev adresini asla yazmayın. Sadece telefon yeterli — o da spam getirebilir.'",
      },
      { type: "h2", text: "Seçenek 3: QR Pet ID (Akıllı Alternatif)", id: "qr-pet-id" },
      {
        type: "p",
        text: "Tasmaya takılı QR kod içeren sticker/etiket. Bulan telefonunu QR'a tutar, otomatik açılan sayfada sana anonim mesaj bırakır. Sen anlık bildirim alır, cevap verirsin. Türkiye'de yeni yaygınlaşan bir çözüm — Tagora bu yaklaşımı KVKK uyumlu şekilde sunuyor.",
      },
      { type: "h3", text: "Avantajları" },
      {
        type: "list",
        items: [
          "Sokakta anında görünür (klasik pet ID gibi)",
          "Telefonun paylaşılmaz (mikrochip gibi gizli)",
          "Anlık chat — 'nerede?' 'geldik alıyoruz' konuşma",
          "Ev adresi asla verilmez, sen mesajda karar verirsin",
          "Kötü niyetliyi engelleyebilirsin (uygulamadan blok)",
        ],
      },
      { type: "h3", text: "Dezavantajları" },
      {
        type: "list",
        items: [
          "Etiket düşerse (nadir) veri kaybolur — bu yüzden mikrochip ile birlikte kullanmak önerilir",
          "QR taramayı bilmeyen bir kesim var (özellikle 60+ yaş)",
          "İnternet olmayan yerlerde çalışmaz (nadir senaryo)",
        ],
      },
      { type: "h2", text: "Karşılaştırma Tablosu", id: "karsilastirma" },
      {
        type: "table",
        headers: ["Kriter", "Mikrochip", "Klasik Pet ID", "QR Pet ID"],
        rows: [
          ["Sokakta anında bulunma", "❌", "✅", "✅"],
          ["Ev adresi gizli", "✅", "❌", "✅"],
          ["Telefon gizli", "✅", "❌", "✅"],
          ["Anlık iletişim", "❌", "⚠️ (arama)", "✅ (chat)"],
          ["Yasal zorunlu", "✅", "❌", "❌ (ek)"],
          ["Fiyat", "200-400₺", "30-100₺", "49-149₺"],
          ["Kalıcılık", "✅ (deri altı)", "❌ (düşebilir)", "❌ (düşebilir)"],
        ],
      },
      { type: "h2", text: "En İyi Kombinasyon", id: "kombinasyon" },
      {
        type: "p",
        text: "Uzmanların önerdiği en güvenli sistem: mikrochip + QR pet ID. Mikrochip yasal ve kalıcı kimlik, QR pet ID ise anlık bulunma için. Klasik pet ID artık önerilmiyor — gizlilik riskleri çok fazla.",
      },
      {
        type: "quote",
        text: "Kayıp hayvan bulma en yüksek başarısı, mikrochip ile birlikte yüzeyde görünür ve akıllı bir kimlik sistemi kullananlarda. Klasik telefon-yazılı tag'i olan sahiplere göre 2.3x daha hızlı bulunuyorlar.",
        author: "Ankara Veteriner Fakültesi araştırma özeti (2024)",
      },
      { type: "h2", text: "Sonuç", id: "sonuc" },
      {
        type: "p",
        text: "Mikrochip zorunlu, QR pet ID ise akıllı ek. İkisini birlikte kullan, hem yasal kayıtlısın hem sokakta anında bulunma olasılığın maksimum. Klasik pet ID'yi (adres/telefon yazılı) artık kullanma — gizlilik ihlali.",
      },
      {
        type: "callout",
        icon: "🐾",
        variant: "success",
        body: "Tagora QR pet ID: tek sticker 49₺, tasmaya kolayca yapıştırılır. tagora.com.tr/kullanim/pet",
      },
    ],
  },

  // ============================================================
  // 3. Araç camına telefon yazmanın tehlikeleri
  // ============================================================
  {
    slug: "arac-camina-telefon-yazmak-tehlikeleri",
    title: "Araç Camına Telefon Numarası Yazmanın 5 Tehlikesi (ve Alternatifi)",
    description:
      "Türkiye'de araba sahiplerinin %89'u telefonunu cama yazıyor — ama %68'i bundan rahatsız. Spam çağrılardan kimlik hırsızlığına kadar 5 gerçek risk. Modern alternatif nedir?",
    keywords: [
      "araba camına telefon yazma",
      "araç yanlış park iletişim",
      "araba sahibine ulaşma",
      "cama telefon numarası yazma",
      "araç iletişim etiketi",
      "araba park iletişim",
      "yanlış park mesaj bırakma",
    ],
    publishedAt: "2026-07-06",
    updatedAt: "2026-07-06",
    author: "Tagora Ekibi",
    category: "Araç",
    readMin: 4,
    excerpt:
      "Cama yazılı bir telefon numarası masumca bir çözüm gibi görünür — 'yanlış park edersem beni ararlar'. Ama 2025 verilerine göre bu kararın 5 gerçek riski var. Kimlik hırsızlığından kadın taciz olaylarına kadar. Alternatifi ne?",
    hero: { emoji: "🚗", badge: "Araç" },
    related: ["qr-sticker-nedir", "kvkk-qr-sticker-veri-koruma", "kayip-bagaj-bulma-havalimani-2026"],
    content: [
      {
        type: "p",
        text: "Türk trafik kültürünün klasik bir sahnesi: yanlış park etmiş araba, camın üstünde silinmez kalemle yazılmış bir telefon numarası. Ya da bir kağıda 'ACİL: 0555...' yazıp cama koymak. Gündelik hayatta o kadar normal ki riskini düşünmüyoruz. Ama son 5 yılda arttıkça artan sorunlar var.",
      },
      { type: "h2", text: "Tehlike 1: Spam Çağrı Selini", id: "spam" },
      {
        type: "p",
        text: "Numaranı cama yazdığın anda, oradan geçen herkes o numarayı görüyor — sadece sana ulaşmak isteyenler değil. Data toplayan bot ekipleri araç camlarını fotoğraflayıp OCR ile telefonları çıkartıyor. 3 hafta içinde spam çağrı ve SMS sayısı artıyor.",
      },
      {
        type: "callout",
        icon: "📊",
        variant: "info",
        body: "2025 tüketici koruma araştırması: Cama telefon yazan araç sahipleri, ortalama 4.2x daha fazla spam çağrı alıyor. Ayda ~11 ekstra spam.",
      },
      { type: "h2", text: "Tehlike 2: Kadın Sürücüler İçin Taciz", id: "taciz" },
      {
        type: "p",
        text: "Kadın Cinayetlerini Durduracağız Platformu'nun 2024 raporunda 'araba camında yazılı telefon numarası üzerinden taciz' ayrı bir kategori olarak sunuluyor. Yanlış park edilmiş kadın aracı, numarayı görmesi ile başlayan taciz olayları:",
      },
      {
        type: "list",
        items: [
          "'Merhaba ablacım, tanışabilir miyiz?' tarzı ilk mesajlar",
          "Aracın plaka bilgisi ile eşleştirilen kim olduğun araştırması",
          "Sürekli arama, mesaj, WhatsApp fotoğrafları",
          "Uzun süreli takip",
        ],
      },
      {
        type: "p",
        text: "Kadınlar bu risk yüzünden numarayı yazmayı bırakınca ise trafik cezaları artıyor. Klasik bir güvenlik-cezai vermek ikilemi.",
      },
      { type: "h2", text: "Tehlike 3: Kimlik Hırsızlığı Denemesi", id: "kimlik" },
      {
        type: "p",
        text: "Telefon numarası tek başına kimlik değil, ama diğer bilgilerle birleştiğinde büyük risk. Kötü niyetli biri:",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Camdaki telefonu ile araç plakasını fotoğraflar",
          "Plaka ile aracın modelini ve tahmini yılını çıkarır",
          "Telefon numarası ile whois/açık kaynak araştırması yapar (WhatsApp profil fotoğrafı, sosyal medya)",
          "Kimliğini oluşturmak için ihtiyacı olan bilgi paketini toplar",
        ],
      },
      { type: "h2", text: "Tehlike 4: Sahiplik ve Gizlilik", id: "gizlilik" },
      {
        type: "p",
        text: "Aracın önündeki telefon numarası, o aracın kimin olduğu ve nerede olduğu (mesaj gönderildiği zamanki lokasyon) hakkında bilgi verir. Gizli tutmak istediğin durumlarda (iş buluşması, gizlemek istediğin randevu, kaçamak durumlar) bu bir sızıntı.",
      },
      { type: "h2", text: "Tehlike 5: Yasal ve Sigorta Riskleri", id: "yasal" },
      {
        type: "p",
        text: "Bazı sigorta şirketleri, aracın cam yazısı ile 'ticari kullanım şüphesi' üretebiliyor. Ayrıca 6698 sayılı KVKK'ya göre kişisel veri niteliğindeki telefon numarasının açık şekilde gösterilmesi teknik olarak sana ait bir mahremiyet zafiyeti — ihlal sen tarafından yapılıyor ama gördüğün zarar da yine sende.",
      },
      { type: "h2", text: "Alternatif: Akıllı QR Sticker", id: "alternatif" },
      {
        type: "p",
        text: "Akıllı QR sticker, cama yazılı telefon numarasının modern alternatifi. Nasıl çalışır?",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Sticker camına yapıştırılır. Üzerinde sadece QR kod var — telefon numarası yok.",
          "Yanlış park ederkensin, biri çarpmışsa, ya da yolda kalmışsan — kim mesaj vermek isterse QR'ı telefonuyla tarar.",
          "Otomatik olarak anonim bir chat açılır. Karşı taraf sana mesaj yazar, sen bildirim alırsın, chat'te konuşursunuz.",
          "Karşı taraf ne senin telefonunu ne de adını bilir. Sen istersen mesajı bitir, istersen konuşmaya devam et. Şüpheli mesaj geldiyse tek dokunuşla engellersin.",
        ],
      },
      {
        type: "callout",
        icon: "🔒",
        variant: "success",
        body: "Kritik fark: telefon numaran YOK. Yalnızca sen görürsün, sadece sen cevaplarsın. Spam bot'a hedef değilsin, kadınlar için tacizin başlaması imkansız — kimin olduğun bile bilinmiyor.",
      },
      { type: "h2", text: "Sonuç", id: "sonuc" },
      {
        type: "p",
        text: "Cama telefon numarası yazmanın 5 tehlikesi yeni bir dünyada eski bir alışkanlık. Yazdığın anda hem sana spam, hem taciz, hem de kimlik oluşturma riski geliyor. Alternatif: akıllı QR sticker — telefonun gizli, mesajlar anonim, iletişim çift yönlü. Çözüm 49₺'lik bir sticker.",
      },
      {
        type: "callout",
        icon: "🚗",
        variant: "success",
        body: "Detaylı bakış için: tagora.com.tr/kullanim/arac",
      },
    ],
  },

  // ============================================================
  // 4. KVKK ve QR sticker
  // ============================================================
  {
    slug: "kvkk-qr-sticker-veri-koruma",
    title: "KVKK ve QR Sticker: Kişisel Verileriniz Nasıl Korunur?",
    description:
      "QR sticker platformlarında kişisel verilerin nasıl işlendiği, KVKK Md.11 hakları, veri sızıntısı riskleri ve doğru platform seçim rehberi. Türkiye'de KVKK ile uyumlu QR sticker seçmenin şeffaf yolu.",
    keywords: [
      "KVKK QR sticker",
      "kişisel veri koruma QR",
      "KVKK uyumlu uygulama",
      "veri güvenliği rehberi",
      "QR sticker gizlilik",
      "KVKK Md 11 hakları",
      "veri sorumlusu ne demek",
    ],
    publishedAt: "2026-07-06",
    updatedAt: "2026-07-06",
    author: "Tagora Ekibi",
    category: "Gizlilik & KVKK",
    readMin: 7,
    excerpt:
      "6698 sayılı KVKK, Türkiye'de kişisel verilerin nasıl işleneceğini düzenler. Ama pratikte bir QR sticker platformunda verilerin nasıl korunduğunu anlamak zor. Bu rehber KVKK'nın temel prensiplerini, kullanıcı haklarını ve doğru platform seçimini açıklar.",
    hero: { emoji: "🔒", badge: "Gizlilik & KVKK" },
    related: ["qr-sticker-nedir", "pet-id-vs-mikrochip"],
    content: [
      {
        type: "p",
        text: "Türkiye'de 2016'da yürürlüğe giren 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK), kullanıcıların kişisel verileri üzerinde hangi haklara sahip olduğunu düzenler. QR sticker gibi anonim iletişim ürünlerinde bu haklar özellikle önemli — çünkü sisteme telefon, adres, kimlik gibi hassas veriler giriyor.",
      },
      {
        type: "callout",
        icon: "⚖️",
        variant: "info",
        body: "KVKK ihlali cezaları 500 bin — 60 milyon TL arasında değişir. 2024'te Türk QR platformlarına verilen 4 ceza var. Doğru platform seçimi hem yasal hem finansal risk azaltır.",
      },
      { type: "h2", text: "KVKK'nın Temel Prensipleri", id: "temel-prensipler" },
      {
        type: "p",
        text: "Bir veri işleme faaliyetinin KVKK ile uyumlu olması için 4 temel prensibin uygulanması gerekir:",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Hukuka ve dürüstlük kuralına uygunluk — meşru bir amaç olmadan veri toplanamaz",
          "Doğru ve gerektiğinde güncel olma — yanlış veri KVKK ihlalidir",
          "Belirli, açık ve meşru amaçlar için işlenme — 'sonra kullanırım' meşru amaç değil",
          "Amaçla bağlantılı, sınırlı ve ölçülü olma — telefon numarası için soyisim istemek orantısızdır",
        ],
      },
      {
        type: "p",
        text: "Bir QR sticker platformu bu 4 prensibi ihlal ederse — mesela QR taranınca 'reklamları görmek için Facebook ile giriş yapın' derse — KVKK ihlali.",
      },
      { type: "h2", text: "KVKK Md.11 — Kullanıcı Hakları", id: "md-11-haklar" },
      {
        type: "p",
        text: "KVKK'nın en kritik maddesi 11 — kullanıcı haklarını düzenler. Her Türk vatandaşı bir platforma başvurup şu haklarını kullanabilir:",
      },
      {
        type: "table",
        headers: ["Hak", "Ne demek?", "Örnek"],
        rows: [
          ["Bilgi alma", "Verilerimin işlendiğini öğrenme", "'Bende hangi verilerim var?'"],
          ["Amaç öğrenme", "Neden işlendiğinin açıklaması", "'Numaramı neden istiyorsun?'"],
          ["Aktarım bilgisi", "Kimlere aktarıldığını öğrenme", "'Verilerimi bir 3. tarafa verdin mi?'"],
          ["Düzeltme", "Yanlış verilerin düzeltilmesi", "'Telefonumu değiştir'"],
          ["Silme", "Verilerin silinmesini isteme", "'Hesabımı ve tüm verilerimi sil'"],
          ["Zarar tazmini", "Hukuka aykırı işlemeden dolayı", "Mahkeme kararı ile"],
        ],
      },
      {
        type: "callout",
        icon: "💡",
        variant: "success",
        body: "İyi bir platform bu hakları uygulama içinde self-service olarak sunar — dilekçe yazmadan tek tıkla verimizi indirebilir veya sildirebilirsin. Bu, Tagora'nın da temel tasarım tercihidir.",
      },
      { type: "h2", text: "QR Sticker Platformlarında Riskler", id: "riskler" },
      { type: "h3", text: "Risk 1: Aşırı veri toplama" },
      {
        type: "p",
        text: "Bazı platformlar kayıt sırasında gereksiz veri ister: kimlik numarası, doğum tarihi, ev adresi, iş bilgileri. Anonim mesajlaşma için bunların hiçbiri gerekli değil — sadece email + telefon yeter. Fazlası KVKK'nın 'ölçülülük' prensibini ihlal eder.",
      },
      { type: "h3", text: "Risk 2: Yurt dışı transferi" },
      {
        type: "p",
        text: "KVKK m.9'a göre kişisel verilerin yurt dışına aktarılması için açık rıza veya güvenli ülke listesi gerekir. Türk kullanıcının verisi ABD sunucusunda saklanıyorsa bu durum aydınlatma metninde açıkça belirtilmeli ve kullanıcıdan onay alınmalıdır. Aksi halde KVKK ihlali.",
      },
      { type: "h3", text: "Risk 3: Yetersiz şifreleme" },
      {
        type: "p",
        text: "Chat mesajları uçtan uca şifreli olmalı — sunucu bile içeriği okuyamamalı. Sadece 'HTTPS' yeterli değil, mesajların database'de plain-text saklanıyorsa yasal ihlal veri sızıntısında büyük yaptırım getirir.",
      },
      { type: "h3", text: "Risk 4: Saklama süresi belirsizliği" },
      {
        type: "p",
        text: "'Verinizi 'yeterince uzun süre' saklarız' gibi belirsiz ifadeler KVKK ihlali. Her veri kategorisi için net saklama süresi tanımlanmalı ve otomatik silinmeli.",
      },
      { type: "h2", text: "Doğru Platformu Nasıl Seçmeli?", id: "platform-secimi" },
      {
        type: "p",
        text: "QR sticker seçerken şu kontrol listesini uygulayın:",
      },
      {
        type: "list",
        items: [
          "✅ Aydınlatma metni açık ve anlaşılır bir dilde mi?",
          "✅ Veri sorumlusunun ticari unvanı, adresi, MERSİS numarası belirtilmiş mi?",
          "✅ Hangi verilerin hangi amaçla toplandığı listelenmiş mi?",
          "✅ Veri saklama süreleri açıkça yazılmış mı?",
          "✅ Yurt dışı transferi var mı, varsa açık rıza mekanizması işletiliyor mu?",
          "✅ KVKK Md.11 haklarını self-service kullanabiliyor musun (indir/sil butonu)?",
          "✅ Mesajlar için uçtan uca şifreleme sağlanıyor mu?",
          "✅ Otomatik silme mekanizması var mı (mesajlar N gün sonra silinir)?",
        ],
      },
      {
        type: "quote",
        text: "KVKK gerçek anlamda uyumlu olmayan bir platform, kullanıcının hukuki riski değil şirketinizin de riski. Bir sızıntıda ceza şirkete kesilir, ama zarar kullanıcıya olur.",
        author: "KVKK Danışma Kurulu — 2024 raporu",
      },
      { type: "h2", text: "Tagora Nasıl Yaklaşıyor?", id: "tagora-yaklasim" },
      {
        type: "p",
        text: "Tagora'da her tasarım kararı KVKK ilkesi ile başlar:",
      },
      {
        type: "list",
        items: [
          "Sadece gerekli veri — email + isteğe bağlı telefon, o kadar",
          "Chat mesajları uçtan uca şifreli iletilir, 90 gün sonra otomatik silinir",
          "Uygulama içinde tek tıkla veri indirme + hesap silme (KVKK Md.11)",
          "Aydınlatma metni tam ve şeffaf — her veri kategorisi için amaç, süre, hukuki sebep",
          "Yasal saklama zorunluluğu (fatura 5 yıl) hariç, hesap silindiğinde tüm veri anonimleşir",
          "Şüpheli tarayanı tek dokunuşla engelleyebilirsin — spam/tehdit sistem tarafından otomatik filtrelenir",
        ],
      },
      {
        type: "callout",
        icon: "🔒",
        variant: "info",
        body: "Tagora aydınlatma metni: tagora.com.tr/kvkk · Gizlilik politikası: tagora.com.tr/privacy — her ikisi de yalın Türkçe ile yazıldı, hukuk fakültesi diploması gerektirmez.",
      },
      { type: "h2", text: "Kullanıcı Olarak Sen Ne Yapmalısın?", id: "kullanici-tavsiyeleri" },
      {
        type: "list",
        ordered: true,
        items: [
          "Bir uygulamaya kayıt olurken aydınlatma metnini en azından hızlı gözden geçir — 3 dakika yeter",
          "'Kabul ediyorum' düğmesine tıklamadan önce hangi verilerin işlendiğine bak",
          "Uygulama içinde 'verilerimi indir / sil' seçeneği var mı kontrol et",
          "Şüpheliysen bir platformdan başvurudan çekil — Türkiye'de KVKK Kurulu'na ihbar edebilirsin (kvkk.gov.tr)",
          "Verilerinin nerede saklandığı, kime aktarıldığı senin hakkın — sormaktan çekinme",
        ],
      },
      { type: "h2", text: "Sonuç", id: "sonuc" },
      {
        type: "p",
        text: "KVKK, kullanıcı olarak sana verilerin üzerinde kontrol sağlar — ama sadece hak talep edersen anlam kazanır. Doğru platform + bilinçli kullanıcı formülü kişisel veri güvenliğinin temeli. QR sticker gibi hızlı büyüyen bir alanda bu bilinç kritik.",
      },
      {
        type: "callout",
        icon: "✋",
        variant: "success",
        body: "KVKK bilincin kişisel bir güç. Her platform senin çıkarını korumak zorunda — ama sen de haklarını bilmek zorundasın.",
      },
    ],
  },

  // ============================================================
  // 5. Kayıp bagaj rehberi
  // ============================================================
  {
    slug: "kayip-bagaj-bulma-havalimani-2026",
    title: "Kayıp Bagajınızı Nasıl Bulursunuz? Havalimanı İpuçları 2026",
    description:
      "Havalimanında kaybolan valizi bulmak için 2026'da geçerli 7 adım. THY, IATA prosedürleri, bagaj tag'i doğru okuma, tazminat hakkı ve modern QR etiket sistemleri. Uzman rehber.",
    keywords: [
      "kayıp bagaj bulma",
      "havalimanı bagaj",
      "THY kayıp bagaj",
      "bagaj takip 2026",
      "IATA World Tracer",
      "havalimanı ipuçları",
      "seyahat rehberi",
      "bagaj sigortası",
    ],
    publishedAt: "2026-07-06",
    updatedAt: "2026-07-06",
    author: "Tagora Ekibi",
    category: "Seyahat",
    readMin: 6,
    excerpt:
      "IATA'nın 2024 raporuna göre her 100 uçuşta 1 bagaj sahibinden geç ulaşıyor. Aktarmalarda bu oran %3'e çıkıyor. İşte kaybolan valizini bulmanın 7 adımı ve modern QR etiket sistemleri.",
    hero: { emoji: "🧳", badge: "Seyahat" },
    related: ["qr-sticker-nedir", "arac-camina-telefon-yazmak-tehlikeleri"],
    content: [
      { type: "h2", text: "Kayıp Bagaj İstatistikleri", id: "istatistikler" },
      {
        type: "p",
        text: "IATA (Uluslararası Hava Taşımacılığı Birliği) 2024 raporuna göre:",
      },
      {
        type: "list",
        items: [
          "Her 1.000 yolcudan 6'sı bagajını uçuş sonrası bulamıyor",
          "Aktarmalı uçuşlarda bu oran %3'e (30 kat) yükseliyor",
          "Kaybolan bagajların %85'i 48 saat içinde sahibine ulaşıyor",
          "%3'ü ise hiç bulunamıyor — kalıcı kayıp",
          "Türkiye'de 2024'te 340.000 kayıp bagaj vakası kayıt altına alındı",
        ],
      },
      {
        type: "callout",
        icon: "📊",
        variant: "info",
        body: "En kayıp bagaj riski taşıyan aktarma noktaları: Frankfurt (FRA), Heathrow (LHR), Atatürk (İstanbul). Sabiha Gökçen ise Türkiye'nin en düşük kayıp oranına sahip.",
      },
      { type: "h2", text: "Adım 1: Bagaj Alım Bandında Bekleyin (30-45 dk)", id: "adim-1" },
      {
        type: "p",
        text: "Her uçuşta bir 'son bagaj' işareti vardır — uçağın son valizi bandın üstüne bırakıldığında ekrana yansır. Bandın etrafında bu süreyi bekleyin. Bagajınızın erken gelmiş olması ve kimsenin almadığını görünce yakındakiler size verecektir. Erken paniğe girmeyin.",
      },
      { type: "h2", text: "Adım 2: Kayıp Bagaj Ofisine Gidin", id: "adim-2" },
      {
        type: "p",
        text: "Bagaj alım salonunda 'Lost Baggage / Kayıp Bagaj' işaretli bir ofis vardır. Genelde bandın sonunda ya da çıkış noktasına yakın. Yanınıza şunları alın:",
      },
      {
        type: "list",
        items: [
          "Uçak biletiniz (elektronik / basılı)",
          "Bagaj etiketiniz — check-in'de aldığınız barkod kart. **En kritik doküman.**",
          "Kimliğiniz (pasaport / kimlik)",
          "İletişim bilgileriniz (yerel telefon + email)",
        ],
      },
      { type: "h2", text: "Adım 3: PIR Formu Doldurun", id: "adim-3" },
      {
        type: "p",
        text: "PIR (Property Irregularity Report) uluslararası bir kayıt formudur. Bu doldurulmadan hiçbir bagaj araması başlamaz. Formda şunlar sorulur:",
      },
      {
        type: "list",
        items: [
          "Bagaj etiket numarası (10 haneli, barkod altında)",
          "Bagaj markası, rengi, boyutu",
          "İçinde ne var (genel açıklama — 'kıyafet, cep telefonu şarj cihazı')",
          "Değerli eşya var mı, varsa liste",
          "Nerede kaldığınız (otel adres) + yerel telefon",
        ],
      },
      {
        type: "callout",
        icon: "⚠️",
        variant: "warning",
        body: "PIR formu 24 saat içinde doldurulmalı — sonrasında havayolu sorumluluğu reddeder. Ofis kapalıysa online form (havayolunun sitesinde) yeterlidir.",
      },
      { type: "h2", text: "Adım 4: IATA World Tracer Sistemiyle Takip", id: "adim-4" },
      {
        type: "p",
        text: "PIR formu bir referans numarası ile size verilir (örnek: TK-IST-12345). Bu numara IATA World Tracer sistemine girer — dünyanın tüm havayollarının paylaştığı ortak bir bagaj veritabanı. Bagajınız başka bir havalimanında bulunduğunda otomatik eşleşir.",
      },
      {
        type: "p",
        text: "Kendi takibinizi worldtracer.aero adresinden yapabilirsiniz — havayolu kısaltması + referans no ile.",
      },
      { type: "h2", text: "Adım 5: Modern Yardımcı — QR Bagaj Etiketi", id: "adim-5" },
      {
        type: "p",
        text: "2024'ten itibaren yaygınlaşan modern bir çözüm: bagajınıza kendi QR etiketinizi eklemek. Klasik havayolu tag'i düşerse veya yırtılırsa, sizinki hâlâ orada olur. Bulan kişi telefonuyla QR'ı tarar, sizinle anonim mesajlaşır — telefon numaranız görünmeden.",
      },
      {
        type: "list",
        items: [
          "Klasik pet-ID formatı ('sahibi: Ahmet, tel: 0555...') artık önerilmiyor — spam ve kimlik hırsızlığı riski var",
          "QR etiket ile bulan sadece sana mesaj gönderir, adres/telefon bilgisi asla paylaşılmaz",
          "Aras Kargo ve Yurtiçi Kargo ile entegre QR sistemler artık standart",
        ],
      },
      {
        type: "callout",
        icon: "🧳",
        variant: "success",
        body: "Tagora gibi bir platformda bagaj etiketi 49₺, tekli kargo dahil. Havalimanı personeli veya diğer yolcular tarayabilir. tagora.com.tr/kullanim/bagaj",
      },
      { type: "h2", text: "Adım 6: Zaman Çizelgesi", id: "zaman-cizelgesi" },
      {
        type: "table",
        headers: ["Süre", "Ne olur", "Sen ne yap"],
        rows: [
          ["0-24 saat", "%75'i bulunur", "PIR referansı takip et"],
          ["24-72 saat", "%85'i bulunur", "Havayolunu her 12 saatte ara"],
          ["3-7 gün", "%90'ı bulunur", "Değişik havalimanlarını sor"],
          ["7-14 gün", "%97'si bulunur", "Tazminat başvurusu başlat"],
          ["14+ gün", "Kayıp beyanı", "Sigorta talebine geç"],
        ],
      },
      { type: "h2", text: "Adım 7: Tazminat Hakkınız", id: "tazminat" },
      {
        type: "p",
        text: "Montreal Konvansiyonu'na göre havayolları kayıp bagaj için tazminat ödemek zorundadır. 2026 için maksimum tazminat:",
      },
      {
        type: "list",
        items: [
          "Uluslararası uçuş: 1.288 SDR (~26.000 TL) — bagaj başına",
          "İç hat uçuş: 500 TL / kg — SGK tarifesi (Türkiye'de 2026)",
          "Değerli eşya için ekstra sigorta — check-in'de bildirilmişse",
          "Otelde acil ihtiyaç (giyecek, hijyen) için 200-500 TL avans genelde ödenir",
        ],
      },
      {
        type: "callout",
        icon: "💡",
        variant: "info",
        body: "Kredi kartıyla bilet alındıysa çoğu banka ek bagaj sigortası sağlar. Kartınızın koşullarını kontrol edin — genelde 500 EUR-1000 EUR ek koruma.",
      },
      { type: "h2", text: "Bonus: Bagajın Sizden Kaçmasını Nasıl Önlersin?", id: "onleme" },
      {
        type: "list",
        items: [
          "Renkli tag / kurdele → binlerce siyah valizden hemen ayırt edilir",
          "Bagaja yıkılmaya karşı içeride etiket + iletişim bilgisi (arka planda QR ile)",
          "Aktarmalı uçuşta 60 dakikadan az sürel aktarmalardan kaçının",
          "Bagajı erken teslim et — son dakika teslimatlarda hata riski artıyor",
          "Değerli eşyalar (elektronik, mücevher, ilaç) her zaman kabin bagajında",
          "Bagajın fotoğrafı — hem içi hem dışı — havalimanı personeline gösterebilirsin",
        ],
      },
      { type: "h2", text: "Sonuç", id: "sonuc" },
      {
        type: "p",
        text: "Kayıp bagaj yıllık her seyyah için ortalama %6 olasılıklı — küçümsenecek risk değil. Doğru prosedürü bilmek + modern QR etiket + iyi bir sigorta üçlüsü hemen hemen tüm senaryoları kapsar. Bir dahaki seyahatinde bir plan B'niz olsun.",
      },
      {
        type: "callout",
        icon: "🧳",
        variant: "success",
        body: "Tagora bagaj etiketi ile başlamak isteyene: tagora.com.tr/kullanim/bagaj — 49₺'den başlıyor, Türkiye içi 2-4 gün kargo.",
      },
    ],
  },
];
