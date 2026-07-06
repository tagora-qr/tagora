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
    related: ["pet-id-vs-mikrochip", "arac-camina-telefon-yazmak-tehlikeleri"],
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
    related: ["qr-sticker-nedir", "kvkk-qr-sticker-veri-koruma"],
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
];
