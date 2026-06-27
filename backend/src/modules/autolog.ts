import { Router } from "express";
import { notImplemented } from "../lib/http";

// ⛏️ Coder 2 — task 6. Recurring auto-log rules (max 20 per shop).
export const autologRouter = Router();
const todo = notImplemented("Coder 2", "task 6: AutoLog");

autologRouter.get("/shops/:shopId/autolog", todo);
autologRouter.post("/shops/:shopId/autolog", todo); // enforce <= 20 active rules
autologRouter.post("/shops/:shopId/autolog/:id/run", todo); // create a tx with source=AUTO
autologRouter.patch("/autolog/:id", todo);
autologRouter.delete("/autolog/:id", todo);
