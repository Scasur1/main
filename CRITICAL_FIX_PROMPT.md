# CRITICAL FIX: Convert Data Source Mode to Database Legacy Mode

## SORUN
Make.com blueprint'leri "Data Source" modunda çalışıyor. Bu modda Make.com, Notion database UUID'si yerine kendi internal ID'sini kullanıyor. Müşteri blueprint'i import edip connection seçtiğinde, Make.com Data Source ID'yi tanımıyor ve [404] hatası veriyor. Bu sadece Update ve Create modüllerinde oluyor — Search modülleri çalışıyor.

## ÇÖZÜM
Tüm Notion modüllerini "Data Source" modundan "Database (Legacy)" moduna çevir. Bu modda Notion database UUID'si direkt kullanılıyor ve Make.com bunu kabul ediyor.

## UYGULAMA

blueprints/ klasöründeki 7 master JSON dosyasını (M0.json - M6.json) dönüştüren bir Node.js script yaz: `lib/convert-blueprints.js`

Script şunu yapacak:
1. blueprints/ klasöründeki her JSON'ı oku
2. JSON'ı parse et (obje olarak)
3. Tüm Notion modüllerini recursive olarak bul
4. Her modülü aşağıdaki kurallara göre dönüştür
5. Dönüştürülmüş JSON'ları blueprints-converted/ klasörüne yaz
6. Doğrulama testleri çalıştır

Sonra API route'u (app/api/generate/route.js) blueprints-converted/ klasöründen okuyacak şekilde güncelle.

## 80 MODÜL - 4 TİP DÖNÜŞÜM KURALI

Toplam 80 Notion modülü var:
- notion:searchObjects1 → 26 adet
- notion:createDataSourceItem → 29 adet  
- notion:updateADatabaseItem → 23 adet
- notion:getADatabaseItem → 2 adet

### TİP 1: notion:searchObjects1 (26 adet)
Modül adı DEĞİŞMEZ.

MAPPER değişiklikleri:
```
ÖNCEKİ: "data_source": "NOTION_UUID"  →  SONRAKI: "database": "NOTION_UUID"
ÖNCEKİ: "select": "data_source_item" →  SONRAKI: "select": "page"
```
"filter", "limit", "sorts" gibi diğer mapper key'leri DOKUNULMAZ.

METADATA.RESTORE.EXPECT değişiklikleri:
```
ÖNCEKİ: "data_source": {"rpcSearch": {"label": "X", "value": "UUID"}}
SONRAKI: "database": {"rpcSearch": {"label": "X", "value": "UUID"}}

ÖNCEKİ: "select": {"label": "Data Source ItemsThis must be used..."}
SONRAKI: "select": {"label": "Pages"}
```

METADATA.EXPECT array değişiklikleri:
- name="data_source" olan item → name="database", label="Database ID" yap
- name="select" olan item → validate.enum'dan "data_source_item" → "page" yap

### TİP 2: notion:createDataSourceItem → notion:createADatabaseItem (29 adet)
**MODÜL ADI DEĞİŞİR**: "notion:createDataSourceItem" → "notion:createADatabaseItem"

MAPPER değişiklikleri:
```
ÖNCEKİ: "data_source": "NOTION_UUID"  →  SONRAKI: "database": "NOTION_UUID"
ÖNCEKİ: "select": "list"             →  SONRAKI: "select": "list" (aynı kalır)
```
"fields" objesi ve içindeki tüm property ID'leri, formüller, değerler DOKUNULMAZ.

METADATA.RESTORE.EXPECT değişiklikleri:
```
ÖNCEKİ: "data_source": {"rpcSearch": ...} veya "data_source": {"nested": [...]}
SONRAKI: "database": (aynı value)
```

METADATA.EXPECT array değişiklikleri:
- name="data_source" olan item → name="database", label="Database ID" yap

### TİP 3: notion:updateADatabaseItem (23 adet)
Modül adı DEĞİŞMEZ.

MAPPER değişiklikleri:
```
ÖNCEKİ: "data_source": "NOTION_UUID"    →  SONRAKI: "database": "NOTION_UUID"
ÖNCEKİ: "updateBy": "data_source"       →  SONRAKI: "updateBy": "database"
ÖNCEKİ: "select": "list"                →  SONRAKI: "select": "list" (aynı kalır)
```
"page" (dinamik referans {{X.id}}), "fields" objesi DOKUNULMAZ.

