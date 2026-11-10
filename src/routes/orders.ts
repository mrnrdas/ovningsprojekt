import { Router } from "express";
import { AuthedRequest, requireCustomer } from "../auth";
import { sendError, sendResult } from "../http";
import { createOrder, getOrder, cancelOrder } from "../services/orderService";
import { calcPrice } from "../pricing/legacyPrice";

export const orders = Router();

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Lägg en beställning.
orders.post("/orders", requireCustomer, async (req, res) => {
  const result = await createOrder((req as AuthedRequest).customerId, req.body ?? {});
  sendResult(res, result, 201);
});

// Hämta en egen beställning med rader.
orders.get("/orders/:id", requireCustomer, async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    sendError(res, { code: "invalid_input", message: "Ogiltigt id." });
    return;
  }
  sendResult(res, await getOrder(id, (req as AuthedRequest).customerId));
});

// Pris för en egen beställning. Räknas av den äldre modulen src/legacy/price_calc.py.
orders.get("/orders/:id/price", requireCustomer, async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    sendError(res, { code: "invalid_input", message: "Ogiltigt id." });
    return;
  }
  const order = await getOrder(id, (req as AuthedRequest).customerId);
  if (!order.ok) {
    sendError(res, order.error);
    return;
  }
  sendResult(res, await calcPrice(id));
});

// Avbryt en egen beställning inom 30 minuter efter att den lades.
orders.post("/orders/:id/cancel", requireCustomer, async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    sendError(res, { code: "invalid_input", message: "Ogiltigt id." });
    return;
  }
  const result = await cancelOrder(id, (req as AuthedRequest).customerId);
  sendResult(res, result);
});
