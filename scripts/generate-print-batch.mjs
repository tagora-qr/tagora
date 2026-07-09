#!/usr/bin/env node
/**
 * Tagora — Sticker Token Batch Generator
 *
 * Sadece token üretir + CSV manifest + Supabase insert (opsiyonel).
 * SVG/QR üretmez — matbaacı kendi tasarımını kullanır, biz sadece token'ları
 * ve tasarım eşleştirmesini yönetiriz.
 *
 * Kullanım:
 *   node scripts/generate-print-batch.mjs <use_case> <count> [--design <slug>] [--insert]
 *
 * Örnekler:
 *   node scripts/generate-print-batch.mjs vehicle 100
 *   node scripts/generate-print-batch.mjs pet 500 --insert
 *   node scripts/generate-print-batch.mjs vehicle 100 --design split --insert
 *
 * --insert flag'i tokenları Supabase'e insert eder (production için).
 * --design <slug> DB'ye insert edilen sticker'lara design_id set eder
 *   (varsayılan: classic). Geçerli slug'lar: split, fresh, ocean, classic
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUTPUT_ROOT = join(ROOT, "output", "print-batches");

// =============================================================================
// USE CASE CONFIG — sadece SKU/size (SVG üretmiyoruz artık)
// =============================================================================
const CONFIGS = {
  vehicle: { sku: "TAG-VEHICLE-5", size: "5x5" },
  door:    { sku: "TAG-DOOR-5",    size: "5x5" },
  luggage: { sku: "TAG-LUGGAGE-5", size: "5x5" },
  pet:     { sku: "TAG-PET-3",     size: "3x3" },
  bike:    { sku: "TAG-BIKE-3",    size: "3x3" },
};

// =============================================================================
// BASE62 TOKEN GENERATOR (packages/shared/src/token.ts ile aynı algoritma)
// =============================================================================
const BASE62_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function generateStickerToken(length = 10) {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += BASE62_ALPHABET[bytes[i] % 62];
  }
  return out;
}

function generateStickerTokenBatch(count) {
  const seen = new Set();
  const tokens = [];
  while (tokens.length < count) {
    const t = generateStickerToken();
    if (!seen.has(t)) {
      seen.add(t);
      tokens.push(t);
    }
  }
  return tokens;
}

// =============================================================================
// ENV LOADER
// =============================================================================
async function loadEnv() {
  try {
    const envText = await readFile(join(ROOT, ".env.local"), "utf-8");
    for (const line of envText.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch (e) {
    console.warn("⚠️  .env.local yüklenemedi:", e.message);
  }
}

// =============================================================================
// SUPABASE HELPERS
// =============================================================================

/**
 * Design slug → { id, name } resolver
 */
async function resolveDesign(supabase, slug) {
  const { data, error } = await supabase
    .from("sticker_designs")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Design fetch hatası: ${error.message}`);
  if (!data) {
    throw new Error(
      `Design bulunamadı: slug='${slug}'. Geçerli slug'lar: split, fresh, ocean, classic`,
    );
  }
  return data;
}

async function insertTokensToDb(supabase, tokens, useCase, design) {
  const rows = tokens.map((token) => ({
    token,
    use_case: useCase,
    status: "manufactured",
    design_id: design.id,
  }));

  // Chunked insert — 500'lük parçalar (Supabase 1000 limit güvenli altında)
  const CHUNK_SIZE = 500;
  let insertedCount = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const { data, error } = await supabase
      .from("stickers")
      .insert(chunk)
      .select("token");

    if (error) {
      errors.push(`Chunk ${i}-${i + chunk.length}: ${error.message}`);
    } else {
      insertedCount += data?.length ?? 0;
      process.stdout.write(`\r    ${insertedCount} / ${tokens.length}`);
    }
  }
  process.stdout.write("\n");

  return { insertedCount, errors };
}

async function insertBatchRecord(supabase, { name, useCase, sku, size, count, outputDir, designSlug }) {
  const { error } = await supabase.from("print_batches").insert({
    name,
    use_case: useCase,
    sku,
    size,
    count,
    output_dir: outputDir,
    // print_batches tablosunda design_id kolonu yok — kaydetmeye çalışmıyoruz.
    // (İleride eklenebilir; şu an batch adında design bilgisi geçiyor.)
  });

  if (error) {
    console.warn(`⚠️  Batch kaydı eklenemedi: ${error.message}`);
  }
}

// =============================================================================
// MAIN
// =============================================================================

/**
 * Parse --design <slug> flag
 */
function parseDesignFlag(flags) {
  const idx = flags.indexOf("--design");
  if (idx === -1) return "classic"; // default
  const slug = flags[idx + 1];
  if (!slug) {
    throw new Error("--design flag'i sonrasında bir slug bekleniyor (örn: --design split)");
  }
  const valid = ["split", "fresh", "ocean", "classic"];
  if (!valid.includes(slug)) {
    throw new Error(`Geçersiz design slug: '${slug}'. Geçerli slug'lar: ${valid.join(", ")}`);
  }
  return slug;
}

