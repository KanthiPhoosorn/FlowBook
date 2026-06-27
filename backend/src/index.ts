import "dotenv/config";
import express from "express";
import { z } from "zod";
import { prisma } from "./db";
import { asyncHandler, parseBody, HttpError, errorHandler } from "./lib/http";

// Coder 1 modules
import { categoriesRouter } from "./modules/categories";
import { paymentMethodsRouter } from "./modules/paymentMethods";
import { transactionsRouter } from "./modules/transactions";
// Coder 2 modules (stubs return 501 until implemented)
import { budgetsRouter } from "./modules/budgets";
import { autologRouter } from "./modules/autolog";
import { reportsRouter } from "./modules/reports";
import { exportRouter } from "./modules/export";
import { posRouter } from "./modules/pos";
import { lineRouter } from "./line/webhook";
import { startScheduler } from "./scheduler";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) =>
  res.json({ ok: true, service: "flowbook-backend", time: new Date().toISOString() }),
);

// --- Shops (Coder 1) ---
const shopCreateSchema = z.object({
  name: z.string().min(1),
  plan: z.enum(["FREE", "PRO"]).optional(),
  timezone: z.string().optional(),
});
const shopUpdateSchema = z.object({
  name: z.string().optional(),
  plan: z.enum(["FREE", "PRO"]).optional(),
  timezone: z.string().optional(),
  budgetStartDay: z.number().int().min(1).max(28).optional(),
  reminderEnabled: z.boolean().optional(),
  reminderTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

app.post(
  "/api/shops",
  asyncHandler(async (req, res) => {
    const data = parseBody(shopCreateSchema, req.body);
    res.status(201).json(await prisma.shop.create({ data }));
  }),
);

app.get(
  "/api/shops/:shopId",
  asyncHandler(async (req, res) => {
    const shop = await prisma.shop.findUnique({ where: { id: req.params.shopId } });
    if (!shop) throw new HttpError(404, "Shop not found");
    res.json(shop);
  }),
);

app.patch(
  "/api/shops/:shopId",
  asyncHandler(async (req, res) => {
    const data = parseBody(shopUpdateSchema, req.body);
    res.json(await prisma.shop.update({ where: { id: req.params.shopId }, data }));
  }),
);

// --- Mount module routers ---
app.use("/api", categoriesRouter);
app.use("/api", paymentMethodsRouter);
app.use("/api", transactionsRouter);
app.use("/api", budgetsRouter);
app.use("/api", autologRouter);
app.use("/api", reportsRouter);
app.use("/api", exportRouter);
app.use("/api", posRouter);
app.use("/line", lineRouter);

// 404 + error handling
app.use((req, res) => res.status(404).json({ error: "Not found", path: req.path }));
app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`FlowBook backend listening on http://localhost:${port}`);
  startScheduler();
});
