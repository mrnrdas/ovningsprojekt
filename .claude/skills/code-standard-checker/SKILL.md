---
name: code-standard-checker
description: Kontrollerar att TypeScript- och SQL-kod följer projektets kodstandard i docs/standard.md.
---

# Code Standard Checker

Denna skill används för att granska källkod i projektet mot reglerna i `docs/standard.md`.

## Regler att verifiera:

### 1. Namngivning
- Funktioner och variabler i TypeScript: `camelCase`.
- Typer och interfaces: `PascalCase`.
- Fältnamn i JSON-svar: Alltid `camelCase`.
- Databaskolumner (ofta `snake_case`) ska alltid döpas om i SQL med alias: `SELECT customer_id AS "customerId", created_at AS "createdAt"`.

### 2. Databas & SQL
- **Obligatorisk parametrisering:** Alla SQL-frågor måste använda parametrering (`$1, $2`).
- **Förbjudet:** Strängmallar (`` `SELECT * FROM orders WHERE id = ${id}` ``) och strängkonkatenering (`"..." + id`).
- **N+1-prevention:** Relaterade rader hämtas i en enda fråga (`JOIN` eller `= ANY($1)`), aldrig i en loop.
- **Transaktioner:** Samhörande skrivningar måste omges av `BEGIN`, `COMMIT` och `ROLLBACK` i ett try/catch/finally-block med `client.release()`.

### 3. Felhantering
- **Tjänstelagret (`src/services/`):** Får inte kasta fel för förväntade affärsfall. Returnera `Result<T>`:
  - Framgång: `ok(värde)`
  - Fel: `err("invalid_input" | "not_found" | "forbidden" | "conflict", meddelande)`
- **Routes (`src/routes/`):** Skickar svar med `sendResult(res, result)` eller `sendError(res, error)`.
- **Felsvarformat:** Alltid `{ "error": { "code": "...", "message": "..." } }`.
- **HTTP-statuskoder:**
  - `400`: `invalid_input` (valideringsfel)
  - `401`: `unauthorized` (ej inloggad / saknar `X-Customer-Id`)
  - `403`: `forbidden` (resursen tillhör annan kund)
  - `404`: `not_found` (resursen finns ej)
  - `409`: `conflict` (tillståndskonflikt, t.ex. beställning redan skickad eller tidsgräns passerad)
- **Tomma sökningar:** Returnera HTTP 200 med tom lista `[]`.

### 4. Behörighet & Säkerhet
- Inloggad kund hämtas uteslutande via `requireCustomer` middleware och `(req as AuthedRequest).customerId`.
- Kund-id får aldrig litas på från request body eller query parameters.
- Ägandeskapskontroll: Kontrollera alltid i servicelagret att resursens `customerId` matchar den inloggade kundens id.

### 5. Pengar & Beräkningar
- Inga flyttal (`number` med decimalberäkning eller `parseFloat`).
- Priser i DB lagras som `NUMERIC(10,2)` och returneras som strängar med två decimaler (t.ex. `"200.00"`).
- All prisberäkning delegeras till `calcPrice` i `src/pricing/`.

### 6. Tester
- Varje endpoint måste ha integrationstester i `tests/` för lyckat fall samt relevanta felfall: `400`, `401`, `403`, `404`.
- Testerna ska köras mot testdatabasen (`TEST_DATABASE_URL`), med `beforeEach(resetDb)`.
- Tester får aldrig hoppas över (`.skip`) eller markeras med `.only`.
