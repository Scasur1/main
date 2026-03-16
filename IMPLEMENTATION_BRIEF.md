# IMPLEMENTATION BRIEF — Blueprint Personalizer Web App

> **Bu dosya Claude Code'a verilecek tek kaynak dosyadır.**
> Claude Code bu dosyayı okuyarak projeyi sıfırdan inşa edecek.

---

## 1. PROJE AMACI

Make.com otomasyon şablonları satan bir ürünümüz var. Müşterilere Notion template + Make.com Blueprint (JSON) dosyaları veriyoruz. Sorun şu: müşteri JSON'ı Make.com'a yüklediğinde, içindeki Notion veritabanı ID'leri bize ait olduğu için müşteri modülde kendi veritabanını seçtiğinde Make.com tüm formülleri, status eşleştirmelerini ve karmaşık mapping'leri siliyor (wipe ediyor).

Çözüm: Müşteriye JSON'ı vermeden önce, onun Notion hesabındaki veritabanı ID'lerini çekip JSON'a enjekte eden basit bir web uygulaması yapıyoruz. Böylece müşteri JSON'ı import ettiğinde ID'ler zaten kendi hesabıyla eşleşiyor ve Make.com hiçbir şeyi silmiyor.

---

## 2. TEKNİK MİMARİ

### Stack
- **Framework:** Next.js 14+ (App Router)
- **Runtime:** Node.js
- **Styling:** Tailwind CSS
- **API:** Next.js Route Handlers (app/api/)
- **External API:** Notion API (@notionhq/client)
- **Deployment:** Şimdilik localhost, sonra Vercel

### Mimari Prensipleri
- Tek sayfa uygulama (single page)
- Veritabanı YOK — hiçbir veri saklanmaz
- Müşterinin Notion token'ı bellekte işlenir ve hemen atılır
- Master JSON dosyaları sunucu tarafında /blueprints klasöründe durur
- Tüm işlem sunucu tarafında (API route) yapılır, client sadece form + indirme

---

## 3. PROJE DOSYA YAPISI

```
blueprint-personalizer/
├── app/
│   ├── layout.js
│   ├── page.js
│   ├── globals.css
│   └── api/
│       └── generate/
│           └── route.js
├── blueprints/
│   ├── M0.json
│   ├── M1.json
│   ├── M2.json
│   ├── M3.json
│   ├── M4.json
│   ├── M5.json
│   └── M6.json
├── lib/
│   ├── notion.js
│   └── personalizer.js
├── .env.local
├── .gitignore
├── package.json
├── tailwind.config.js
├── next.config.js
└── README.md
```

**ÖNEMLİ:** blueprints/ klasörü zaten repo'da mevcut ve içinde M0.json — M6.json dosyaları var. Bu dosyalara DOKUNMA, olduğu gibi kullan.

---

## 4. ORTAM DEĞİŞKENLERİ (.env.local)

.env.local dosyasını oluştur ama boş bırak. Token frontend form'undan gelecek, sunucuda saklanmayacak.

---

## 5. ANA İŞ MANTIĞI — API ROUTE (app/api/generate/route.js)

### Endpoint

POST /api/generate
Content-Type: application/json

### Request Body

```json
{
  "notionToken": "ntn_xxxxxxxxxxxxx",
  "selectedBlueprints": ["M0", "M1", "M2", "M3", "M4", "M5", "M6"]
}
```

### İş Akışı (sırasıyla):

**Adım 1 — Token Validasyonu**
Notion API'ye basit bir test çağrısı yap (GET /v1/users/me). Başarısızsa hata dön.

**Adım 2 — Veritabanlarını Bul**
Notion API POST /v1/search endpoint'ini kullan. 4 veritabanını ismine göre bul:

```javascript
const requiredDatabases = [
  { name: 'Clients', oldId: '314869cd-9cc1-80e9-a154-000b55d12bb0' },
  { name: 'System Settings', oldId: '314869cd-9cc1-803d-bb6f-000b22fb720c' },
  { name: 'System Logs', oldId: '319869cd-9cc1-8060-9c1e-000baffc56c4' },
  { name: 'Dashboard KPIs', oldId: '317869cd-9cc1-8099-be78-000b5e8d2140' },
];
```

Notion API search ile dönen sonuçlarda object === 'database' olanları filtrele. Her birinin title[0].plain_text değerini kontrol ederek isimle eşle. Eğer 4'ünden herhangi biri bulunamazsa, hangi veritabanının eksik olduğunu belirten hata mesajı dön.