METADATA.RESTORE.EXPECT değişiklikleri:
```
ÖNCEKİ: "data_source": {"rpcSearch": ...}  →  SONRAKI: "database": {"rpcSearch": ...}
ÖNCEKİ: "updateBy": {"mode": "chose", "label": "Data SourceThis must be used..."}
SONRAKI: "updateBy": {"mode": "chose", "label": "DatabaseSelect a database."}
```

METADATA.EXPECT array değişiklikleri:
- name="data_source" olan item → name="database", label="Database ID" yap
- name="updateBy" olan item → validate.enum içindeki "data_source" → "database"
- name="page" olan item → label="Page ID" yap
- name="select" olan item → label değişebilir

### TİP 4: notion:getADatabaseItem (2 adet)
Modül adı DEĞİŞMEZ.

MAPPER değişiklikleri:
```
ÖNCEKİ: "data_source": "NOTION_UUID"  →  SONRAKI: "database": "NOTION_UUID"
ÖNCEKİ: "getBy": "data_source"        →  SONRAKI: "getBy": "database"
ÖNCEKİ: "select": "list"              →  SONRAKI: "select": "list" (aynı kalır)
```
"page" DOKUNULMAZ.

METADATA.RESTORE.EXPECT ve METADATA.EXPECT → TİP 3 ile aynı mantık (data_source → database).

## KRİTİK KURALLAR - DOKUNULMAYACAKLAR

Bu dönüşüm sırasında aşağıdakiler KESİNLİKLE değiştirilmemeli:

1. mapper.fields içindeki HER ŞEY — property ID'leri (VqEM, WLSA, fAwD, Sru%3D, _%3FiL, mht%7C, xUZ%7D vb.), formüller (addDays, substring, switch, ifempty, formatDate, now vb.), status değerleri (Active, Setup Issue, Error vb.), dinamik referanslar ({{11.id}}, {{15.id}}, {{42.subject}} vb.)

2. mapper.page — dinamik referans ({{8.id}} gibi)

3. mapper.filter — filtre koşulları (Name |&*^%$#@| title gibi)

4. mapper.limit, mapper.sorts

5. metadata.expect array'indeki "fields" spec'i — property tanımları

6. metadata.restore.expect.fields — nested property restore bilgileri

7. Notion olmayan modüller — google-email:*, openai-gpt-3:*, gateway:*, builtin:*, util:* modülleri

8. parameters.__IMTCONN__ — connection ID'leri (5594442, 5627450, 5641152)

9. onerror blokları — hata yönetimi yapısı

10. metadata.designer — modül pozisyonları ve isimleri

## DOĞRULAMA TESTLERİ

Script çalıştıktan sonra her dönüştürülmüş JSON için şunları kontrol et ve raporla:

1. JSON geçerli mi (parse edilebiliyor mu)
2. "data_source" kelimesi mapper'larda kalmamış mı (mapper.data_source hiçbir Notion modülünde olmamalı)
3. Her Notion modülünde "database" key'i var mı
4. notion:createDataSourceItem kalmamış mı (hepsi notion:createADatabaseItem olmalı)
5. Formül sayısı orijinal ile aynı mı ({{...}} pattern'leri say)
6. Property ID sayısı aynı mı (VqEM, WLSA vb.)
7. Status değerleri aynı mı (Active, Error, Setup Issue)
8. Toplam Notion modül sayısı aynı mı (80)

## SON ADIM

Dönüşüm başarılıysa, app/api/generate/route.js'i güncelle:
- blueprints/ yerine blueprints-converted/ klasöründen oku
- Geri kalan her şey (Notion API ile ID bulma, string replaceAll) aynı kalır

## DOSYA YAPISI

```
blueprint-personalizer/
├── blueprints/                    # ORİJİNAL master JSON'lar (dokunma)
├── blueprints-converted/          # Dönüştürülmüş JSON'lar (script oluşturacak)  
├── lib/
│   ├── convert-blueprints.js      # YENİ: Dönüşüm scripti
│   ├── notion.js                  # Mevcut: Notion API helpers
│   └── personalizer.js            # Mevcut: String replace
├── app/
│   └── api/
│       └── generate/
│           └── route.js           # GÜNCELLE: converted klasöründen oku
```

## ÇALIŞTIRMA

```bash
node lib/convert-blueprints.js
```

Bu script bir kerelik çalışır, blueprints-converted/ klasörünü oluşturur. Sonra web uygulaması bu converted dosyaları kullanır.
