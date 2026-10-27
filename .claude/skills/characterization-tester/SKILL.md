---
name: characterization-tester
description: Metod och verktyg för att skriva karakteriseringstester (golden-master tester) inför refaktorisering av äldre moduler.
---

# Characterization Tester

Denna skill vägleder skapandet av karakteriseringstester (characterization tests / golden-master tests) för att bevara existerande beteende innan refaktorisering påbörjas.

## Syfte
När man moderniserar äldre, odokumenterad kod (såsom `src/legacy/price_calc.py`) måste man först låsa fast det nuvarande beteendet med automatiserade tester. Ändra aldrig i källkoden innan testerna finns och är gröna!

## Förberedelser & Testdata
- I `db/seed.sql` finns ordrarna `1042`, `1043` och `1044` särskilt förberedda för karakteriseringstester:
  - `1042`: Beställning med två rader (2x375.00 + 1x200.00 = 950.00 kr), ingen rabattkod.
  - `1044`: Beställning med 1 rad (199.90 kr) och rabattkod `VAR10` (10%).
  - `1045`: Beställning med utgången rabattkod `GAMMAL15`.
  - Negativa fall: Order-id som inte finns (`9999`).

## Arbetsgång:
1. Skapa testfil i Python (`tests/test_price_calc.py`) anpassad för `pytest`.
2. Kör testerna mot testdatabasen eller seedad databas:
   ```bash
   npm run test:legacy
   ```
3. Fånga exakta returvärden:
   - `net`: exakt trunkering via `_kapa` (avrundning nedåt till två decimaler utan flyttalsfel).
   - `vat`: exakt 25% moms baserat på `net`.
   - `total`: `net + vat`.
4. När alla karakteriseringstester passerar kan modernisering genomföras steg för steg utan risk för regression.
