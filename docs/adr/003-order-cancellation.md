# 3. Implementation av avbrytning av beställning (User Story 2)

Date: 2026-11-10  
Status: Godkänd (Accepted)

## Sammanhang och problemställning
Enligt kraven i kursprojektets del "Ny funktion" har vi valt User Story 2:
> *Som kund vill jag kunna avbryta en beställning inom 30 minuter efter att jag lagt den.*

Systemet behövde en kontrollerad och säker mekanism för att avbryta beställningar, med stöd för:
1. Strikt behörighetskontroll: Kunden får enbart avbryta sina egna beställningar.
2. Tillståndshantering och tidsgräns: Beställningen får endast avbrytas om dess status inte redan är `cancelled` eller `shipped`, och högst 30 minuter har förflutit sedan den skapades (`created_at`).
3. Reversibel databasändring: Databasändringar ska genomföras som migreringar i steg som går att backa.
4. Följsamhet mot kodstandarden i `docs/standard.md`: Result-mönster, parametriserad SQL, camelCase i JSON-svar, transaktionssäkerhet och tydliga HTTP-statuskoder (200, 400, 401, 403, 404, 409).

## Beslut

1. **Reversibel databasmigrering:**
   - Skapade `db/migrations/001_cancel_order.up.sql` som lägger till kolumnen `cancelled_at TIMESTAMPTZ` på tabellen `orders`.
   - Skapade motsvarande `db/migrations/001_cancel_order.down.sql` som tar bort kolumnen om migreringen rullas tillbaka (`ALTER TABLE orders DROP COLUMN IF EXISTS cancelled_at;`).
   - Implementerade migreringsskriptet `scripts/db-migrate.ts` med stöd för `npm run db:migrate` och `npm run db:migrate:down`.
   - Integrerade migreringar i `scripts/db-reset.ts` och `tests/helpers/db.ts` så att test- och utvecklingsdatabaser alltid hålls synkroniserade.

2. **Affärslogik i `orderService.ts` (`cancelOrder`):**
   - Utförs inom en databastransaktion (`BEGIN` ... `COMMIT`/`ROLLBACK`) med `FOR UPDATE`-lås för att förhindra kapplöpningstillstånd (race conditions) vid parallella förfrågningar.
   - Returnerar `Result<Order>`:
     - `err("not_found", ...)` om beställningen saknas (mappas till HTTP 404).
     - `err("forbidden", ...)` om beställningen tillhör en annan kund (mappas till HTTP 403).
     - `err("conflict", ...)` om beställningen redan är `cancelled`, redan är `shipped`, eller om mer än 30 minuter har passerat sedan `created_at` (mappas till HTTP 409).
     - `ok(order)` med uppdaterad status `cancelled` och `cancelledAt`-tidsstämpel (mappas till HTTP 200).

3. **HTTP-rutt i `routes/orders.ts`:**
   - Exponerar `POST /orders/:id/cancel`.
   - Använder middleware `requireCustomer` för att extrahera och validera `X-Customer-Id`.
   - Returnerar 400 Bad Request via `sendError` om `:id` inte är ett giltigt heltal.

4. **Integrationstester:**
   - Implementerade 8 nya integrationstester i `tests/orders.test.ts` som täcker alla acceptanskriterier och felkoder (200, 400, 401, 403, 404, 409).

## Konsekvenser
- **Positiva:**
  - Fullständig acceptanstesttäckning med automatiserade tester (totalt 24 Jest-tester, 100% gröna).
  - Robust spårbarhet via `cancelled_at` i databasen.
  - Säkrad mot samtidiga anrop via transaktionellt `FOR UPDATE`-lås.
  - Inga brytande förändringar för befintliga endpoints eller rapporter.