ÖNEMLİ DETAY: Notion API search bazen paginated sonuç döner. has_more: true ise start_cursor ile devam et. Ayrıca search sonuçları case-insensitive eşleme gerektirebilir — title[0].plain_text.trim() kullanarak karşılaştır.

**Adım 3 — Main Config Page ID'sini Bul**
System Settings veritabanında "Main Config" başlıklı sayfayı bul:

```javascript
// POST /v1/databases/{systemSettingsId}/query
// filter: { property: 'Config Key', title: { equals: 'Main Config' } }
```

Bu sayfanın id değerini al. Bu, M1 blueprint'indeki tek hardcoded page referansı.

**Adım 4 — JSON String Replace**
Her seçilen blueprint için master JSON dosyasını oku ve 5 replaceAll çalıştır:

```javascript
const OLD_IDS = {
  systemSettings: '314869cd-9cc1-803d-bb6f-000b22fb720c',
  clients:        '314869cd-9cc1-80e9-a154-000b55d12bb0',
  systemLogs:     '319869cd-9cc1-8060-9c1e-000baffc56c4',
  dashboardKpis:  '317869cd-9cc1-8099-be78-000b5e8d2140',
  mainConfigPage: '320869cd-9cc1-81a7-883f-dd59822b7904',
};

function personalize(masterJsonString, newIds) {
  let result = masterJsonString;
  result = result.replaceAll(OLD_IDS.systemSettings, newIds.systemSettings);
  result = result.replaceAll(OLD_IDS.clients, newIds.clients);
  result = result.replaceAll(OLD_IDS.systemLogs, newIds.systemLogs);
  result = result.replaceAll(OLD_IDS.dashboardKpis, newIds.dashboardKpis);
  result = result.replaceAll(OLD_IDS.mainConfigPage, newIds.mainConfigPage);
  return result;
}
```

KRİTİK KURAL: JSON dosyalarını JSON.parse() yapma. Düz string olarak oku, replaceAll yap, düz string olarak döndür. Bu, formüllerin, status değerlerinin ve tüm mapping'lerin birebir korunmasını garanti eder.

**Adım 5 — Response**
Kişiselleştirilmiş JSON'ları response olarak dön:

```json
{
  "success": true,
  "blueprints": {
    "M0": "...kişiselleştirilmiş JSON string...",
    "M1": "...kişiselleştirilmiş JSON string..."
  },
  "summary": {
    "databasesFound": ["Clients", "System Settings", "System Logs", "Dashboard KPIs"],
    "mainConfigPageFound": true,
    "totalReplacements": 187
  }
}
```

### Hata Yönetimi
Her aşamada spesifik hata mesajları dön:

- Token boş veya geçersiz format → 400 → "Please enter a valid Notion Integration Token (starts with ntn_)"
- Token geçersiz (API rejected) → 401 → "Invalid Notion token. Please check your Integration Token."
- Veritabanı bulunamadı → 404 → "Could not find database: {name}. Make sure you shared it with your integration."
- Main Config sayfası bulunamadı → 404 → "Could not find 'Main Config' page in System Settings database."
- Notion API rate limit → 429 → "Notion API rate limit. Please wait a moment and try again."
- Genel hata → 500 → "An unexpected error occurred. Please try again."

---

## 6. LIB DOSYALARI

### lib/notion.js

@notionhq/client paketini kullan. Şu fonksiyonları oluştur:

- validateToken(notionToken) → true/false — GET /v1/users/me çağrısı ile token geçerliliğini kontrol et
- findDatabases(notionToken) → { clients: id, systemSettings: id, systemLogs: id, dashboardKpis: id } — Notion search API ile 4 veritabanını ismine göre bul, bulunamayanları hata olarak raporla
- findMainConfigPage(notionToken, systemSettingsDbId) → pageId (string) — System Settings DB'de "Main Config" başlıklı sayfayı bul

### lib/personalizer.js

- OLD_IDS sabitleri burada tanımlanacak
- personalize(masterJsonString, newIds) → kişiselleştirilmiş JSON string — 5 replaceAll çalıştır, string olarak dön (JSON.parse YAPMA)

---

## 7. FRONTEND (app/page.js)

### Tek Sayfa Tasarımı

**Header:**
- Başlık: "Blueprint Personalizer"
- Alt başlık: "Personalize your Make.com blueprints with your Notion database IDs"

