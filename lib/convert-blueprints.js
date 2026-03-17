#!/usr/bin/env node
/**
 * convert-blueprints.js
 *
 * ESKİ SÜRÜM — Artık kullanılmıyor.
 *
 * blueprints/ klasöründeki master JSON dosyaları artık doğrudan
 * API route tarafından okunuyor (app/api/generate/route.js).
 * Modül yapısına hiçbir dönüşüm uygulanmıyor — sadece UUID replace yapılıyor.
 *
 * Bu script artık sadece blueprints/ → blueprints-converted/ kopyalama yapar
 * (herhangi bir yapısal değişiklik YAPMAZ).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INPUT_DIR = path.join(ROOT, 'blueprints');
const OUTPUT_DIR = path.join(ROOT, 'blueprints-converted');

function main() {
  console.log('='.repeat(60));
  console.log('Blueprint Kopyalama (Dönüşüm devre dışı)');
  console.log('='.repeat(60));
  console.log();
  console.log('NOT: API route artık doğrudan blueprints/ klasöründen okuyor.');
  console.log('Bu script sadece geriye dönük uyumluluk için blueprints-converted/ klasörüne kopyalama yapar.');
  console.log();

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.json')).sort();

  for (const file of files) {
    const inputPath = path.join(INPUT_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file);
    fs.copyFileSync(inputPath, outputPath);
    console.log(`  📋 Kopyalandı: blueprints/${file} → blueprints-converted/${file}`);
  }

  console.log();
  console.log(`✅ ${files.length} dosya kopyalandı. Hiçbir yapısal değişiklik yapılmadı.`);
}

main();
