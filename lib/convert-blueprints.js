#!/usr/bin/env node
/**
 * convert-blueprints.js
 *
 * Tüm Notion modüllerini "Data Source" modundan "Database (Legacy)" moduna çevirir.
 * blueprints/ klasöründeki M0-M6.json dosyalarını dönüştürür,
 * sonuçları blueprints-converted/ klasörüne yazar.
 *
 * Kullanım: node lib/convert-blueprints.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INPUT_DIR = path.join(ROOT, 'blueprints');
const OUTPUT_DIR = path.join(ROOT, 'blueprints-converted');

// ─────────────────────────────────────────────
// DÖNÜŞÜM FONKSİYONLARI
// ─────────────────────────────────────────────

/**
 * TİP 1: notion:searchObjects1
 * - mapper.data_source → mapper.database
 * - mapper.select "data_source_item" → "page"
 * - metadata.restore.expect.data_source → database
 * - metadata.restore.expect.select.label → "Pages"
 * - metadata.expect: name="data_source" → name="database", label="Database ID"
 * - metadata.expect: name="select" validate.enum "data_source_item" → "page"
 */
function convertSearchObjects1(mod) {
  const m = JSON.parse(JSON.stringify(mod)); // deep clone

  // mapper
  if ('data_source' in m.mapper) {
    m.mapper.database = m.mapper.data_source;
    delete m.mapper.data_source;
  }
  if (m.mapper.select === 'data_source_item') {
    m.mapper.select = 'page';
  }

  // metadata.restore.expect
  const re = m.metadata?.restore?.expect;
  if (re) {
    if ('data_source' in re) {
      re.database = re.data_source;
      delete re.data_source;
    }
    if (re.select && typeof re.select === 'object' && re.select.label) {
      re.select.label = 'Pages';
    }
  }

  // metadata.expect array
  const exp = m.metadata?.expect;
  if (Array.isArray(exp)) {
    for (const item of exp) {
      if (item.name === 'data_source') {
        item.name = 'database';
        item.label = 'Database ID';
      }
      if (item.name === 'select' && item.validate?.enum) {
        item.validate.enum = item.validate.enum.map(v =>
          v === 'data_source_item' ? 'page' : v
        );
      }
    }
  }

  return m;
}

/**
 * TİP 2: notion:createDataSourceItem
 * - module adı AYNI KALIR (createDataSourceItem)
 * - mapper.data_source → mapper.database
 * - mapper.select aynı kalır
 * - mapper.fields DOKUNULMAZ
 * - metadata.restore.expect.data_source → database
 * - metadata.expect: name="data_source" → name="database", label="Database ID"
 */
function convertCreateDataSourceItem(mod) {
  const m = JSON.parse(JSON.stringify(mod));

  // module adı değişmez — Make.com createDataSourceItem olarak tanır
  // m.module = 'notion:createDataSourceItem'; // zaten aynı

  // mapper
  if ('data_source' in m.mapper) {
    m.mapper.database = m.mapper.data_source;
    delete m.mapper.data_source;
  }

  // metadata.restore.expect
  const re = m.metadata?.restore?.expect;
  if (re) {
    if ('data_source' in re) {
      re.database = re.data_source;
      delete re.data_source;
    }
  }

  // metadata.expect array
  const exp = m.metadata?.expect;
  if (Array.isArray(exp)) {
    for (const item of exp) {
      if (item.name === 'data_source') {
        item.name = 'database';
        item.label = 'Database ID';
      }
    }
  }

  return m;
}

/**
 * TİP 3: notion:updateADatabaseItem
 * - mapper.data_source → mapper.database
 * - mapper.updateBy "data_source" → "database"
 * - mapper.select aynı kalır
 * - mapper.page ve mapper.fields DOKUNULMAZ
 * - metadata.restore.expect.data_source → database
 * - metadata.restore.expect.updateBy.label → "DatabaseSelect a database."
 * - metadata.expect: name="data_source" → name="database", label="Database ID"
 * - metadata.expect: name="updateBy" validate.enum "data_source" → "database"
 * - metadata.expect: name="page" → label="Page ID"
 */
