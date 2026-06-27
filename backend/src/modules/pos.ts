import { Router } from "express";
import { notImplemented } from "../lib/http";

// ⛏️ Coder 2 — task 8. POS revenue ingestion (the "POS REST API" from the main README).
export const posRouter = Router();

// POST /api/pos/sales { shopId, externalRef, occurredAt?, items:[{name,qty,unitPrice}] }
// -> INCOME transaction (source=POS) + SaleItems; idempotent on externalRef.
posRouter.post("/pos/sales", notImplemented("Coder 2", "task 8: POS ingestion"));
