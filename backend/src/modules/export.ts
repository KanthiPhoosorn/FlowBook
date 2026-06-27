import { Router } from "express";
import { notImplemented } from "../lib/http";

// ⛏️ Coder 2 — task 7. Use exceljs for xlsx; set Content-Disposition: attachment.
export const exportRouter = Router();
const todo = notImplemented("Coder 2", "task 7: Export");

exportRouter.get("/shops/:shopId/export/csv", todo); // ?from=&to=
exportRouter.get("/shops/:shopId/export/xlsx", todo); // transactions sheet + P&L summary sheet