function convertUpdateADatabaseItem(mod) {
  const m = JSON.parse(JSON.stringify(mod));

  // mapper
  if ('data_source' in m.mapper) {
    m.mapper.database = m.mapper.data_source;
    delete m.mapper.data_source;
  }
  if (m.mapper.updateBy === 'data_source') {
    m.mapper.updateBy = 'database';
  }

  // metadata.restore.expect
  const re = m.metadata?.restore?.expect;
  if (re) {
    if ('data_source' in re) {
      re.database = re.data_source;
      delete re.data_source;
    }
    if (re.updateBy && typeof re.updateBy === 'object') {
      re.updateBy.label = 'DatabaseSelect a database.';
    }
  }

  // metadata.expect array
  const exp = m.metadata?.expect;
  if (Array.isArray(exp)) {
    for (const item of exp) {
      if (item.name === 'data_source') {
        item.name = 'database';
        item.label = 'Database ID';
      }
      if (item.name === 'updateBy' && item.validate?.enum) {
        item.validate.enum = item.validate.enum.map(v =>
          v === 'data_source' ? 'database' : v
        );
      }
      if (item.name === 'page') {
        item.label = 'Page ID';
      }
    }
  }

  return m;
}

/**
 * TİP 4: notion:getADatabaseItem
 * - mapper.data_source → mapper.database
 * - mapper.getBy "data_source" → "database"
 * - mapper.select aynı kalır
 * - mapper.page DOKUNULMAZ
 * - metadata → TİP 3 ile aynı mantık
 */
function convertGetADatabaseItem(mod) {
  const m = JSON.parse(JSON.stringify(mod));

  // mapper
  if ('data_source' in m.mapper) {
    m.mapper.database = m.mapper.data_source;
    delete m.mapper.data_source;
  }
  if (m.mapper.getBy === 'data_source') {
    m.mapper.getBy = 'database';
  }

  // metadata.restore.expect
  const re = m.metadata?.restore?.expect;
  if (re) {
    if ('data_source' in re) {
      re.database = re.data_source;
      delete re.data_source;
    }
    if (re.getBy && typeof re.getBy === 'object') {
      re.getBy.label = 'DatabaseSelect a database.';
    }
  }

  // metadata.expect array
  const exp = m.metadata?.expect;
  if (Array.isArray(exp)) {
    for (const item of exp) {
      if (item.name === 'data_source') {
        item.name = 'database';
        item.label = 'Database ID';
      }
      if (item.name === 'getBy' && item.validate?.enum) {
        item.validate.enum = item.validate.enum.map(v =>
          v === 'data_source' ? 'database' : v
        );
      }
      if (item.name === 'page') {
        item.label = 'Page ID';
      }
    }
  }

  return m;
}

// ─────────────────────────────────────────────
// RECURSIVE MODÜL DÖNÜŞTÜRÜCÜ
// ─────────────────────────────────────────────

function convertModulesInObject(obj) {
  if (Array.isArray(obj)) {
    return obj.map(convertModulesInObject);
  }
  if (obj !== null && typeof obj === 'object') {
    // Bu bir modül mü?
    if (typeof obj.module === 'string' && obj.module.startsWith('notion:')) {
      let converted;
      switch (obj.module) {
        case 'notion:searchObjects1':
          converted = convertSearchObjects1(obj);
          break;
        case 'notion:createDataSourceItem':
          converted = convertCreateDataSourceItem(obj);
          break;
        case 'notion:updateADatabaseItem':
          converted = convertUpdateADatabaseItem(obj);
          break;
        case 'notion:getADatabaseItem':
          converted = convertGetADatabaseItem(obj);
          break;
        default:
          converted = obj;
      }
      // Modülün alt objeleri de dönüştür (örn. routes içindeki flow'lar)
      const result = {};
      for (const [k, v] of Object.entries(converted)) {
        if (k === 'mapper' || k === 'metadata' || k === 'parameters') {
          // Bu key'ler zaten dönüştürüldü, tekrar işleme
          result[k] = v;
        } else {
          result[k] = convertModulesInObject(v);
        }
      }
      return result;
    }

    // Notion modülü değilse, alt objeleri recursive dönüştür
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = convertModulesInObject(v);
    }
    return result;
  }
  return obj;
}

// ─────────────────────────────────────────────
// DOĞRULAMA FONKSİYONLARI
// ─────────────────────────────────────────────

