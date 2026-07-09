#!/usr/bin/env node
/**
 * Tagora — Sticker Print Batch Generator
 *
 * Her sticker için unique Base62 token + QR kod üretir, template SVG'ye
 * enjekte eder, output klasörüne yazar. Manifest CSV ile beraber üreticiye
 * gönderilmeye hazır ZIP.
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
 * Insert olmadan sadece dosya + CSV üretir (test / preview için).
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import QRCode from "qrcode";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TEMPLATES_DIR = join(ROOT, "design", "stickers");
const OUTPUT_ROOT = join(ROOT, "output", "print-batches");

// =============================================================================
// USE CASE CONFIG
// =============================================================================
// Her SKU için: template dosyası + QR yerleşim koordinatları + boyut
// 5×5 template beyaz kart: x=35, y=55, w=170, h=115 → merkez (120, 112.5)
// 3×3 template beyaz kart: x=20, y=35, w=140, h=105 → merkez (90, 87.5)
const CONFIGS = {
  vehicle: {
    template: "sticker-vehicle-5x5.svg",
    size: "5x5",
    sku: "TAG-VEHICLE-5",
    placeholderTranslate: "translate(50, 68)",
    // QR square 105 unit, kart merkez (120, 112.5) → sol üst köşe (67.5, 60)
    qrSlot: { x: 67.5, y: 60, size: 105 },
  },
  door: {
    template: "sticker-door-5x5.svg",
    size: "5x5",
    sku: "TAG-DOOR-5",
    placeholderTranslate: "translate(50, 68)",
    qrSlot: { x: 67.5, y: 60, size: 105 },
  },
  luggage: {
    template: "sticker-luggage-5x5.svg",
    size: "5x5",
    sku: "TAG-LUGGAGE-5",
    placeholderTranslate: "translate(50, 68)",
    qrSlot: { x: 67.5, y: 60, size: 105 },
  },
  pet: {
    template: "sticker-pet-3x3.svg",
    size: "3x3",
    sku: "TAG-PET-3",
    placeholderTranslate: "translate(30, 45)",
    // QR square 92 unit, kart merkez (90, 87.5) → sol üst köşe (44, 41.5)
    qrSlot: { x: 44, y: 41.5, size: 92 },
  },
  bike: {
    template: "sticker-bike-3x3.svg",
    size: "3x3",
    sku: "TAG-BIKE-3",
    placeholderTranslate: "translate(30, 45)",
    qrSlot: { x: 44, y: 41.5, size: 92 },
  },
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
// SVG QR INJECTOR
// =============================================================================

/**
 * Balanced SVG group finder — nested <g> içeren gruplar için depth-tracking
 * ile outer </g>'yi bulur.
 * @returns {{ startIdx: number, endIdx: number } | null}
 */
function findGroupRange(svg, startTagPattern) {
  const startIdx = svg.indexOf(startTagPattern);
  if (startIdx === -1) return null;

  let i = startIdx + startTagPattern.length;
  let depth = 1;

  while (i < svg.length && depth > 0) {
    // Bir sonraki <g veya </g> — hangisi önce?
    const nextOpen = svg.indexOf("<g", i);
    const nextClose = svg.indexOf("</g>", i);

    if (nextClose === -1) return null;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      // Yeni bir <g> açıldı — depth artır
      depth++;
      i = nextOpen + 2;
    } else {
      // </g> önce — depth azalt
      depth--;
      i = nextClose + 4; // "</g>" 4 karakter
    }
  }

  if (depth !== 0) return null;
  return { startIdx, endIdx: i };
}

/**
 * QR SVG üretir, template'e enjekte eder.
 * @param {string} template - Template SVG içeriği
 * @param {string} url - QR'a encode edilecek URL
 * @param {object} slot - { x, y, size } — QR yerleşim yeri (SVG units)
 * @param {string} placeholderPattern - Değiştirilecek placeholder blok
 * @returns {Promise<string>} Yeni SVG içeriği
 */
