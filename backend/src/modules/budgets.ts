import { Router } from "express";
import { notImplemented } from "../lib/http";

// ⛏️ Coder 2 — task 6. Stubs return 501 until implemented.
// See backend/README.md "งานของ Coder 2" for the spec.
export const budgetsRouter = Router();
const todo = notImplemented("Coder 2", "task 6: Budgets");

budgetsRouter.get("/shops/:shopId/budgets", todo);
budgetsRouter.post("/shops/:shopId/budgets", todo);
budgetsRouter.get("/shops/:shopId/budgets/status", todo); // spent vs budget for the current cycle
budgetsRouter.patch("/budgets/:id", todo);
budgetsRouter.delete("/budgets/:id", todo);
