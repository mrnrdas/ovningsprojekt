---
name: db-migrator
description: Rutiner och mallar för att skapa säkra, reversibla databasmigreringar i PostgreSQL.
---

# Database Migrator

Denna skill används för att skapa och köra databasmigreringar som kan rullas tillbaka ("i steg som går att backa", jfr `docs/user-stories.md`).

## Migreringsstruktur
Migreringar placeras under `db/migrations/`:
```
db/migrations/
  001_cancel_order.up.sql
  001_cancel_order.down.sql
```

## Riktlinjer för SQL:
1. **Upp-migrering (`*.up.sql`):**
   - Skapa nya kolumner, tabeller eller index.
   - Sätt default-värden eller `NOT NULL` på ett sätt som inte bryter befintlig data.
   - Exempel:
     ```sql
     ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
     ```
2. **Ned-migrering (`*.down.sql`):**
   - Återställer exakt de ändringar som upp-migreringen gjorde.
   - Exempel:
     ```sql
     ALTER TABLE orders DROP COLUMN IF EXISTS cancelled_at;
     ```
3. **Säkerställande:**
   - Efter migrering ska `npm run db:reset` och `npm test` alltid passera utan problem.