function findAllNotionModules(obj) {
  const results = [];
  if (Array.isArray(obj)) {
    for (const v of obj) results.push(...findAllNotionModules(v));
  } else if (obj !== null && typeof obj === 'object') {
    if (typeof obj.module === 'string' && obj.module.startsWith('notion:')) {
      results.push(obj);
    }
    for (const v of Object.values(obj)) {
      results.push(...findAllNotionModules(v));
    }
  }
  return results;
}

function countPatternInString(str, pattern) {
  const matches = str.match(new RegExp(pattern, 'g'));
  return matches ? matches.length : 0;
}

function validate(originalJson, convertedJson, fileName) {
  const issues = [];
  const info = [];

  // 1. JSON geçerliliği (parse edilebildiği için buradayız)
  info.push('✅ JSON geçerli');

  // 2. "data_source" mapper key kalmamış mı?
  const notionModules = findAllNotionModules(convertedJson);
  const withDataSource = notionModules.filter(m => 'data_source' in (m.mapper || {}));
  if (withDataSource.length > 0) {
    issues.push(`❌ ${withDataSource.length} modülde mapper.data_source hala var: ${withDataSource.map(m => m.module).join(', ')}`);
  } else {
    info.push('✅ Hiçbir Notion modülünde mapper.data_source kalmadı');
  }

  // 3. Orijinalinde data_source olan her modülde database'e çevrilmiş mi?
  const origNotionModules = findAllNotionModules(originalJson);
  const origWithDataSource = origNotionModules.filter(m => 'data_source' in (m.mapper || {}));
  const convWithoutDatabase = notionModules.filter((m, i) => {
    // Orijinalinde data_source varsa converted'da database olmalı
    const orig = origNotionModules[i];
    return orig && 'data_source' in (orig.mapper || {}) && !('database' in (m.mapper || {}));
  });
  if (convWithoutDatabase.length > 0) {
    issues.push(`❌ ${convWithoutDatabase.length} modülde data_source→database dönüşümü eksik: ${convWithoutDatabase.map(m => m.module).join(', ')}`);
  } else {
    info.push(`✅ Tüm data_source'lar database'e çevrildi (${origWithDataSource.length} modül)`);
  }

  // 4. notion:createDataSourceItem modül adı korunmuş mu?
  const createDSModules = notionModules.filter(m => m.module === 'notion:createDataSourceItem');
  const wrongCreate = notionModules.filter(m => m.module === 'notion:createADatabaseItem');
  if (wrongCreate.length > 0) {
    issues.push(`❌ ${wrongCreate.length} adet yanlış notion:createADatabaseItem var (createDataSourceItem olmalı)`);
  } else {
    info.push(`✅ notion:createDataSourceItem modül adı korundu (${createDSModules.length} modül)`);
  }

  // 5. Formül sayısı aynı mı?
  const origStr = JSON.stringify(originalJson);
  const convStr = JSON.stringify(convertedJson);
  const origFormulas = countPatternInString(origStr, '\\{\\{[^}]+\\}\\}');
  const convFormulas = countPatternInString(convStr, '\\{\\{[^}]+\\}\\}');
  if (origFormulas !== convFormulas) {
    issues.push(`❌ Formül sayısı değişti: orijinal=${origFormulas}, dönüştürülmüş=${convFormulas}`);
  } else {
    info.push(`✅ Formül sayısı aynı: ${origFormulas}`);
  }

  // 6. Property ID sayısı aynı mı? (VqEM, WLSA, fAwD gibi kısa ID'ler)
  const PROP_IDS = ['VqEM', 'WLSA', 'fAwD', 'Sru%3D', '_%3FiL', 'mht%7C', 'xUZ%7D'];
  for (const pid of PROP_IDS) {
    const origCount = countPatternInString(origStr, pid.replace('%', '\\%'));
    const convCount = countPatternInString(convStr, pid.replace('%', '\\%'));
    if (origCount !== convCount) {
      issues.push(`❌ Property ID "${pid}" sayısı değişti: orijinal=${origCount}, dönüştürülmüş=${convCount}`);
    }
  }
  const changedPropIds = PROP_IDS.filter(pid => {
    const esc = pid.replace('%', '\\%');
    return countPatternInString(origStr, esc) !== countPatternInString(convStr, esc);
  });
  if (changedPropIds.length === 0) {
    info.push(`✅ Property ID sayıları aynı (${PROP_IDS.join(', ')})`);
  }

  // 7. Status değerleri aynı mı?
  const STATUS_VALS = ['Active', 'Error', 'Setup Issue'];
  let statusOk = true;
  for (const sv of STATUS_VALS) {
    const origCount = countPatternInString(origStr, `"${sv}"`);
    const convCount = countPatternInString(convStr, `"${sv}"`);
    if (origCount !== convCount) {
      issues.push(`❌ Status "${sv}" sayısı değişti: orijinal=${origCount}, dönüştürülmüş=${convCount}`);
      statusOk = false;
    }
  }
  if (statusOk) {
    info.push('✅ Status değerleri aynı (Active, Error, Setup Issue)');
  }

  // 8. Toplam Notion modül sayısı aynı mı?
  const origModules = findAllNotionModules(originalJson);
  const origCount = origModules.length;
  const convCount = notionModules.length;
  if (origCount !== convCount) {
    issues.push(`❌ Notion modül sayısı değişti: orijinal=${origCount}, dönüştürülmüş=${convCount}`);
  } else {
    info.push(`✅ Notion modül sayısı aynı: ${convCount}`);
  }

  return { issues, info };
}

