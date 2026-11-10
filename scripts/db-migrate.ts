// Skript för att köra databasmigreringar (up eller down).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

const root = path.join(__dirname, "..");
const migrationsDir = path.join(root, "db", "migrations");

const direction = process.argv.includes("--down") ? "down" : "up";

const urls = [
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/butik",
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/butik_test",
];

async function run(): Promise<void> {
  if (!existsSync(migrationsDir)) {
    console.info("Inga migreringar hittades.");
    return;
  }

  const ext = `.${direction}.sql`;
  let files = readdirSync(migrationsDir).filter((f) => f.endsWith(ext));
  files = direction === "down" ? files.sort().reverse() : files.sort();

  if (files.length === 0) {
    console.info(`Inga ${direction}-migreringar att köra.`);
    return;
  }

  for (const url of urls) {
    const client = new Client({ connectionString: url });
    await client.connect();
    try {
      for (const file of files) {
        const sql = readFileSync(path.join(migrationsDir, file), "utf8");
        await client.query(sql);
        console.info(`Körde ${file} mot ${url.split("/").pop()}`);
      }
    } finally {
      await client.end();
    }
  }
}

run().catch((err) => {
  console.error("Migreringsfel:", err);
  process.exit(1);
});
