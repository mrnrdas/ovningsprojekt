// Testerna körs alltid mot testdatabasen.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/butik_test";
