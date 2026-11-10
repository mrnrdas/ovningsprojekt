import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { db } from "../../src/db";

const root = path.join(__dirname, "..", "..");
const schema = readFileSync(path.join(root, "db", "schema.sql"), "utf8");
const seed = readFileSync(path.join(root, "db", "seed.sql"), "utf8");
const migrationsDir = path.join(root, "db", "migrations");
const migrationSql = existsSync(migrationsDir)
  ? readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".up.sql"))
      .sort()
      .map((f) => readFileSync(path.join(migrationsDir, f), "utf8"))
      .join("\n")
  : "";

// Återställer testdatabasen till schema + testdata före varje test.
export async function resetDb(): Promise<void> {
  await db.query("SET client_min_messages TO warning");
  await db.query(schema);
  await db.query(seed);
  if (migrationSql) {
    await db.query(migrationSql);
  }
}

export async function closeDb(): Promise<void> {
  await db.end();
}
