# Övningsprojekt: butikens API

Övningsprojektet för delkursen *AI-assisterad systemutveckling*. Det är kodbasen du bygger din rigg för i kursprojektet.

Projektet innehåller två delar med olika ålder och kvalitet:

- **REST-API:t** för kunder och beställningar, i TypeScript med Express och PostgreSQL. Det har tester och följer kodstandarden i `docs/standard.md` någorlunda.
- **Den äldre prisberäkningen** i `src/legacy/price_calc.py`, i Python. Den är odokumenterad, saknar tester och har okända antaganden. Den är den del som moderniseras i kursprojektet.

## Kom igång

Du behöver Node.js 22 eller senare, Python 3.11 eller senare, Docker och git.

```bash
npm install
pip install -r requirements.txt     # gärna i en virtuell miljö
cp .env.example .env
npm run db:up                       # startar PostgreSQL i Docker
npm run db:reset                    # skapar tabeller och testdata
npm test                            # ska ge 16 gröna tester
npm start                           # API:t på http://localhost:3000
```

Pröva API:t:

```bash
curl http://localhost:3000/customers/me -H "X-Customer-Id: 1"
curl http://localhost:3000/orders/1042/price -H "X-Customer-Id: 1"
```

`npm start` och `npm run db:reset` läser `.env` automatiskt. Testerna använder `TEST_DATABASE_URL`, och den äldre modulen `DATABASE_URL`.

## Kommandon

| Kommando | Vad det gör |
|---|---|
| `npm test` | Kör API-testerna mot testdatabasen. |
| `npm run test:legacy` | Kör Python-testerna (finns inga än). |
| `npm run lint` | ESLint med grundkonfiguration. |
| `npm run typecheck` | TypeScript utan att bygga. |
| `npm run format` | Formaterar koden med Prettier. |
| `npm run db:reset` | Återställer båda databaserna till schema och testdata. |

## Struktur

```
src/
  app.ts, server.ts        API:t
  routes/                  endpoints
  services/                affärslogik, returnerar Result
  pricing/legacyPrice.ts   brygga till den äldre prisberäkningen
  legacy/price_calc.py     den äldre prisberäkningen
jobs/nightly_report.py     nattlig rapport som också använder price_calc
db/                        schema och testdata
tests/                     API-tester
docs/
  standard.md              teamets kodstandard, i ord
  api.md                   endpoints
  user-stories.md          user stories att välja bland
  adr/                     dina beslutsloggar
.claude/skills, .claude/agents   tomma: här bygger du riggen
sessions/                  dina sessionsloggar
```

## Ditt arbete

Projektbeskrivningen finns i kursens material. I korthet:

1. Bygg riggen i det här repot: skills och kommandon, subagenter, hooks, behörigheter och en kodstandard som kontrolleras automatiskt.
2. Använd riggen på tre arbeten: en ny funktion ur `docs/user-stories.md`, granskningen av pull requestet som kursledaren delar ut, och en modernisering av `src/legacy/price_calc.py`.
3. Skriv en sessionslogg i `sessions/` efter varje arbetspass.
4. Tagga repot `inlamning` när du lämnar in.

Testdatan är påhittad. Lägg aldrig in riktiga kunduppgifter eller produktionsdata i repot, i instruktioner eller i sessionsloggar.
