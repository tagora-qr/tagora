#!/usr/bin/env node
/**
 * Batch sticker token generator.
 *
 * Üretici için unique QR token'larını CSV olarak çıkarır.
 * Backend'e de upsert eder (önce SUPABASE_SERVICE_ROLE_KEY env ile login).
 *
 * Kullanım:
 *   node scripts/generate-tokens.mjs 5000           # 5K token CSV'ye yaz
 *   node scripts/generate-tokens.mjs 5000 --insert  # CSV + DB'ye insert
 *
 * .env.local dosyasını otomatik yükler.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------- .env.local yükle ----------
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Kaldır quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

// ---------- Token generator (inline; TS import Node ESM'de sorunlu) ----------
const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
function getBytes(n) {
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  return buf;
}
function generateBase62(length) {
  const out = [];
  const max = 256 - (256 % 62);
  while (out.length < length) {
    const bytes = getBytes(length * 2);
    for (let i = 0; i < bytes.length && out.length < length; i++) {
      const b = bytes[i];
      if (b >= max) continue;
      out.push(BASE62[b % 62]);
    }
  }
  return out.join("");
}
function generateStickerTokenBatch(count) {
  const tokens = new Set();
  while (tokens.size < count) tokens.add(generateBase62(10));
  return [...tokens];
}

const count = parseInt(process.argv[2] ?? "100", 10);
const shouldInsert = process.argv.includes("--insert");

if (!Number.isFinite(count) || count < 1 || count > 100_000) {
  console.error("Usage: node scripts/generate-tokens.mjs <count> [--insert]");
  console.error("count: 1 ile 100.000 arası olmalı");
  process.exit(1);
}

console.log(`🔢 ${count} adet sticker token üretiliyor…`);

const tokens = generateStickerTokenBatch(count);

const csvRows = ["token,qr_url"];
// Scanner URL — kısa domain (tagora.link). Sipariş için ayrı ana site (tagora.com.tr) var.
const baseUrl = process.env.SCANNER_URL ?? "https://tagora.link";
for (const token of tokens) {
  csvRows.push(`${token},${baseUrl}/s/${token}`);
}

const outPath = path.join(__dirname, "..", `tokens-batch-${Date.now()}.csv`);
fs.writeFileSync(outPath, csvRows.join("\n"));
console.log(`✅ CSV yazıldı: ${outPath}`);

if (shouldInsert) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY env gerekli.");
    process.exit(1);
  }

  // Supabase REST API (PostgREST) ile direkt insert — supabase-js bağımlılığı yok
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/stickers`;
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };

  // Chunk insert (PostgREST 1000 satır limit; güvenli 500)
  const chunkSize = 500;
  let inserted = 0;
  for (let i = 0; i < tokens.length; i += chunkSize) {
    const chunk = tokens.slice(i, i + chunkSize).map((token) => ({
      token,
      status: "manufactured",
    }));
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(chunk),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`❌ Insert hatası @${i} (HTTP ${res.status}):`, text);
      process.exit(1);
    }
    inserted += chunk.length;
    console.log(`  → ${inserted}/${tokens.length} insert edildi`);
  }
  console.log(`✅ DB'ye ${inserted} sticker token kaydedildi.`);
}

console.log("\n📋 Sonraki adım:");
console.log("  - Bu CSV'yi sticker üreticisine gönder (Variable Data Printing için)");
console.log("  - Üretici her token için unique QR yapıştıracak");
console.log("  - Sample'da %2 random sampling ile DB match doğrula");