async function injectQR(template, url, slot, placeholderPattern) {
  // qrcode kütüphanesi ile standalone SVG üret
  const qrSvg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 0,
    color: {
      dark: "#0F1B3D",
      light: "#FFFFFF00", // transparent
    },
  });

  // qrcode kütüphanesinin çıktısından viewBox + path'i extract et.
  // Örnek: '<svg xmlns=... viewBox="0 0 33 33" ...><path d="..." fill="#0F1B3D"/></svg>'
  // QR modül grid'i version'a göre 21×21..37×37 arası değişir.
  const viewBoxMatch = qrSvg.match(/viewBox="([^"]+)"/u);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 33 33";
  const pathMatch = qrSvg.match(/<path[^>]*d="[^"]+"[^/]*\/>/u);
  if (!pathMatch) {
    throw new Error("QR SVG'den path extract edilemedi");
  }
  const qrPath = pathMatch[0];

  // Balanced parser ile placeholder <g>'yi bul (nested <g> içerse bile)
  const startTag = `<g transform="${placeholderPattern}">`;
  const range = findGroupRange(template, startTag);
  if (!range) {
    throw new Error(
      `Placeholder pattern bulunamadı: ${placeholderPattern}. Template SVG'yi kontrol et.`,
    );
  }

  // Nested SVG ile insert — viewBox otomatik scale eder path'i slot boyutuna
  const replacement =
    `<svg x="${slot.x}" y="${slot.y}" ` +
    `width="${slot.size}" height="${slot.size}" ` +
    `viewBox="${viewBox}" role="img" aria-label="QR code">${qrPath}</svg>`;

  return (
    template.slice(0, range.startIdx) +
    replacement +
    template.slice(range.endIdx)
  );
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
// SUPABASE INSERT
// =============================================================================
/**
 * Design slug → id resolver
 */
async function resolveDesignId(supabase, slug) {
  const { data, error } = await supabase
    .from("sticker_designs")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Design fetch hatası: ${error.message}`);
  if (!data) throw new Error(`Design bulunamadı: slug='${slug}'. Geçerli slug'lar: split, fresh, ocean, classic`);
  return data;
}

