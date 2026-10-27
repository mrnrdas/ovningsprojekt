import { db } from "../db";
import { Result, ok, err } from "../result";

export type Customer = { id: number; uuid: string; name: string; email: string };

export type OrderSummary = { id: number; status: string; createdAt: string };

export async function createCustomer(input: {
  name?: unknown;
  email?: unknown;
}): Promise<Result<Customer>> {
  if (typeof input.name !== "string" || input.name.trim() === "") {
    return err("invalid_input", "name saknas.");
  }
  if (typeof input.email !== "string" || input.email.trim() === "") {
    return err("invalid_input", "email saknas.");
  }
  const res = await db.query(
    "INSERT INTO customers (name, email) VALUES ($1, $2) RETURNING id, uuid, name, email",
    [input.name.trim(), input.email.trim()],
  );
  return ok(res.rows[0]);
}

export async function getCustomer(id: number): Promise<Result<Customer>> {
  const res = await db.query("SELECT id, uuid, name, email FROM customers WHERE id = $1", [id]);
  if (res.rowCount === 0) {
    return err("not_found", `Kund ${id} finns inte.`);
  }
  return ok(res.rows[0]);
}

export async function listOrdersForCustomer(customerId: number): Promise<OrderSummary[]> {
  const res = await db.query(
    `SELECT id, status, created_at AS "createdAt"
       FROM orders WHERE customer_id = $1 ORDER BY created_at DESC`,
    [customerId],
  );
  return res.rows;
}
