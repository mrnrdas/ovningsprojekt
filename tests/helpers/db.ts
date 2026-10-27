import { readFileSync } from "node:fs";
import path from "node:path";
import { db } from "../../src/db";

const root = path.join(__dirname, "..", "..");
const schema = readFileSync(path.join(root, "db", "schema.sql"), "utf8");
const seed = readFileSync(path.join(root, "db", "seed.sql"), "utf8");

// Återställer testdatabasen till schema + testdata före varje test.
export async function resetDb(): Promise<void> {
  await db.query("SET client_min_messages TO warning");
  await db.query(schema);
  await db.query(seed);
}

export async function closeDb(): Promise<void> {
  await db.end();
}
