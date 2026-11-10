// Återställer utvecklingsdatabasen och testdatabasen till schema, testdata och migreringar.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

const root = path.join(__dirname, "..");
const migrationsDir = path.join(root, "db", "migrations");
const migrationSql = existsSync(migrationsDir)
  ? readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".up.sql"))
      .sort()
      .map((f) => readFileSync(path.join(migrationsDir, f), "utf8"))
      .join("\n")
  : "";

const sql = ["schema.sql", "seed.sql"]
  .map((f) => readFileSync(path.join(root, "db", f), "utf8"))
  .concat(migrationSql ? [migrationSql] : [])
  .join("\n");

const urls = [
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/butik",
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/butik_test",
];

async function main(): Promise<void> {
  for (const url of urls) {
    const client = new Client({ connectionString: url });
    await client.connect();
    await client.query("SET client_min_messages TO warning");
    await client.query(sql);
    await client.end();
    console.log(`Återställd: ${url.split("/").pop()}`);
  }
}

main().catch((e) => {
  console.error(`Kunde inte återställa databasen: ${(e as Error).message}`);
  process.exit(1);
});