**Form Alanı:**
- Notion Integration Token input (type: password, placeholder: "ntn_...")
- Token formatı kontrolü (ntn_ ile başlamalı)
- Blueprint seçimi: checkbox listesi (M0–M6, hepsi varsayılan seçili). Her blueprint'in yanında kısa açıklaması:
  - M0 — Inbound Webhook Engine
  - M1 — Minute 0 Engine
  - M2 — Daily Engine
  - M3 — Reply Detector
  - M4 — Daily Digest Engine
  - M5 — Preflight Validator
  - M6 — KPI Refresh Job
- "Select All / Deselect All" toggle
- "Generate Blueprints" butonu

**İşlem Durumu:**
- Loading state: spinner + adım adım ilerleme mesajları:
  1. "Validating your Notion token..."
  2. "Searching for your databases..."
  3. "Finding Main Config page..."
  4. "Personalizing blueprints..."
  5. "Done! Your blueprints are ready."

**Sonuç Alanı (başarılıysa):**
- Yeşil başarı kutusu
- Bulunan veritabanlarının listesi (yeşil checkmark ile)
- Her blueprint için ayrı "Download" butonu
- "Download All as ZIP" butonu (tüm blueprint'leri tek ZIP'te indir)

**Hata Alanı (başarısızsa):**
- Kırmızı hata kutusu
- Spesifik hata mesajı
- Yardımcı ipuçları

### ZIP İndirme
Tüm blueprint'leri tek seferde indirmek için client-side ZIP oluştur. jszip kütüphanesini kullan.

### Tasarım Stili
- Temiz, minimal, profesyonel
- Koyu tema (dark mode)
- Tailwind CSS kullan
- Responsive olsun ama öncelik masaüstü
- Güven veren tasarım: kilit ikonu, "Your token is never stored" mesajı

---

## 8. PAKET BAĞIMLILIKLARI

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@notionhq/client": "^2.2.0",
    "jszip": "^3.10.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

---

## 9. GÜVENLİK KURALLARI

1. Notion token ASLA loglanmaz, dosyaya yazılmaz, cookie'ye konmaz
2. Token sadece API route fonksiyonu içinde yaşar, işlem bitince garbage collection'a gider
3. Master JSON dosyaları fs.readFileSync ile okunur, asla client'a raw olarak gönderilmez
4. API route sadece POST kabul eder
5. Token format kontrolü: ntn_ ile başlamalı, minimum 50 karakter
6. Response'ta müşterinin token'ı asla geri dönmez

---

## 10. TEST SENARYOLARI

**Test 1 — Happy Path:**
1. npm run dev ile başlat
2. Tarayıcıda http://localhost:3000 aç
3. Geçerli Notion token'ı yapıştır
4. Tüm blueprint'leri seç
5. "Generate" tıkla
6. 7 JSON dosyası başarıyla indirilmeli

**Test 2 — Geçersiz Token:**
1. "ntn_fake123" yaz
2. "Invalid token" hatası görmeli

**Test 3 — Eksik Veritabanı:**
1. Notion'da bir veritabanından integration erişimini kaldır
2. "Could not find database: X" hatası görmeli

**Test 4 — JSON Doğrulama:**
1. İndirilen JSON'ı aç
2. Eski ID'lerin kalMADIĞINI doğrula
3. JSON'ın valid olduğunu doğrula

---

## 11. BAŞLATMA KOMUTLARI

```bash
npm install
npm run dev
```

Tarayıcıda http://localhost:3000 adresine git.

---

## 12. ÖNCELİK SIRASI

1. Önce API route'u yap ve test et (curl ile)
2. Sonra frontend'i yap
3. En son ZIP indirme özelliğini ekle

Her adımda çalıştığını doğrula, sonra bir sonrakine geç.

---

## 13. YAPMA LİSTESİ (Anti-patterns)

- JSON dosyalarını JSON.parse() yapıp obje olarak manipüle etme — string replace yeter
- Veritabanı, Redis, cache veya session kullanma
- Token'ı .env'e veya herhangi bir dosyaya yazma
- TypeScript kullanma — düz JavaScript yeter, hız önemli
- Test framework'ü kurma — manuel test yeterli
- Gereksiz middleware veya auth katmanı ekleme
- blueprints/ klasöründeki JSON dosyalarını değiştirme
- App Router yerine Pages Router kullanma
