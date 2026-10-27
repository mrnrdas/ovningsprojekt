-- Schema för övningsprojektet: kunder, beställningar och rabattkoder.
-- Schemat har vuxit under flera år och har kända svagheter. De är en del av övningen.

DROP TABLE IF EXISTS order_lines;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS discounts;
DROP TABLE IF EXISTS customers;

CREATE TABLE customers (
  id          SERIAL PRIMARY KEY,
  uuid        UUID NOT NULL DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE discounts (
  code        TEXT PRIMARY KEY,
  percent     INTEGER NOT NULL,
  valid_from  DATE,
  valid_to    DATE
);

CREATE TABLE orders (
  id             SERIAL PRIMARY KEY,
  customer_id    INTEGER NOT NULL,
  status         TEXT NOT NULL DEFAULT 'new',
  discount_code  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_lines (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL,
  product     TEXT NOT NULL,
  quantity    INTEGER NOT NULL,
  unit_price  NUMERIC(10, 2) NOT NULL
);
