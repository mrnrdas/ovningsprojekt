import { NextFunction, Request, Response } from "express";

// Förenklad inloggning för övningen: klienten skickar kundens id i headern X-Customer-Id.
// I ett riktigt system kommer id:t från en verifierad token.
export type AuthedRequest = Request & { customerId: number };

export function requireCustomer(req: Request, res: Response, next: NextFunction): void {
  const raw = req.header("X-Customer-Id");
  const id = Number(raw);
  if (!raw || !Number.isInteger(id) || id <= 0) {
    res.status(401).json({ error: { code: "unauthorized", message: "Logga in först." } });
    return;
  }
  (req as AuthedRequest).customerId = id;
  next();
}
