import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { asyncHandler, parseBody } from "../lib/http";
import { ensureShop } from "../lib/guards";

export const categoriesRouter = Router();

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().optional(),
  color: z.string().optional(),
  keywords: z.string().optional(),
});
const updateSchema = createSchema.partial();

// GET /api/shops/:shopId/categories?type=INCOME|EXPENSE
categoriesRouter.get(
  "/shops/:shopId/categories",
  asyncHandler(async (req, res) => {
    const type = req.query.type as string | undefined;
    const categories = await prisma.category.findMany({
      where: { shopId: req.params.shopId, ...(type ? { type } : {}) },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
    res.json(categories);
  }),
);

categoriesRouter.post(
  "/shops/:shopId/categories",
  asyncHandler(async (req, res) => {
    await ensureShop(req.params.shopId);
    const data = parseBody(createSchema, req.body);
    const category = await prisma.category.create({ data: { shopId: req.params.shopId, ...data } });
    res.status(201).json(category);
  }),
);

categoriesRouter.patch(
  "/categories/:id",
  asyncHandler(async (req, res) => {
    const data = parseBody(updateSchema, req.body);
    const category = await prisma.category.update({ where: { id: req.params.id }, data });
    res.json(category);
  }),
);

categoriesRouter.delete(
  "/categories/:id",
  asyncHandler(async (req, res) => {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);
