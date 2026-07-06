/**
 * Kullanım alanları — SEO landing pages için içerik veri modeli.
 *
 * Her kullanım alanı için:
 *   - SEO metadata (title, description, keywords)
 *   - Hero (badge, headline, subheadline, emoji)
 *   - Avantajlar (3-4 kart)
 *   - Nasıl çalışır (3 adım)
 *   - Örnek senaryolar (2-3)
 *   - FAQ (3-4 soru)
 */

export interface UseCaseContent {
  slug: string;
  useCaseKey: string; // stickers.use_case enum karşılığı
  emoji: string;
  hero: {
    badge: string;
    h1: string;
    subheadline: string;
  };
  metadata: {
    title: string;
    description: string;
    keywords: string[];
  };
  benefits: { icon: string; title: string; body: string }[];
  howItWorks: { title: string; body: string }[];
  scenarios: { title: string; body: string }[];
  faq: { q: string; a: string }[];
  cta: { primary: string; secondary: string };
}

export const USE_CASES: Record<string, UseCaseContent> = {
  arac: {
    slug: "arac",
    useCaseKey: "vehicle",
    emoji: "🚗",
    hero: {
      badge: "Araç için",
      h1: "Aracının önündeki not defteri değil, akıllı QR sticker",
      subheadline:
        "Yanlış park, kaza, yolda kalma… Telefonunu cama yazmadan ulaşılabilir kal. Camına yapıştır, tarayan seninle anonim mesajlaşsın — numaran onda değil, sende kalsın.",
    },
    metadata: {
      title: "Araba için QR Sticker — Camına Yapıştır, Numaran Gizli Kalsın",
      description:
        "Tagora araç QR sticker — yanlış park ve kaza için anonim iletişim. Telefonunu camına yazma. KVKK uyumlu, uçtan uca şifreli. Kargo dahil 49₺'den başlayan fiyatlar.",
      keywords: [
        "araba QR sticker",
        "araç iletişim etiketi",
        "yanlış park QR",
        "araba camı sticker telefon",
        "araç için gizli iletişim",
        "araba kaza QR kod",
        "yolda kaldım QR",
        "araba sahibine ulaş",
      ],
    },
    benefits: [
      {
        icon: "🔒",
        title: "Telefonun gizli kalır",
        body: "Camına telefon numarası yazmana gerek yok. QR'ı taradıklarında anonim chat açılır.",
      },
      {
        icon: "⚡",
        title: "Anında bildirim",
        body: "Biri QR'ı taradığında telefonuna push notification gelir — anında cevap ver.",
      },
      {
        icon: "🚫",
        title: "Spam korumalı",
        body: "İstenmeyen kişileri tek dokunuşla engelle. Numaran ele geçmez.",
      },
      {
        icon: "🌧️",
        title: "Su ve UV dayanıklı",
        body: "Yağmur, güneş, kış soğuğu — Tagora sticker'ı 5+ yıl solmadan durur.",
      },
    ],
    howItWorks: [
      {
        title: "1. Sipariş ver",
        body: "5'li paket (149₺) araç için ideal — camına, arka cama, motor kaputuna yapıştırabilirsin.",
      },
      {
        title: "2. Camına yapıştır",
        body: "İç yüzeyden yapıştırılabilir tasarım (ters baskı) — sticker güneşe direkt gelmez, çok daha uzun ömürlü olur.",
      },
      {
        title: "3. QR'ı taratmayı bekle",
        body: "Yanlış park ederkensin, biri kaza yapmış — QR'ı tarayıp seninle anonim mesajlaşabilirler.",
      },
    ],
    scenarios: [
      {
        title: "🅿️ Yanlış park ettim, aracımı çekemedim",
        body: "Acele bir ziyaret sırasında yanlış park ettin, ama araç sahibi seni arıyor. QR'ı taradığında anonim chat başlar, telefonun gizli kalır. Kızmıyor bile, çünkü hızlı cevap verebiliyorsun.",
      },
      {
        title: "🚗 Küçük bir kaza yaptım, sahibi yok",
        body: "Park halindeki araca hafifçe çarptın. Cebinden not defteri çıkarmak yerine QR'ı tara → mesaj bırak, arkanda numara kalmaz.",
      },
      {
        title: "⛑️ Yolda kaldım, biri yardım etmek istiyor",
        body: "Aracın çalışmıyor, yoldan geçen biri yardım etmek istiyor ama sen içeride uyuyakalmışsın. QR'ı tarayıp seni uyandırabilir.",
      },
    ],
    faq: [
      {
        q: "Sticker cama içeriden mi dışarıdan mı yapıştırılıyor?",
        a: "Araç için önerdiğimiz varyant ters-baskı (inside window decal) — camın içinden yapıştırılıyor, sticker güneş ve yağmurdan korunuyor. 8+ yıl solmuyor.",
      },
      {
        q: "QR'ı biri taradığında telefonum görünür mü?",
        a: "Hayır. Anonim chat açılır. Sen telefonunda push notification alırsın, ama karşı tarafa sadece 'anonim ziyaretçi' olarak görünür. Numaran hiç paylaşılmaz.",
      },
      {
        q: "Kötü niyetli birileri sürekli tarayıp beni rahatsız edebilir mi?",
        a: "Hayır — engelleme özelliği var. Bir kişiyi engellersen o cihaz artık seninle mesajlaşamaz. Ayrıca spam/tehdit içerikleri sistem otomatik filtreler.",
      },
      {
        q: "Sticker'ı ürünüzü satarken sonraki sahibe devredebilir miyim?",
        a: "Evet. Uygulamadan sticker'ı 'devret' butonuyla bağını koparabilirsin — yeni sahibi hesabına ekleyebilir.",
      },
    ],
    cta: {
      primary: "Araç Paketi Sipariş Et →",
      secondary: "Nasıl Çalışır İzle",
    },
  },

  kapi: {
    slug: "kapi",
    useCaseKey: "door",
    emoji: "🚪",
    hero: {
      badge: "Kapı & Zil için",
      h1: "Zilin bozulduğunda değil, hep işine yarayan kapı QR'ı",
      subheadline:
        "Kargo geldi, misafir kayboldu, komşu bir şey soracak — zile basmak yerine QR'ı tarar. Anında mesaj alırsın, kapıyı açar mısın diye sormaya bile gerek kalmaz.",
    },
    metadata: {
      title: "Kapı QR Sticker — Zil Değil, Akıllı Kapı Etiketi",
      description:
        "Tagora kapı QR sticker — kargo, misafir, komşu için anonim iletişim. Zile basmak yerine QR'ı tarasın. KVKK uyumlu, kargo dahil.",
      keywords: [
        "kapı QR sticker",
        "zil QR kod",
        "kargo teslim QR",
        "misafir bildirim etiketi",
        "kapı önü QR",
        "apartman kapı QR",
        "AirBnB kapı etiketi",
      ],
    },
    benefits: [
      {
        icon: "📦",
        title: "Kargo kolayı",
        body: "Kargocu QR'ı tarar, sen 'kapı önüne bırak' yazarsın — telefonda konuşmadan iş biter.",
      },
      {
        icon: "🔕",
        title: "Zil çalmayan sessiz iletişim",
        body: "Bebek uyuyor mu, ev sahibi misin ama meşgul müsün? QR ile sessiz mesajlaş.",
      },
      {
        icon: "🏠",
        title: "AirBnB / kısa süreli kiralama",
        body: "Misafir check-in için QR'ı tarar, sen adres tarifleri veya WiFi şifresi yollarsın.",
      },
      {
        icon: "💧",
        title: "Suya ve tozu dayanıklı",
        body: "Kapı önünde yağmur, kar, toz — sticker 5+ yıl durur.",
      },
    ],
    howItWorks: [
      {
        title: "1. Sipariş ver",
        body: "Tekli sticker (49₺) kapı için yeter. Aile evinizse 5'li paket ideal.",
      },
      {
        title: "2. Kapıya yapıştır",
        body: "Kapı zilinin yanına, apartman girişine ya da posta kutusuna yapıştır.",
      },
      {
        title: "3. Mesajları takip et",
        body: "Kargocu, misafir, komşu QR'ı taradığında anında bildirim gelir.",
      },
    ],
    scenarios: [
      {
        title: "📦 Kargocu geldi, evde yokum",
        body: "Kargocu QR'ı tarar, sen 'komşuya bırak' ya da 'kapı önüne koy' yazarsın. Zil çalmadan, telefonda konuşmadan iş biter.",
      },
      {
        title: "🏠 AirBnB misafirim geldi",
        body: "Misafir kapıda kaybolmuş, senin de vaktin yok. QR'ı tarayıp 'anahtar dolapta, şifre 1234' yazarsın.",
      },
      {
        title: "🤫 Bebek uyuyor, zil çalmasın",
        body: "Kapıya not: 'zilin altındaki QR'ı tarayın'. Ziyaretçi anonim mesaj bırakır, sen uygun anda cevap verirsin.",
      },
    ],
    faq: [
      {
        q: "Herkes kapımı taratabilir mi, güvenlik sıkıntısı olur mu?",
        a: "QR'ın taranması yalnızca mesajlaşma başlatır — hiçbir zaman kapıyı açmaz, ev adresini vermez. Sen her mesajı görüp cevaplarsın.",
      },
      {
        q: "Sticker kapıdan söker mi zarar verir mi?",
        a: "Hayır — 3M sınıfı akrilik yapıştırıcı, sökünce artık kalmaz. Değiştirebilirsin.",
      },
      {
        q: "Kargocular gerçekten QR taryor mu?",
        a: "Aras, Yurtiçi ve MNG kargocuları QR okumaya alıştı — teslim onayı için de tarıyorlar. Yılın çoğunda çalışıyor, hız kargonun elinde.",
      },
    ],
    cta: {
      primary: "Kapı Sticker'ı Sipariş Et →",
      secondary: "Detayları Gör",
    },
  },

  pet: {
    slug: "pet",
    useCaseKey: "pet",
    emoji: "🐕",
    hero: {
      badge: "Evcil hayvan için",
      h1: "Sevimli dostun kaybolursa geri döner — pet ID kolyesinde QR",
      subheadline:
        "Köpeğin, kedinin veya kuş kafesin için tasma QR'ı. Kaybolduğunda bulan telefonundan tarar, sen anonim olarak bilgi verirsin. Adresini vermek zorunda değilsin.",
    },
    metadata: {
      title: "Evcil Hayvan QR Sticker — Kolyesine Tak, Kaybolursa Bulunur",
      description:
        "Tagora evcil hayvan QR sticker — köpek, kedi tasmasında akıllı ID. Kaybolduğunda anonim bulmaca. Adresin gizli kalır. Kargo dahil.",
      keywords: [
        "köpek QR kolye",
        "kedi tasma QR",
        "pet ID etiketi",
        "kayıp evcil hayvan QR",
        "evcil hayvan tasma sticker",
        "köpek buldum QR",
        "hayvan çipi yerine QR",
      ],
    },
    benefits: [
      {
        icon: "🏠",
        title: "Adresin gizli",
        body: "Klasik pet ID'de ev adresin yazılı. Tagora'da anonim mesaj — bulan seninle mesajlaşır, adresi bilmez.",
      },
      {
        icon: "📍",
        title: "Konum paylaşma opsiyonu",
        body: "İstersen bulanla lokasyonu paylaşabilirsin. İstemezsen sadece 'nereden alabilirim' diye sorabilirler.",
      },
      {
        icon: "🎨",
        title: "Şirin tasarım",
        body: "Pet için özel şeffaf ya da renkli sticker — tasmaya yakışıklı, sevimli.",
      },
      {
        icon: "💦",
        title: "Su geçirmez",
        body: "Köpeğin göle atlıyor, kedin yağmurda kalıyor — sticker etkilenmez.",
      },
    ],
    howItWorks: [
      {
        title: "1. Sipariş ver",
        body: "Tekli sticker (49₺) veya 5'li paket (aile+köpek+kedi için).",
      },
      {
        title: "2. Tasmaya yapıştır",
        body: "Tasmaya, çıngıraklı zinciye ya da kolyeye yapıştır. Kolay yapışır, çıkmaz.",
      },
      {
        title: "3. Kaybolsa da bulunur",
        body: "Bulan telefonunu tutup QR'ı tarar. Sen bildirim alır, konuşursun — dostun sana döner.",
      },
    ],
    scenarios: [
      {
        title: "🐶 Köpeğim parkta kaçtı",
        body: "Bir kaç saat sonra biri tasmasındaki QR'ı taradı. 'Şu adreste bize geldi, gel al' diye mesaj attılar. Ev adresini vermeden buluştunuz.",
      },
      {
        title: "🐱 Kedim penceredene atladı, hiç dönmedi",
        body: "3 gün sonra 2 mahalle öteden birisi QR'ı taradı. Kedin sana anonim chat üzerinden ulaşabildi.",
      },
      {
        title: "✈️ Seyahatteyken evcil hayvan pansiyonda",
        body: "Pansiyona teslim ederken QR'lı tasma taktın. Pansiyondaki bir sorun olduğunda seninle mesajlaşabiliyor.",
      },
    ],
    faq: [
      {
        q: "Çip yerine geçer mi?",
        a: "Hayır, çipin yerine geçmez ama çipe ek olarak ideal. Çip veterinerde okunur, QR ise sokakta anlık.",
      },
      {
        q: "Ev adresim kimseye gitmez mi kesin?",
        a: "Kesin. Adresini uygulamada asla soruşturmayız, sen mesajda paylaşmadıkça hiç kimse görmez.",
      },
      {
        q: "Sticker tasmaya nasıl yapışıyor, düşer mi?",
        a: "Endüstriyel akrilik yapıştırıcı — köpek suya girse de düşmüyor. Ekstra güvenlik için tasma altında metal halkalı seçenek de var.",
      },
    ],
    cta: {
      primary: "Pet Kolye Sticker'ı Al →",
      secondary: "Nasıl Çalışır Gör",
    },
  },

  bagaj: {
    slug: "bagaj",
    useCaseKey: "luggage",
    emoji: "🧳",
    hero: {
      badge: "Bagaj & valiz için",
      h1: "Havalimanında bagajın kayıp mı? QR'ın seni bulur.",
      subheadline:
        "Valizin bant değişikliğinde kayboldu, uçak beklerken kimse bulamıyor. Bagajındaki QR'ı bulan tararsa anonim mesajlaşırsın. Ne adresin ne uçuş kodun gitmez.",
    },
    metadata: {
      title: "Bagaj QR Etiket — Kaybolan Valizin Geri Döner",
      description:
        "Tagora bagaj sticker — havalimanı, tren, otobüsde kayıp valiz için akıllı QR. Ev adresin gizli kalır, bulan seninle anonim mesajlaşır.",
      keywords: [
        "bagaj etiketi QR",
        "valiz QR kod",
        "kayıp bagaj sticker",
        "havalimanı bagaj takip",
        "uçuş valiz etiketi",
        "kayıp valiz bulundu",
        "bagaj isim etiketi",
      ],
    },
    benefits: [
      {
        icon: "🛫",
        title: "Adres yok, telefon yok",
        body: "Klasik bagaj etiketinde ev adresi ve telefon açık — Tagora'da hiçbiri.",
      },
      {
        icon: "🌍",
        title: "Yurt dışında da çalışır",
        body: "İngilizce arayüz — Türk olmayan biri de kolayca mesaj yollayabilir.",
      },
      {
        icon: "🎨",
        title: "Valizinde görünmez",
        body: "Şeffaf ya da minik sticker seçenekleri — turuncu 'ben buradayım' etiketi taşımadan.",
      },
      {
        icon: "⚡",
        title: "Anında bildirim",
        body: "Havalimanında bagaj bulanı bulur bulmaz push alırsın.",
      },
    ],
    howItWorks: [
      {
        title: "1. Sipariş ver",
        body: "Aile için 5'li paket ideal — herkesin valizine bir tane.",
      },
      {
        title: "2. Valize yapıştır",
        body: "Bagaj kolu, dış cebin görünür yeri veya bagaj etiketi kartına.",
      },
      {
        title: "3. Kaybolsa da bulur",
        body: "Bulan tararsa mesajlaşırsın. 'Hangi havalimanı?' 'Uçağa yetişemiyorum, kargolayabilir misin?' konuşabilirsin.",
      },
    ],
    scenarios: [
      {
        title: "✈️ Aktarma bagajım Frankfurt'ta kayboldu",
        body: "İstanbul'a döndükten sonra biri tarayıp 'valiz bende, bir sonraki uçağa koyabilirim' diye mesaj attı. Adresini paylaşmadan geri aldın.",
      },
      {
        title: "🚂 Trende çantamı unuttum",
        body: "İnip 2 istasyon sonra fark ettin. QR'ın sayesinde temizlikçi seni buldu, çantan seni bekliyor.",
      },
      {
        title: "🎒 Okul çantası servis şoförünün yanında",
        body: "Çocuğun servisinde çantayı bıraktı. Şoför QR'ı tarayıp haber verdi — telefonu bilmeden.",
      },
    ],
    faq: [
      {
        q: "Havalimanı personeli QR'ı tarar mı?",
        a: "Türk havalimanlarında IATA barkod okuyucuları QR standartlarını okuyor — evet, tarayabilirler. Ayrıca yolcular da her an tarayabilir.",
      },
      {
        q: "Bagajım gerçekten çalınsa bulunur mu?",
        a: "Kesin garanti yok ama iyi niyetli birinin eline geçtiğinde şansımız çok yüksek. Yasal olmayanlar QR'ı sökebilir.",
      },
      {
        q: "Yurt dışında dil sorunu olur mu?",
        a: "Uygulamamız Türkçe + İngilizce. Tarayan kişi kendi diline geçebilir, sen Türkçe cevap yazarsın — otomatik çeviri opsiyonu var.",
      },
    ],
    cta: {
      primary: "Bagaj Sticker'ı Sipariş Et →",
      secondary: "İncele",
    },
  },

  bisiklet: {
    slug: "bisiklet",
    useCaseKey: "bike",
    emoji: "🚴",
    hero: {
      badge: "Bisiklet & scooter için",
      h1: "Çalındığında yardım eden, park ettiğinde sesini duyuran QR",
      subheadline:
        "Bisikletin veya scooter'ın park halindeyken biri çarptıysa, çalınıp bulunduysa ya da yerinden almak gerekiyorsa — QR'ını tarar, seninle anonim mesajlaşırlar.",
    },
    metadata: {
      title: "Bisiklet & Scooter QR Sticker — Çalındığında Bulunur",
      description:
        "Tagora bisiklet ve scooter QR sticker — park yerinde sorun, çalınma, kaza için akıllı iletişim. KVKK uyumlu, kimliğin gizli.",
      keywords: [
        "bisiklet QR sticker",
        "scooter etiketi",
        "bisiklet çalıntı QR",
        "e-scooter QR kod",
        "kask QR etiketi",
        "bisiklet sahibine ulaş",
        "sportmen bisikleti",
      ],
    },
    benefits: [
      {
        icon: "🚨",
        title: "Park yerinde sorun",
        body: "Bisikletin yolu kapatıyor, biri hemen sana ulaşabilir. Yönetici çekmek zorunda kalmaz.",
      },
      {
        icon: "🕵️",
        title: "Çalınıp bulunma şansı",
        body: "İyi niyetli biri seni tanısın — çalınıp satan bir yerde QR'ı görüp bildirsin.",
      },
      {
        icon: "🌦️",
        title: "Yağmur ve UV'e dayanıklı",
        body: "Bisiklet dışarıda kalır — sticker 5+ yıl solmaz, çıkmaz.",
      },
      {
        icon: "🎨",
        title: "Küçük ve şık",
        body: "3 farklı boy — kadroya, sele altına ya da kaska yapıştırabilirsin.",
      },
    ],
    howItWorks: [
      {
        title: "1. Sipariş ver",
        body: "Tekli sticker (49₺) veya bisiklet + kask + scooter için 5'li paket.",
      },
      {
        title: "2. Bisiklete yapıştır",
        body: "Kadro tüpü, sele altı, ya da direksiyon çubuğu — 24 saat kuru.",
      },
      {
        title: "3. Sorun olursa mesajlaş",
        body: "Park yerinde sorun, çarpma, veya çalıntı — biri QR'ı tararsa haber alırsın.",
      },
    ],
    scenarios: [
      {
        title: "🚴 Bisikletim yola engel",
        body: "Aksırık gibi park etmişsin, komşu QR'ı tarar 'bisikletini çeker misin' diye anonim mesajlar. Yönetimle uğraşmak yerine sen kısa sürede halledersin.",
      },
      {
        title: "🕵️ Bisikletim çalındı, birisi buldu",
        body: "Bir hafta sonra bir aksesuar satıcısı QR'ı tarayıp 'bu sizin mi?' diye sordu. Polise gitmeden bisikletini geri aldın.",
      },
      {
        title: "🛴 Scooter'ım kaldırımda tekleme yaptı",
        body: "Bir yaya QR'ı tarayıp 'senin scooter'ın devrildi, ıslak' diye söyledi. Hemen geldin, ıslanmadan aldın.",
      },
    ],
    faq: [
      {
        q: "Bisiklet çalınırsa gerçekten bulunma şansı yüksek mi?",
        a: "Yerel çalınmada evet, organize çalıntı satışlarda daha düşük. Ama denemekte fayda var — 49₺ küçük bir yatırım.",
      },
      {
        q: "Sticker bisikletten sökülür mü, çalan siler mi?",
        a: "Endüstriyel akrilik — söküldüğünde iz kalıyor. Bir çalan silme rağmen QR'ı bilerek gizler.",
      },
      {
        q: "Kaskıma yapıştırabilir miyim?",
        a: "Evet. Kaza durumunda yardım için de kullanışlı — biri kaskı bulup QR'ı tarayabilir.",
      },
    ],
    cta: {
      primary: "Bisiklet Sticker'ı Sipariş Et →",
      secondary: "Nasıl Çalışır",
    },
  },
};

export const USE_CASE_SLUGS = Object.keys(USE_CASES);