// ─────────────────────────────────────────────
// ANA AKIŞ
// ─────────────────────────────────────────────

function main() {
  console.log('='.repeat(60));
  console.log('Blueprint Dönüşüm Scripti — Data Source → Database Legacy');
  console.log('='.repeat(60));
  console.log();

  // blueprints-converted/ klasörünü oluştur
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Oluşturuldu: blueprints-converted/\n`);
  }

  const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.json')).sort();

  let totalOrigModules = 0;
  let totalConvModules = 0;
  let totalIssues = 0;
  let allFilesOk = true;

  for (const file of files) {
    const inputPath = path.join(INPUT_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file);

    console.log(`─── ${file} ${'─'.repeat(50 - file.length)}`);

    // Oku ve parse et
    const rawContent = fs.readFileSync(inputPath, 'utf-8');
    const originalJson = JSON.parse(rawContent);

    // Dönüştür
    const convertedJson = convertModulesInObject(originalJson);

    // Orijinal modül dağılımı
    const origModules = findAllNotionModules(originalJson);
    const convModules = findAllNotionModules(convertedJson);

    const origCounts = {};
    for (const m of origModules) origCounts[m.module] = (origCounts[m.module] || 0) + 1;
    const convCounts = {};
    for (const m of convModules) convCounts[m.module] = (convCounts[m.module] || 0) + 1;

    console.log(`  Orijinal modüller: ${JSON.stringify(origCounts)}`);
    console.log(`  Dönüştürülmüş modüller: ${JSON.stringify(convCounts)}`);

    totalOrigModules += origModules.length;
    totalConvModules += convModules.length;

    // Doğrulama
    const { issues, info } = validate(originalJson, convertedJson, file);
    for (const msg of info) console.log(`  ${msg}`);
    for (const msg of issues) console.log(`  ${msg}`);

    if (issues.length > 0) {
      totalIssues += issues.length;
      allFilesOk = false;
    }

    // Yaz
    fs.writeFileSync(outputPath, JSON.stringify(convertedJson, null, 2), 'utf-8');
    console.log(`  💾 Yazıldı: blueprints-converted/${file}`);
    console.log();
  }

  // Özet
  console.log('='.repeat(60));
  console.log('ÖZET');
  console.log('='.repeat(60));
  console.log(`İşlenen dosya sayısı : ${files.length}`);
  console.log(`Orijinal Notion modül toplamı : ${totalOrigModules}`);
  console.log(`Dönüştürülmüş Notion modül toplamı: ${totalConvModules}`);
  console.log(`Toplam sorun sayısı  : ${totalIssues}`);
  console.log();

  if (allFilesOk) {
    console.log('🎉 TÜM DÖNÜŞÜMLER BAŞARILI! blueprints-converted/ kullanıma hazır.');
  } else {
    console.log('⚠️  Bazı dosyalarda sorun tespit edildi. Yukarıdaki ❌ mesajlarını inceleyin.');
    process.exit(1);
  }
}

main();
