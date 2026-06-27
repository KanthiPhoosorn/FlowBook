import { Router } from "express";
import { notImplemented } from "../lib/http";

// ⛏️ Coder 2 — task 7. Use period.ts helpers for ranges and dayLabels.
export const reportsRouter = Router();
const todo = notImplemented("Coder 2", "task 7: Reports/P&L");

reportsRouter.get("/shops/:shopId/reports/summary", todo); // ?period=&date=  -> income/expense/net/count
reportsRouter.get("/shops/:shopId/reports/monthly", todo); // ?month=YYYY-MM -> totals + byCategory + byDay
reportsRouter.get("/shops/:shopId/reports/categories", todo); // ?from=&to=&type=
reportsRouter.get("/shops/:shopId/reports/pl", todo); // ?from=&to=  -> P&L / net profit
reportsRouter.get("/shops/:shopId/reports/graph", todo); // ?from=&to=  -> { labels, income, expense, net }
