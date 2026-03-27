/**
 * Script: Import historical CSV data into segment_averages table
 *
 * Reads the LIFEPLANNER historical responses CSV, calculates average scores
 * per demographic segment (gender, generation, partner, children) per life area,
 * and outputs SQL INSERT statements.
 *
 * Usage:
 *   npx tsx scripts/import-segment-averages.ts > supabase/seed-segments.sql
 *   -- Then run the SQL against your Supabase database
 *
 * Or pipe directly:
 *   npx tsx scripts/import-segment-averages.ts | psql $DATABASE_URL
 */

import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";

// ── Config ──────────────────────────────────────────────────────────
const CSV_PATH =
  process.argv[2] ||
  "/mnt/c/Users/LIFEPLANNER/Downloads/TESTS LIFEPLANNER HISTORICO RESPUESTAS-LISTA.csv";

// Area codes mapped to question columns (1-indexed in CSV header)
// CSV columns: 1,2,3 = Financial; 4,5,6 = Health; 7,8,9 = Family; etc.
const AREA_QUESTIONS: Record<string, string[]> = {
  financial: ["1", "2", "3"],
  health: ["4", "5", "6"],
  family: ["7", "8", "9"],
  relationship: ["10", "11", "12"],
  spiritual: ["13", "14", "15"],
  professional: ["16", "17", "18"],
  social: ["19", "20", "21"],
  leisure: ["22", "23", "24"],
};

// Generation from birth year
function getGeneration(birthYear: number): string | null {
  if (birthYear >= 1997) return "Gen Z";
  if (birthYear >= 1981) return "Millennial";
  if (birthYear >= 1965) return "Gen X";
  if (birthYear >= 1946) return "Boomer";
  if (birthYear >= 1928) return "Silent";
  return null;
}

// Normalize gender
function normalizeGender(raw: string): string | null {
  const g = raw.trim().toLowerCase();
  if (g === "hombre") return "Hombre";
  if (g === "mujer") return "Mujer";
  if (g === "no binario") return "No binario";
  if (g === "otro" || g === "prefiero no responder") return "Otro";
  return null;
}

// ── Main ────────────────────────────────────────────────────────────
const raw = fs.readFileSync(CSV_PATH, "utf-8");

// Remove BOM if present
const clean = raw.replace(/^\uFEFF/, "");

const records = parse(clean, {
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true,
  relax_quotes: true,
  trim: true,
});

console.error(`Parsed ${records.length} records from CSV`);

// Accumulator: segmentKey -> areaCode -> { total, count }
type Accumulator = Record<string, Record<string, { total: number; count: number }>>;
const acc: Accumulator = {};

let skipped = 0;

for (const row of records) {
  const gender = normalizeGender(row["Género"] || "");
  const birthYear = parseInt(row["Año de Nacimiento"], 10);
  const generation = row["GENERACION"]?.trim() || getGeneration(birthYear);
  const hasPartner = (row["Pareja Sentimental"] || "").trim().toLowerCase() === "si";
  const hasChildren = (row["¿Tienes hijos?"] || "").trim().toLowerCase() === "si";

  // Normalize generation name from CSV
  let gen = generation;
  if (gen === "Baby Boomer") gen = "Boomer";

  if (!gender || !gen) {
    skipped++;
    continue;
  }

  const segmentKey = `${gender}|${gen}|${hasPartner}|${hasChildren}`;

  if (!acc[segmentKey]) acc[segmentKey] = {};

  for (const [areaCode, questionCols] of Object.entries(AREA_QUESTIONS)) {
    let areaTotal = 0;
    let validAnswers = 0;

    for (const col of questionCols) {
      const val = parseInt(row[col], 10);
      if (val >= 1 && val <= 5) {
        areaTotal += val;
        validAnswers++;
      }
    }

    if (validAnswers === 3) {
      const avg = areaTotal / 3;
      if (!acc[segmentKey][areaCode]) {
        acc[segmentKey][areaCode] = { total: 0, count: 0 };
      }
      acc[segmentKey][areaCode].total += avg;
      acc[segmentKey][areaCode].count += 1;
    }
  }
}

console.error(`Skipped ${skipped} records (missing gender/generation)`);

// ── Generate SQL ────────────────────────────────────────────────────
console.log("-- ============================================");
console.log("-- Seed: segment_averages from historical CSV");
console.log(`-- Generated: ${new Date().toISOString()}`);
console.log(`-- Source records: ${records.length} (skipped: ${skipped})`);
console.log("-- ============================================");
console.log("");
console.log("delete from public.segment_averages;");
console.log("");

let insertCount = 0;

for (const [segmentKey, areas] of Object.entries(acc)) {
  const [gender, generation, hasPartnerStr, hasChildrenStr] = segmentKey.split("|");
  const hasPartner = hasPartnerStr === "true";
  const hasChildren = hasChildrenStr === "true";

  for (const [areaCode, data] of Object.entries(areas)) {
    if (data.count === 0) continue;
    const avgScore = (data.total / data.count).toFixed(2);

    const escaped = (s: string) => s.replace(/'/g, "''");

    console.log(
      `insert into public.segment_averages (gender, generation, has_partner, has_children, area_code, avg_score, total_score, sample_size) values ('${escaped(gender)}', '${escaped(generation)}', ${hasPartner}, ${hasChildren}, '${areaCode}', ${avgScore}, ${data.total.toFixed(2)}, ${data.count});`
    );
    insertCount++;
  }
}

console.log("");
console.log(`-- Total rows inserted: ${insertCount}`);
console.error(`Generated ${insertCount} INSERT statements`);
