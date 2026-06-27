import { prisma } from "../db";
import { HttpError } from "./http";

// Ensure a shop exists, returning it; otherwise throw a 404.
export async function ensureShop(shopId: string) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new HttpError(404, "Shop not found");
  return shop;
}

// Load the reference data the Thai parser needs for a shop.
export async function loadParseRefs(shopId: string) {
  const [categories, paymentMethods] = await Promise.all([
    prisma.category.findMany({ where: { shopId } }),
    prisma.paymentMethod.findMany({ where: { shopId } }),
  ]);
  return { categories, paymentMethods };
}
