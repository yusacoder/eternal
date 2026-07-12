# Eternal Production — Yönetim Paneli

Tamamen `data.json` üzerinden çalışan, statik (backend'siz) bir kullanıcı yönetim paneli.

## Çalıştırma

Tarayıcılar güvenlik nedeniyle `file://` üzerinden açılan sayfalarda `fetch("data.json")`
isteğini engeller. Bu yüzden paneli **yerel bir sunucu** üzerinden açmanız gerekir:

```bash
cd eternal-panel
python3 -m http.server 8080
```

Ardından tarayıcıda `http://localhost:8080` adresini açın.

(Node.js kullanıyorsanız alternatif olarak `npx serve` da çalışır.)

## Klasör yapısı

```
eternal-panel/
├── index.html          → tek giriş noktası (SPA)
├── data.json            → tüm veriler burada (kullanıcılar, roller, etiketler, site linkleri...)
├── css/style.css        → glassmorphism tema
└── js/
    ├── store.js          → data.json'u yükler, CRUD işlemleri, dışa aktarma
    ├── ui.js             → navbar, hamburger menü, toast, modal gibi paylaşılan parçalar
    ├── pages.js          → dashboard / kullanıcı listesi / admin-detay / profil / ayarlar sayfaları
    ├── router.js         → #/dashboard, #/kullanicilar, #/admin-detay/:id, #/profil/:username, #/ayarlar rotaları
    └── main.js           → uygulamayı başlatır
```

## Kalıcılık hakkında önemli not

Bu panel **statik** bir HTML/CSS/JS uygulamasıdır — bir sunucu tarafı (backend) içermez.
Bu yüzden panel üzerinden yaptığınız tüm değişiklikler (kullanıcı ekleme/silme/düzenleme,
yetki değişiklikleri, site linkleri) yalnızca **tarayıcı belleğinde** tutulur ve sayfa
yenilendiğinde kaybolur.

Değişiklikleri kalıcı hale getirmek için:

1. Ayarlar sayfasındaki **"⬇ data.json indir"** butonuna basın.
2. İnen dosyayı projedeki mevcut `data.json` dosyasının üzerine kopyalayın.
3. Eğer gerçek bir backend'e bağlamak isterseniz, `js/store.js` içindeki `load()` ve
   `downloadJson()` fonksiyonlarını kendi API'nize (ör. `PUT /api/data.json`) istek atacak
   şekilde güncellemeniz yeterli — geri kalan tüm kod (`pages.js`, `ui.js`, `router.js`)
   `Store` modülü üzerinden çalıştığı için değişmeden kalır.

## Kapsanan özellikler

- Kullanıcı ekle / sil (soft-delete) / düzenle / ara / filtrele / aktif-pasif et
- Silinen kullanıcılar için ayrı arşiv sayfası + geri yükleme
- Boolean tabanlı yetki sistemi (Owner, Founder, Developer, Admin, Yönetici, Yetkili, Moderatör...)
- Her kullanıcı için otomatik `/admin-detay/:id` ve `/profil/:username` sayfaları
- Etiket sistemi (istenildiği kadar etiket, data.json'dan yönetilir)
- Canlı arama (kullanıcı adı, ad soyad, yetki, etiket, e-posta)
- Dashboard: toplam kullanıcı / admin / yetkili / moderatör / pasif / silinen / son eklenen
- Hamburger menü: Sitelerimiz (Anime / Manga / Haber) + Admin Başvuru Formu, hepsi data.json'dan
- Glassmorphism tema: beyaz zemin, saydam navbar, yumuşak gölgeler, yuvarlak köşeler

## Sınırlamalar / sonraki adımlar

- Google Forms entegrasyonu yalnızca link olarak tutulur; formun
  `destek@eternalproduction.net` adresine bildirim göndermesi Google Forms tarafında
  (Form ayarları → Yanıtlar → e-posta bildirimleri) yapılandırılmalıdır, bu panel
  bunu otomatik yapamaz.
- Gerçek çoklu kullanıcı / eşzamanlı düzenleme senaryosu için bir backend (ör. Node/Express
  + gerçek dosya yazma veya bir veritabanı) eklenmesi gerekir.
