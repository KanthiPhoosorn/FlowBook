import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { asyncHandler, parseBody } from "../lib/http";
import { ensureShop } from "../lib/guards";

export const paymentMethodsRouter = Router();

const createSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(["CASH", "BANK", "CREDIT", "EWALLET"]).optional(),
  keywords: z.string().optional(),
  isDefault: z.boolean().optional(),
});
const updateSchema = createSchema.partial();

paymentMethodsRouter.get(
  "/shops/:shopId/payment-methods",
  asyncHandler(async (req, res) => {
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { shopId: req.params.shopId },
      orderBy: { name: "asc" },
    });
    res.json(paymentMethods);
  }),
);

paymentMethodsRouter.post(
  "/shops/:shopId/payment-methods",
  asyncHandler(async (req, res) => {
    await ensureShop(req.params.shopId);
    const data = parseBody(createSchema, req.body);
    const paymentMethod = await prisma.paymentMethod.create({ data: { shopId: req.params.shopId, ...data } });
    res.status(201).json(paymentMethod);
  }),
);

paymentMethodsRouter.patch(
  "/payment-methods/:id",
  asyncHandler(async (req, res) => {
    const data = parseBody(updateSchema, req.body);
    const paymentMethod = await prisma.paymentMethod.update({ where: { id: req.params.id }, data });
    res.json(paymentMethod);
  }),
);

paymentMethodsRouter.delete(
  "/payment-methods/:id",
  asyncHandler(async (req, res) => {
    await prisma.paymentMethod.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);
