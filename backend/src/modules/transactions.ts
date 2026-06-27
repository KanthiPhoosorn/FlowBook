import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { asyncHandler, parseBody, HttpError } from "../lib/http";
import { ensureShop, loadParseRefs } from "../lib/guards";
import { parseEntry } from "../lib/parser";

export const transactionsRouter = Router();

const createSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive(),
  categoryId: z.string().nullable().optional(),
  paymentMethodId: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  source: z.string().optional(),
  occurredAt: z.coerce.date().optional(),
});
const updateSchema = createSchema.partial();

function dateRange(from?: unknown, to?: unknown) {
  const range: { gte?: Date; lt?: Date } = {};
  if (from) {
    const d = new Date(String(from));
    if (!Number.isNaN(d.getTime())) range.gte = d;
  }
  if (to) {
    const d = new Date(String(to));
    if (!Number.isNaN(d.getTime())) range.lt = d;
  }
  return Object.keys(range).length ? range : undefined;
}

// GET /api/shops/:shopId/transactions?type=&from=&to=&categoryId=&limit=
transactionsRouter.get(
  "/shops/:shopId/transactions",
  asyncHandler(async (req, res) => {
    const { type, categoryId, from, to } = req.query;
    const take = Math.min(Number(req.query.limit) || 100, 500);
    const occurredAt = dateRange(from, to);
    const transactions = await prisma.transaction.findMany({
      where: {
        shopId: req.params.shopId,
        ...(type ? { type: String(type) } : {}),
        ...(categoryId ? { categoryId: String(categoryId) } : {}),
        ...(occurredAt ? { occurredAt } : {}),
      },
      include: { category: true, paymentMethod: true },
      orderBy: { occurredAt: "desc" },
      take,
    });
    res.json(transactions);
  }),
);

transactionsRouter.post(
  "/shops/:shopId/transactions",
  asyncHandler(async (req, res) => {
    await ensureShop(req.params.shopId);
    const data = parseBody(createSchema, req.body);
    const transaction = await prisma.transaction.create({
      data: { shopId: req.params.shopId, source: "MANUAL", ...data },
      include: { category: true, paymentMethod: true },
    });
    res.status(201).json(transaction);
  }),
);

// Preview the Thai parser without saving.
transactionsRouter.post(
  "/shops/:shopId/transactions/parse",
  asyncHandler(async (req, res) => {
    await ensureShop(req.params.shopId);
    const { text } = parseBody(z.object({ text: z.string().min(1) }), req.body);
    const refs = await loadParseRefs(req.params.shopId);
    res.json(parseEntry(text, refs));
  }),
);

// Record an entry from a receipt image / slip / voice note.
// OCR/ASR is upstream: pass the recognised text as ocrText / transcript and it is
// parsed by the Thai parser. Manual fields override the parsed values.
const uploadSchema = z.object({
  kind: z.enum(["IMAGE", "SLIP", "VOICE"]),
  ocrText: z.string().optional(),
  transcript: z.string().optional(),
  amount: z.number().positive().optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  categoryId: z.string().optional(),
  paymentMethodId: z.string().optional(),
  note: z.string().optional(),
  path: z.string().optional(),
  occurredAt: z.coerce.date().optional(),
});

transactionsRouter.post(
  "/shops/:shopId/transactions/upload",
  asyncHandler(async (req, res) => {
    await ensureShop(req.params.shopId);
    const body = parseBody(uploadSchema, req.body);
    const text = body.ocrText ?? body.transcript;
    const parsed = text ? parseEntry(text, await loadParseRefs(req.params.shopId)) : null;

    const amount = body.amount ?? parsed?.amount ?? null;
    if (amount === null) {
      throw new HttpError(400, "ระบุจำนวนเงินไม่ได้ — ส่ง amount มาเอง หรือส่ง ocrText/transcript ที่มีตัวเลข");
    }

    const transaction = await prisma.transaction.create({
      data: {
        shopId: req.params.shopId,
        source: body.kind,
        type: body.type ?? parsed?.type ?? "EXPENSE",
        amount,
        categoryId: body.categoryId ?? parsed?.categoryId ?? null,
        paymentMethodId: body.paymentMethodId ?? parsed?.paymentMethodId ?? null,
        note: body.note ?? parsed?.note ?? null,
        occurredAt: body.occurredAt,
        attachments: { create: [{ kind: body.kind, path: body.path, parsedText: text }] },
      },
      include: { category: true, paymentMethod: true, attachments: true },
    });
    res.status(201).json({ transaction, parsed });
  }),
);

transactionsRouter.patch(
  "/transactions/:id",
  asyncHandler(async (req, res) => {
    const data = parseBody(updateSchema, req.body);
    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data,
      include: { category: true, paymentMethod: true },
    });
    res.json(transaction);
  }),
);

transactionsRouter.delete(
  "/transactions/:id",
  asyncHandler(async (req, res) => {
    await prisma.transaction.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);
