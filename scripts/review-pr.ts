// Skript för att granska en PR (eller git diff/fil) med AI-riggens regler från docs/standard.md och .claude/agents/pr-reviewer.md
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

interface Finding {
  severity: "BLOCKER" | "WARNING" | "NOTE";
  rule: string;
  file?: string;
  line?: number;
  message: string;
  suggestion?: string;
}

export function reviewDiff(diffText: string): Finding[] {
  const findings: Finding[] = [];
  const lines = diffText.split("\n");

  let currentFile = "";
  let currentLineNumber = 0;

  for (const line of lines) {
    if (line.startsWith("+++ b/")) {
      currentFile = line.replace("+++ b/", "").trim();
      continue;
    }

    if (line.startsWith("@@")) {
      const match = line.match(/\+(\d+)/);
      if (match) {
        currentLineNumber = parseInt(match[1], 10) - 1;
      }
      continue;
    }

    if (!line.startsWith("+") || line.startsWith("+++")) {
      if (!line.startsWith("-")) {
        currentLineNumber++;
      }
      continue;
    }

    currentLineNumber++;
    const addedContent = line.substring(1);

    // 1. Säkerhet: SQL Injection (OWASP A03)
    if (/\.query\s*\(\s*`[^`]*\$\{/.test(addedContent) || /\.query\s*\([^,)]*\+/.test(addedContent)) {
      findings.push({
        severity: "BLOCKER",
        rule: "Säkerhet: SQL Injection",
        file: currentFile,
        line: currentLineNumber,
        message: "SQL byggs med strängmall eller konkatenering. Detta möjliggör SQL-injektion.",
        suggestion: "Använd parametriserade frågor ($1, $2) och skicka värden i en array som andra argument till query().",
      });
    }

    // 2. Säkerhet: BOLA/IDOR (OWASP A01)
    if (
      currentFile.includes("routes") &&
      /req\.(body|query|params)\.customerId/.test(addedContent)
    ) {
      findings.push({
        severity: "BLOCKER",
        rule: "Säkerhet: BOLA / Otillåten åtkomst",
        file: currentFile,
        line: currentLineNumber,
        message: "customerId läses från request body/query/params istället för den verifierade sessionen.",
        suggestion: "Använd requireCustomer middleware och läs (req as AuthedRequest).customerId.",
      });
    }

    // 3. docs/standard.md: Result-mönster i tjänstelagret
    if (currentFile.includes("services") && /\bthrow\s+new\s+Error\b/.test(addedContent)) {
      findings.push({
        severity: "BLOCKER",
        rule: "Standard: Felhantering med Result",
        file: currentFile,
        line: currentLineNumber,
        message: "Tjänstelagret kastar fel med throw new Error istället för att returnera Result (ok/err).",
        suggestion: "Returnera err('invalid_input' | 'not_found' | 'forbidden' | 'conflict', meddelande).",
      });
    }

    // 4. docs/standard.md: Flyttal för pengar
    if (/\bparseFloat\s*\(/.test(addedContent)) {
      findings.push({
        severity: "BLOCKER",
        rule: "Standard: Pengar får inte hanteras som flyttal",
        file: currentFile,
        line: currentLineNumber,
        message: "parseFloat används för valuta eller priser, vilket ger avrundningsfel.",
        suggestion: "Behåll belopp som NUMERIC i databasen och returnera strängar med två decimaler.",
      });
    }

    // 5. docs/standard.md: PII i loggar
    if (/\bconsole\.(log|info)\s*\([^)]*(email|kund|namn|password|token)/i.test(addedContent)) {
      findings.push({
        severity: "BLOCKER",
        rule: "Standard: Inga personuppgifter eller hemligheter i loggar",
        file: currentFile,
        line: currentLineNumber,
        message: "Möjlig loggning av personuppgifter (PII) eller hemligheter identifierad.",
        suggestion: "Ta bort loggningen eller maskera känsliga fält.",
      });
    }

    // 6. docs/standard.md: Inga överhoppade tester
    if (
      currentFile.includes("tests") &&
      (/\b(it|test|describe)\.skip\b/.test(addedContent) || /\b(xit|xtest)\b/.test(addedContent))
    ) {
      findings.push({
        severity: "BLOCKER",
        rule: "Standard: Tester får inte hoppas över",
        file: currentFile,
        line: currentLineNumber,
        message: "Test har markerats med .skip / xit / xtest.",
        suggestion: "Åtgärda problemet i koden eller testet så att alla tester passerar grönt.",
      });
    }
  }

  return findings;
}

function main(): void {
  const arg = process.argv[2];
  let diff = "";

  if (arg && existsSync(arg)) {
    diff = readFileSync(arg, "utf8");
    console.info(`Läser diff från fil: ${arg}`);
  } else if (arg) {
    // Git ref/branch
    try {
      diff = execSync(`git diff ${arg}`, { encoding: "utf8" });
      console.info(`Körde git diff ${arg}`);
    } catch {
      console.error(`Kunde inte köra git diff ${arg}`);
      process.exit(1);
    }
  } else {
    // Git diff mot main eller senaste commit
    try {
      diff = execSync("git diff HEAD~1", { encoding: "utf8" });
      console.info("Granskar senaste commit via git diff HEAD~1");
    } catch {
      console.info("Ingen git-historik för HEAD~1, kör git diff mot staged/working tree");
      diff = execSync("git diff HEAD", { encoding: "utf8" });
    }
  }

  const findings = reviewDiff(diff);

  console.info("\n=== GRANSKNINGSRAPPORT (AI PR-Reviewer) ===\n");
  if (findings.length === 0) {
    console.info("✓ Inga regelöverträdelser eller blockerande säkerhetsrisker hittades i diffen.");
  } else {
    console.info(`Hittade ${findings.length} anmärkningar:\n`);
    for (const f of findings) {
      console.info(`[${f.severity}] ${f.rule}`);
      if (f.file) console.info(`  Plats: ${f.file}:${f.line ?? 0}`);
      console.info(`  Problem: ${f.message}`);
      if (f.suggestion) console.info(`  Åtgärd:  ${f.suggestion}`);
      console.info("");
    }
  }
}

if (require.main === module) {
  main();
}
