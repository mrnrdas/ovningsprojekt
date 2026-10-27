# 2. Modernisering av äldre prisberäkningsmodul (price_calc.py)

Date: 2026-10-27  
Status: Godkänd (Accepted)

## Sammanhang och problemställning
Den äldre Python-modulen `src/legacy/price_calc.py` (skriven 2019) skötte prisberäkning för ordrar. Den hade flera allvarliga tekniska och säkerhetsmässiga brister:
1. **Säkerhet:** Alla databasfrågor byggdes med strängformatering (`%s` via Python `%`), vilket innebar en direkt risk för SQL-injektion.
2. **Global sidoeffekt vid import:** Databasanslutningen `conn = psycopg.connect(...)` initierades globalt på modulnivå, vilket innebar att modulen anslöt till databasen så fort den importerades, även under enhetstester eller i miljöer utan DB-tillgång.
3. **Resurshantering och loggning:** Filöppning med `open(...)` utan context manager (`with`) och dolda undantag med `except: pass`.
4. **Brist på tester:** Modulen saknade automatiserade tester helt (`npm run test:legacy` var tomt).
5. **Ekonomiskt krav:** Ekonomiavdelningen har stämt av mot beräkningens specifika trunkeringslogik (`_kapa` via `Decimal(int(x * 100)) / 100`). Denna avrundning fick inte ändras.
6. **Beroenden:** Modulen anropas både från Node-bryggan (`src/pricing/legacyPrice.ts`) via CLI och från det nattliga batchskriptet `jobs/nightly_report.py` via `from price_calc import calc_price, conn`.

## Beslut

1. **Karakteriseringstester först:**
   - Etablerade `tests/test_price_calc.py` baserat på seed-ordrarna `1042`, `1043`, `1044`, `1045` samt obefintliga ordrar och CLI-gränssnittet.
   - Kör testerna med `pytest -q` kopplat till `npm run test:legacy`.

2. **Parametriserad SQL:**
   - Ersatte all stränginterpolering i SQL med parametriserade anrop: `cur.execute("SELECT ... WHERE id = %s", (order_id,))`.
   - Parametriserade även datumfrågan i `jobs/nightly_report.py`.

3. **Dekoppling av global DB-anslutning:**
   - Skapade `get_db_connection()` som tillhandahåller anslutningar kontextuellt.
   - `calc_price(order_id, db_conn=None)` tillåter inskickad anslutning eller skapar en tillfällig med automatisk `close()`.
   - Skapade `_LazyConnection` för variabeln `conn` för att säkerställa 100% bakåtkompatibilitet med `jobs/nightly_report.py` utan att ansluta omedelbart vid modulimport.

4. **Säker filhantering:**
   - Loggning sker via context manager `with open(...)` med UTF-8 och hanterar eventuella skrivfel utan att krascha prisberäkningen eller läcka känslig data.

5. **Bevarande av avrundning:**
   - Funktionen `_kapa` bevarades med exakt samma heltalsbaserade decimaltrunkering.

## Konsekvenser
- **Positiva:**
  - SQL-injektionsrisken är helt eliminerad.
  - Modulimport skapar inte längre oavsiktliga databasanslutningar.
  - 100% bakåtkompatibilitet med både Node.js-API:t och batchjobbet `jobs/nightly_report.py`.
  - Full testtäckning med 7 automatiserade tester i `npm run test:legacy`, integrerade i `npm run verify` och Git pre-commit hooken.
- **Negativa / Avvägningar:**
  - Python-kodbasen bibehålls för närvarande i stället för att skrivas om till TypeScript, vilket respekterar det befintliga gränssnittet mot driftmiljöns nattliga rapporter.
