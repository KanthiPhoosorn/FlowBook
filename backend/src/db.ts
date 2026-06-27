import { PrismaClient } from "@prisma/client";

// Single shared Prisma client for the whole process.
export const prisma = new PrismaClient();

export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}