async function main() {
  const [useCase, countStr, ...flags] = process.argv.slice(2);
  const doInsert = flags.includes("--insert");
  const designSlug = parseDesignFlag(flags);

  if (!useCase || !countStr) {
    console.error(
      "Kullanım: node scripts/generate-print-batch.mjs <use_case> <count> [--design <slug>] [--insert]",
    );
    console.error("use_case: vehicle | door | luggage | pet | bike");
    console.error("design:   split | fresh | ocean | classic (varsayılan: classic)");
    process.exit(1);
  }

  const config = CONFIGS[useCase];
  if (!config) {
    console.error(
      `Bilinmeyen use_case: ${useCase}. Geçerli: ${Object.keys(CONFIGS).join(", ")}`,
    );
    process.exit(1);
  }

  const count = parseInt(countStr, 10);
  if (!Number.isFinite(count) || count < 1 || count > 100000) {
    console.error("count 1 ile 100000 arası olmalı.");
    process.exit(1);
  }

  // Env yükle (insert için gerekli)
  await loadEnv();

  const date = new Date().toISOString().slice(0, 10);
  const batchName = `${date}-${useCase}-${designSlug}-${count}`;
  const outputDir = join(OUTPUT_ROOT, batchName);
  await mkdir(outputDir, { recursive: true });

  console.log(`\n🎨 Tagora Sticker Batch Generator`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Use case:    ${useCase} (${config.sku}, ${config.size})`);
  console.log(`Design:      ${designSlug}${doInsert ? "" : " (DB insert yok, sadece CSV)"}`);
  console.log(`Adet:        ${count}`);
  console.log(`Output:      ${outputDir}\n`);

  // Design bilgisini önceden çek (insert olmasa da CSV'ye eklemek için)
  let design = { id: null, name: designSlug };
  if (doInsert || process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const supabase = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      try {
        design = await resolveDesign(supabase, designSlug);
      } catch (e) {
        if (doInsert) throw e;
        console.warn(`⚠️  Design fetch atlandı (insert yok): ${e.message}`);
      }
    }
  }

  // Token'ları üret
  console.log(`⚙️  Token üretiliyor...`);
  const tokens = generateStickerTokenBatch(count);
  console.log(`   ${count} unique token oluşturuldu\n`);

  // Manifest CSV yaz
  console.log(`⚙️  CSV manifest yazılıyor...`);
  const manifest = [
    "token,url,use_case,sku,size,design_slug,design_name",
  ];
  for (const token of tokens) {
    const url = `https://tagora.link/s/${token}`;
    manifest.push(
      `${token},${url},${useCase},${config.sku},${config.size},${designSlug},"${design.name}"`,
    );
  }
  await writeFile(join(outputDir, "manifest.csv"), manifest.join("\n"), "utf-8");
  console.log(`   ✓ manifest.csv (${count} satır)\n`);

  // README yaz — matbaacı için talimat
  const readme = `# Tagora Print Batch — ${batchName}

## Batch Info
- **Use Case:** ${useCase}
- **SKU:** ${config.sku}
- **Boyut:** ${config.size} cm (${config.size === "5x5" ? "50×50 mm" : "30×30 mm"})
- **Design:** ${design.name} (${designSlug})
- **Adet:** ${count}
- **Oluşturulma:** ${date}

## Dosyalar
- \`manifest.csv\` — Token + URL + design mapping (matbaacıya + arşive)

## Matbaacı için notlar
- Tasarım dosyaları ayrıca sağlanır (Illustrator AI/PDF): \`${designSlug}\` şablonu
- QR kod her sticker için farklı: URL sütununu her sticker'a benzersiz olarak yerleştir
- Materyal: Matte outdoor vinyl, UV korumalı 5+ yıl (bkz. design/stickers/sticker-brief.md)
- Renk: Navy #0F1B3D → Pantone 289C, Accent #D4F36A → Pantone 388C
- QR test: Random 10 sticker mobile QR reader ile test edilmeli — hepsi \`tagora.link/s/<token>\`'a gitmeli

## İletişim
omer@complify.io — Ömer Kılınç, Tagora
`;
  await writeFile(join(outputDir, "README.md"), readme, "utf-8");

  console.log(`✅ Batch dosyaları hazır:`);
  console.log(`   📁 ${outputDir}`);
  console.log(`   📄 manifest.csv + README.md`);

  if (doInsert) {
    console.log(`\n⚙️  Supabase'e insert ediliyor...`);
    console.log(`   🎨 Design: ${design.name} (${designSlug})`);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        ".env.local'de NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY olmalı.",
      );
    }
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    try {
      const { insertedCount, errors } = await insertTokensToDb(
        supabase,
        tokens,
        useCase,
        design,
      );
      if (errors.length > 0) {
        console.log(`\n⚠️  ${errors.length} chunk hata verdi:`);
        errors.forEach((e) => console.log(`   • ${e}`));
      }
      console.log(`\n✅ ${insertedCount} / ${count} sticker DB'ye insert edildi.`);
      console.log(`   status='manufactured' · use_case='${useCase}' · design='${designSlug}'`);

      // Batch kaydı
      await insertBatchRecord(supabase, {
        name: batchName,
        useCase,
        sku: config.sku,
        size: config.size,
        count,
        outputDir,
        designSlug,
      });
      console.log(`\n📦 Batch kaydı eklendi: ${batchName}`);

      console.log(`\n💡 Sonraki adım: manifest.csv'yi tasarım dosyaları ile matbaaya yolla.`);
    } catch (e) {
      console.error(`\n❌ DB insert başarısız: ${e.message}`);
      console.error(`   Manifest CSV oluşturuldu ama DB'de yoklar.`);
      console.error(
        `   Fix'ten sonra tekrar dene: node scripts/generate-print-batch.mjs ${useCase} ${count} --design ${designSlug} --insert`,
      );
      process.exit(1);
    }
  } else {
    console.log(`\n💡 Bu preview batch (DB'ye insert YAPILMADI).`);
    console.log(
      `   Production için: node scripts/generate-print-batch.mjs ${useCase} ${count} --design ${designSlug} --insert`,
    );
    console.log(`   Insert olmadan sticker taranırsa "sticker bulunamadı" hatası döner.`);
  }

  console.log("");
}

main().catch((e) => {
  console.error("\n❌ Hata:", e.message);
  process.exit(1);
});
