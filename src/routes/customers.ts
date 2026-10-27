import { Router } from "express";
import { AuthedRequest, requireCustomer } from "../auth";
import { sendResult } from "../http";
import { createCustomer, getCustomer, listOrdersForCustomer } from "../services/customerService";

export const customers = Router();

// Registrera en ny kund.
customers.post("/customers", async (req, res) => {
  const result = await createCustomer(req.body ?? {});
  sendResult(res, result, 201);
});

// Den inloggade kunden.
customers.get("/customers/me", requireCustomer, async (req, res) => {
  const result = await getCustomer((req as AuthedRequest).customerId);
  sendResult(res, result);
});

// Den inloggade kundens beställningar.
customers.get("/customers/me/orders", requireCustomer, async (req, res) => {
  const orders = await listOrdersForCustomer((req as AuthedRequest).customerId);
  res.json(orders);
});
