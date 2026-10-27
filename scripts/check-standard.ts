import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

// Kontrollverktyg för teamets kodstandard i docs/standard.md

interface Violation {
  file: string;
  line: number;
  rule: string;
  message: string;
}

const violations: Violation[] = [];

function walk(dir: string, ext = ".ts"): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== "node_modules" && entry !== "dist") {
        files.push(...walk(full, ext));
      }
    } else if (full.endsWith(ext)) {
      files.push(full);
    }
  }
  return files;
}

const root = path.join(__dirname, "..");
const srcFiles = walk(path.join(root, "src"));
const testFiles = walk(path.join(root, "tests"));

// 1. Kontrollera SQL-parametrisering (docs/standard.md: "All SQL är parametriserad... SQL byggs aldrig med strängmallar eller sammanslagning")
for (const file of srcFiles) {
  const content = readFileSync(file, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, idx) => {
    // Sök efter .query(`...${...}`)
    if (/\.query\s*\(\s*`[^`]*\$\{/.test(line)) {
      violations.push({
        file: path.relative(root, file),
        line: idx + 1,
        rule: "Databas: Parametriserad SQL",
        message: "SQL får inte innehålla strängmallar (${...}). Använd parametrar ($1, $2) och [värden].",
      });
    }

    // Sök efter SQL-sammanslagning med + i query
    if (/\.query\s*\([^,)]*\+/.test(line)) {
      violations.push({
        file: path.relative(root, file),
        line: idx + 1,
        rule: "Databas: Parametriserad SQL",
        message: "SQL får inte slås ihop med '+'. Använd parametrar ($1, $2).",
      });
    }
  });
}

// 2. Kontrollera tester (docs/standard.md: "Ett test tas aldrig bort eller hoppas över för att bli grönt")
for (const file of testFiles) {
  const content = readFileSync(file, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, idx) => {
    if (/\b(it|test|describe)\.skip\b/.test(line) || /\bxit\b|\bxtest\b/.test(line)) {
      violations.push({
        file: path.relative(root, file),
        line: idx + 1,
        rule: "Tester: Inga överhoppade tester",
        message: "Tester får inte hoppas över (.skip / xit / xtest).",
      });
    }
    if (/\b(it|test|describe)\.only\b/.test(line) || /\bfit\b/.test(line)) {
      violations.push({
        file: path.relative(root, file),
        line: idx + 1,
        rule: "Tester: Inga exklusiva tester i commit",
        message: ".only / fit får inte checkas in.",
      });
    }
  });
}

// 3. Kontrollera flyttal för pengar (docs/standard.md: "Belopp räknas aldrig med flyttal")
for (const file of srcFiles) {
  if (file.includes("pricing") || file.includes("services")) {
    const content = readFileSync(file, "utf8");
    const lines = content.split("\n");

    lines.forEach((line, idx) => {
      if (/\bparseFloat\s*\(/.test(line)) {
        violations.push({
          file: path.relative(root, file),
          line: idx + 1,
          rule: "Pengar: Inga flyttal",
          message: "Använd inte parseFloat för priser eller valuta.",
        });
      }
    });
  }
}

if (violations.length > 0) {
  console.error("\x1b[31m%s\x1b[0m", `Hittade ${violations.length} överträdelser mot docs/standard.md:\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} - [${v.rule}]`);
    console.error(`    ${v.message}\n`);
  }
  process.exit(1);
} else {
  console.log("\x1b[32m%s\x1b[0m", "✓ Alla kontroller mot docs/standard.md godkända.");
}
