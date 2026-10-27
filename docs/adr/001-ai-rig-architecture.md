# 1. Arkitektur för AI-rigg och automatiserad kvalitetskontroll

Date: 2026-10-27  
Status: Godkänd (Accepted)

## Sammanhang och problemställning
Projektet "butikens API" ingår i delkursen *AI-assisterad systemutveckling*. Kodbasen hade ursprungligen en skriftlig kodstandard i `docs/standard.md`, men inga av reglerna kontrollerades automatiskt. Dessutom saknades AI-verktyg, subagenter och strukturerade instruktioner för att stödja utveckling, testning, kodgranskning och modernisering av legacy-kod.

## Beslut
Vi har etablerat en AI-utvecklingsrigg och automatiserad kvalitetskontroll med följande komponenter:

1. **Automatiserade standardkontroller (`scripts/check-standard.ts`):**
   - Skript som kontrollerar att SQL-frågor aldrig byggs med strängmallar eller konkatenering (`+`).
   - Kontrollerar att tester inte innehåller överhoppade (`.skip`, `xit`) eller exklusiva (`.only`, `fit`) markörer.
   - Kontrollerar att pengar inte beräknas med `parseFloat`.
   - Utökade ESLint-regler (`eslint.config.js`) för att förhindra oavsiktlig loggning av PII via `console.log`.

2. **Fullständig verifieringspipeline (`npm run verify`):**
   - Samlar `npm run typecheck`, `npm run lint`, `npm run check:standard` och `npm test` i ett enda kommando.
   - Kopplat till git pre-commit hook (`.githooks/pre-commit`) för att säkerställa att ingen kod med brister checkas in.

3. **Specialiserade AI-skills (`.claude/skills/`):**
   - `code-standard-checker`: Regler och checklistor för följsamhet mot `docs/standard.md`.
   - `characterization-tester`: Metodik för golden-master-tester före refaktorisering.
   - `db-migrator`: Riktlinjer för reversibla databasmigreringar.

4. **Specialiserade subagenter (`.claude/agents/`):**
   - `pr-reviewer.md`: Agent för automatiserad granskning av pull requests med fokus på säkerhet (OWASP, SQLi, BOLA) och teamets standard.
   - `legacy-modernizer.md`: Agent för refaktorisering av äldre Python-kod utan regressionsrisker.

## Konsekvenser
- **Positiva:**
  - Utvecklaren och AI-assistenten har tydliga, delade riktlinjer och automatiska spärrar mot regressionsfel och säkerhetsbrister.
  - Kodstandarden efterlevs automatiskt innan kod kan committas.
  - Förberedelserna inför moderniseringen av `src/legacy/price_calc.py` och implementationen av nya user stories är tydligt definierade.
- **Negativa / Avvägningar:**
  - Fler verktygskörningar vid commit, men tidsåtgången är minimal (< 5 sekunder).
