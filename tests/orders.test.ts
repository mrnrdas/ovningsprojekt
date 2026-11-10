import request from "supertest";
import { createApp } from "../src/app";
import { closeDb, resetDb } from "./helpers/db";

const app = createApp();

beforeEach(resetDb);
afterAll(closeDb);

describe("POST /orders", () => {
  it("lägger en beställning med rader", async () => {
    const res = await request(app)
      .post("/orders")
      .set("X-Customer-Id", "3")
      .send({ lines: [{ product: "Musmatta", quantity: 2, unitPrice: 200 }] });
    expect(res.status).toBe(201);
    expect(res.body.customerId).toBe(3);
    expect(res.body.status).toBe("new");
    expect(res.body.lines).toEqual([{ product: "Musmatta", quantity: 2, unitPrice: "200.00" }]);
  });

  it("returnerar 400 utan rader", async () => {
    const res = await request(app).post("/orders").set("X-Customer-Id", "3").send({ lines: [] });
    expect(res.status).toBe(400);
  });

  it("returnerar 400 när antalet inte är positivt", async () => {
    const res = await request(app)
      .post("/orders")
      .set("X-Customer-Id", "3")
      .send({ lines: [{ product: "Musmatta", quantity: 0, unitPrice: 200 }] });
    expect(res.status).toBe(400);
  });

  it("returnerar 401 utan inloggning", async () => {
    const res = await request(app).post("/orders").send({ lines: [] });
    expect(res.status).toBe(401);
  });
});

describe("GET /orders/:id", () => {
  it("returnerar en egen beställning med rader", async () => {
    const res = await request(app).get("/orders/1042").set("X-Customer-Id", "1");
    expect(res.status).toBe(200);
    expect(res.body.lines).toHaveLength(2);
  });

  it("returnerar 403 för en annan kunds beställning", async () => {
    const res = await request(app).get("/orders/1042").set("X-Customer-Id", "2");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("forbidden");
  });

  it("returnerar 404 för en beställning som inte finns", async () => {
    const res = await request(app).get("/orders/9999").set("X-Customer-Id", "1");
    expect(res.status).toBe(404);
  });

  it("returnerar 400 för ett ogiltigt id", async () => {
    const res = await request(app).get("/orders/abc").set("X-Customer-Id", "1");
    expect(res.status).toBe(400);
  });
});

describe("GET /orders/:id/price", () => {
  it("räknar pris med moms via den äldre modulen", async () => {
    const res = await request(app).get("/orders/1042/price").set("X-Customer-Id", "1");
    expect(res.status).toBe(200);
    expect(Number(res.body.total)).toBe(1187.5);
  });
});

describe("POST /orders/:id/cancel", () => {
  it("avbryter en ny beställning inom 30 minuter", async () => {
    // 1. Skapa en ny beställning nu
    const createRes = await request(app)
      .post("/orders")
      .set("X-Customer-Id", "1")
      .send({ lines: [{ product: "Tangentbord", quantity: 1, unitPrice: 199.9 }] });
    expect(createRes.status).toBe(201);
    const orderId = createRes.body.id;

    // 2. Avbryt beställningen
    const cancelRes = await request(app)
      .post(`/orders/${orderId}/cancel`)
      .set("X-Customer-Id", "1");
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.id).toBe(orderId);
    expect(cancelRes.body.status).toBe("cancelled");
    expect(cancelRes.body.cancelledAt).toBeTruthy();
  });

  it("returnerar 409 när mer än 30 minuter har passerat", async () => {
    // Beställning 1042 lades 2026-10-01 och tillhör kund 1
    const res = await request(app).post("/orders/1042/cancel").set("X-Customer-Id", "1");
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("conflict");
    expect(res.body.error.message).toMatch(/30 minuter/);
  });

  it("returnerar 409 för en beställning som redan har skickats (shipped)", async () => {
    // Beställning 1040 har status 'shipped' och tillhör kund 1
    const res = await request(app).post("/orders/1040/cancel").set("X-Customer-Id", "1");
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("conflict");
  });

  it("returnerar 409 för en beställning som redan är avbruten (cancelled)", async () => {
    // Beställning 1046 har status 'cancelled' och tillhör kund 6
    const res = await request(app).post("/orders/1046/cancel").set("X-Customer-Id", "6");
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("conflict");
  });

  it("returnerar 403 för en annan kunds beställning", async () => {
    // Beställning 1042 tillhör kund 1, kund 2 försöker avbryta
    const res = await request(app).post("/orders/1042/cancel").set("X-Customer-Id", "2");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("forbidden");
  });

  it("returnerar 404 för en beställning som inte finns", async () => {
    const res = await request(app).post("/orders/9999/cancel").set("X-Customer-Id", "1");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
  });

  it("returnerar 401 utan inloggning", async () => {
    const res = await request(app).post("/orders/1042/cancel");
    expect(res.status).toBe(401);
  });

  it("returnerar 400 för ett ogiltigt id", async () => {
    const res = await request(app).post("/orders/abc/cancel").set("X-Customer-Id", "1");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_input");
  });
});