async function insertTokensToDb(tokens, useCase, designSlug) {
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

  // Design slug → id resolve
  const design = await resolveDesignId(supabase, designSlug);
  console.log(`   🎨 Design: ${design.name} (${designSlug})`);

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

async function insertBatchRecord({ name, useCase, sku, size, count, outputDir }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from("print_batches").insert({
    name,
    use_case: useCase,
    sku,
    size,
    count,
    output_dir: outputDir,
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

  // Insert için env değişkenleri gerekli
  if (doInsert) {
    await loadEnv();
  }

  if (!useCase || !countStr) {
    console.error("Kullanım: node scripts/generate-print-batch.mjs <use_case> <count> [--design <slug>] [--insert]");
    console.error("use_case: vehicle | door | luggage | pet | bike");
    console.error("design:   split | fresh | ocean | classic (varsayılan: classic)");
    process.exit(1);
  }

  const config = CONFIGS[useCase];
  if (!config) {
    console.error(`Bilinmeyen use_case: ${useCase}. Geçerli: ${Object.keys(CONFIGS).join(", ")}`);
    process.exit(1);
  }

  const count = parseInt(countStr, 10);
  if (!Number.isFinite(count) || count < 1 || count > 100000) {
    console.error("count 1 ile 100000 arası olmalı.");
    process.exit(1);
  }

  const date = new Date().toISOString().slice(0, 10);
  const batchName = `${date}-${useCase}-${count}`;
  const outputDir = join(OUTPUT_ROOT, batchName);
  await mkdir(outputDir, { recursive: true });

  console.log(`\n🎨 Tagora Sticker Batch Generator`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Use case:    ${useCase} (${config.sku}, ${config.size})`);
  console.log(`Design:      ${designSlug}${doInsert ? "" : " (DB insert yok, sadece dosya)"}`);
  console.log(`Adet:        ${count}`);
  console.log(`Output:      ${outputDir}\n`);

  // Template'i yükle
  const templatePath = join(TEMPLATES_DIR, config.template);
  const template = await readFile(templatePath, "utf-8");

  // Token'ları üret
  console.log(`⚙️  Token üretiliyor...`);
  const tokens = generateStickerTokenBatch(count);

  // Her token için SVG üret
  console.log(`⚙️  QR + SVG oluşturuluyor...`);
  const manifest = [
    "token,url,use_case,sku,size,filename",
  ];

  const padWidth = String(count).length;
  let done = 0;

  for (const token of tokens) {
    const url = `https://tagora.link/s/${token}`;
    const svg = await injectQR(
      template,
      url,
      config.qrSlot,
      config.placeholderTranslate,
    );

    const filename = `${config.sku}-${String(++done).padStart(padWidth, "0")}-${token}.svg`;
    await writeFile(join(outputDir, filename), svg, "utf-8");
    manifest.push(`${token},${url},${useCase},${config.sku},${config.size},${filename}`);

    if (done % 100 === 0 || done === count) {
      process.stdout.write(`\r    ${done} / ${count}`);
    }
  }
  process.stdout.write("\n");

  // Manifest yaz
  await writeFile(join(outputDir, "manifest.csv"), manifest.join("\n"), "utf-8");

  // README yaz — üretici için talimat
  const readme = `# Tagora Print Batch — ${batchName}

## Batch Info
- **Use Case:** ${useCase}
- **SKU:** ${config.sku}
- **Boyut:** ${config.size} cm (${config.size === "5x5" ? "50×50 mm" : "30×30 mm"})
- **Adet:** ${count}
- **Oluşturulma:** ${date}

## Dosyalar
- \`${config.sku}-XXXX-<token>.svg\` — Her sticker için ayrı, unique QR ile
- \`manifest.csv\` — Token + URL + filename mapping (arşiv için)

## Üretici için notlar
- SVG'ler print-ready: viewBox belirtildi, width mm cinsinden set edildi
- Bleed 3mm (5×5) veya 2mm (3×3) eklenmeli — üretici export sırasında ekler
- Renk: RGB olarak SVG'de — CMYK dönüşümü üretici tarafında (Navy #0F1B3D → Pantone 289C yaklaşık)
- Malzeme: Matte outdoor vinyl, UV korumalı 5+ yıl (bkz. design/stickers/sticker-brief.md)
- QR test: Random 10 sticker mobile QR reader ile test edilmeli — hepsi \`tagora.link/s/<token>\`'a git.mel

## İletişim
omer@complify.io — Ömer Kılınç, Tagora
`;
  await writeFile(join(outputDir, "README.md"), readme, "utf-8");

  console.log(`\n✅ Batch hazır:`);
  console.log(`   📁 ${outputDir}`);
  console.log(`   📄 ${count} SVG + manifest.csv + README.md`);

  if (doInsert) {
    console.log(`\n⚙️  Supabase'e insert ediliyor...`);
    try {
      const { insertedCount, errors } = await insertTokensToDb(tokens, useCase, designSlug);
      if (errors.length > 0) {
        console.log(`\n⚠️  ${errors.length} chunk hata verdi:`);
        errors.forEach((e) => console.log(`   • ${e}`));
      }
      console.log(`\n✅ ${insertedCount} / ${count} sticker DB'ye insert edildi.`);
      console.log(`   status='manufactured' · use_case='${useCase}' · design='${designSlug}'`);

      // Batch kaydı da ekle
      await insertBatchRecord({
        name: batchName,
        useCase,
        sku: config.sku,
        size: config.size,
        count,
        outputDir,
      });
      console.log(`\n📦 Batch kaydı eklendi: ${batchName}`);

      console.log(`\n💡 Sonraki adım: SVG'leri üretici ile paylaş (ZIP olarak).`);
    } catch (e) {
      console.error(`\n❌ DB insert başarısız: ${e.message}`);
      console.error(`   SVG'ler oluşturuldu ama DB'de yoklar. Sticker'lar taranırsa 404 alınır.`);
      console.error(`   Fix'ten sonra tekrar dene: node scripts/generate-print-batch.mjs ${useCase} ${count} --insert`);
      process.exit(1);
    }
  } else {
    console.log(`\n💡 Bu preview batch (DB'ye insert YAPILMADI).`);
    console.log(`   Production için: node scripts/generate-print-batch.mjs ${useCase} ${count} --design ${designSlug} --insert`);
    console.log(`   Insert olmadan sticker taranırsa "sticker bulunamadı" hatası döner.`);
  }

  console.log("");
}

main().catch((e) => {
  console.error("\n❌ Hata:", e.message);
  process.exit(1);
});
