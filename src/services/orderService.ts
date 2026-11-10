import { db } from "../db";
import { Result, ok, err } from "../result";

export type OrderLineInput = { product: string; quantity: number; unitPrice: number };

export type Order = {
  id: number;
  customerId: number;
  status: string;
  discountCode: string | null;
  createdAt?: string;
  cancelledAt?: string | null;
  lines: { product: string; quantity: number; unitPrice: string }[];
};

function validateLines(lines: unknown): Result<OrderLineInput[]> {
  if (!Array.isArray(lines) || lines.length === 0) {
    return err("invalid_input", "En beställning måste ha minst en rad.");
  }
  for (const line of lines) {
    if (
      typeof line?.product !== "string" ||
      !Number.isInteger(line?.quantity) ||
      line.quantity <= 0 ||
      typeof line?.unitPrice !== "number" ||
      line.unitPrice < 0
    ) {
      return err("invalid_input", "Varje rad behöver product, quantity (> 0) och unitPrice.");
    }
  }
  return ok(lines as OrderLineInput[]);
}

export async function createOrder(
  customerId: number,
  input: { lines?: unknown; discountCode?: unknown },
): Promise<Result<Order>> {
  const lines = validateLines(input.lines);
  if (!lines.ok) return lines;
  const discountCode = typeof input.discountCode === "string" ? input.discountCode : null;

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const order = await client.query(
      "INSERT INTO orders (customer_id, discount_code) VALUES ($1, $2) RETURNING id",
      [customerId, discountCode],
    );
    const orderId: number = order.rows[0].id;
    for (const line of lines.value) {
      await client.query(
        "INSERT INTO order_lines (order_id, product, quantity, unit_price) VALUES ($1, $2, $3, $4)",
        [orderId, line.product, line.quantity, line.unitPrice],
      );
    }
    await client.query("COMMIT");
    return getOrder(orderId, customerId);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function getOrder(orderId: number, customerId: number): Promise<Result<Order>> {
  const res = await db.query(
    `SELECT id, customer_id AS "customerId", status, discount_code AS "discountCode", created_at AS "createdAt", cancelled_at AS "cancelledAt"
       FROM orders WHERE id = $1`,
    [orderId],
  );
  if (res.rowCount === 0) {
    return err("not_found", `Beställning ${orderId} finns inte.`);
  }
  const order = res.rows[0];
  if (order.customerId !== customerId) {
    return err("forbidden", "Beställningen tillhör en annan kund.");
  }
  const lines = await db.query(
    `SELECT product, quantity, unit_price AS "unitPrice"
       FROM order_lines WHERE order_id = $1 ORDER BY id`,
    [orderId],
  );
  return ok({ ...order, lines: lines.rows });
}

export async function cancelOrder(orderId: number, customerId: number): Promise<Result<Order>> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const res = await client.query(
      `SELECT id, customer_id AS "customerId", status, created_at AS "createdAt", cancelled_at AS "cancelledAt"
         FROM orders WHERE id = $1 FOR UPDATE`,
      [orderId],
    );

    if (res.rowCount === 0) {
      await client.query("ROLLBACK");
      return err("not_found", `Beställning ${orderId} finns inte.`);
    }

    const order = res.rows[0];

    // Kontrollera att beställningen tillhör kunden
    if (order.customerId !== customerId) {
      await client.query("ROLLBACK");
      return err("forbidden", "Beställningen tillhör en annan kund.");
    }

    // Kontrollera att beställningen inte redan är avbruten eller skickad
    if (order.status === "cancelled") {
      await client.query("ROLLBACK");
      return err("conflict", "Beställningen är redan avbruten.");
    }
    if (order.status === "shipped") {
      await client.query("ROLLBACK");
      return err("conflict", "Beställningen har redan skickats och kan inte avbrytas.");
    }

    // Tidsgränskontroll: kan endast avbrytas inom 30 minuter från lagd beställning
    const createdAtMs = new Date(order.createdAt).getTime();
    const nowMs = Date.now();
    const diffMinutes = (nowMs - createdAtMs) / (1000 * 60);

    if (diffMinutes > 30) {
      await client.query("ROLLBACK");
      return err(
        "conflict",
        "Beställningen kan inte avbrytas eftersom mer än 30 minuter har passerat.",
      );
    }

    await client.query(
      `UPDATE orders SET status = 'cancelled', cancelled_at = now() WHERE id = $1`,
      [orderId],
    );

    await client.query("COMMIT");

    return getOrder(orderId, customerId);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
