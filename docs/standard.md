# Kodstandard

Teamets regler för koden i det här projektet. De står här i ord. Ingen av dem kontrolleras automatiskt ännu: att göra dem kontrollerbara i verktyg och hooks är en del av kursprojektet.

## Namn
- Funktioner och variabler i TypeScript skrivs i camelCase, typer i PascalCase.
- Fältnamn i JSON-svar skrivs i camelCase, även när kolumnen i databasen har snake_case. Byt namn i SQL med `AS "fältnamn"`.

## Databas
- All SQL är parametriserad: `db.query(sql, [värden])`. SQL byggs aldrig med strängmallar eller sammanslagning.
- Hämta relaterade rader i en fråga (JOIN eller `= ANY($1)`), inte en fråga per rad i en loop.
- Skrivningar som hör ihop görs i en transaktion.

## Fel
- Tjänstelagret (`src/services/`) kastar inte fel för förväntade fall. Det returnerar `Result` med `ok(värde)` eller `err(kod, meddelande)` från `src/result.ts`.
- Routes översätter fel till HTTP med `sendResult` eller `sendError` från `src/http.ts`. Alla felsvar har formen `{ "error": { "code": "...", "message": "..." } }`.
- Statuskoder: 400 ogiltig indata, 401 inte inloggad, 403 inte din resurs, 404 finns inte, 409 konflikt.
- En sökning som inte hittar något returnerar 200 och en tom lista.

## Behörighet
- Den inloggade kunden hämtas med `requireCustomer` och `req.customerId`, aldrig från request body eller query.
- En kund får bara läsa och ändra sina egna beställningar. Kontrollen görs i tjänstelagret.

## Pengar
- Belopp räknas aldrig med flyttal. Priser lagras som `NUMERIC` och returneras som strängar med två decimaler.
- All prisberäkning går genom `calcPrice` i `src/pricing/`. Logiken dupliceras inte.

## Hemligheter och loggar
- Inga nycklar, lösenord eller tokens i koden. De läses från miljövariabler.
- Inga personuppgifter (namn, e-post) i loggar.

## Tester
- Varje endpoint har tester för lyckat fall och för felfallen 400, 401, 403 och 404 där de är möjliga.
- Testerna körs mot testdatabasen, som återställs före varje test.
- Ett test tas aldrig bort eller hoppas över för att bli grönt.
