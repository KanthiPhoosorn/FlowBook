import "dotenv/config";
import { prisma } from "../src/db";

// Stable id so requests.http / the frontend can hard-code the demo tenant.
const SHOP_ID = "demo-shop";

const expenseCategories = [
  { name: "วัตถุดิบ/ของสด", icon: "🥬", keywords: "วัตถุดิบ,ของสด,ผัก,ผลไม้,เนื้อ,หมู,ไก่,กุ้ง,ปลา,ไข่,นม,ตลาด" },
  { name: "ของใช้ในร้าน", icon: "🧴", keywords: "ของใช้,อุปกรณ์,แก้ว,หลอด,ถุง,กระดาษ,ทิชชู่,น้ำยา" },
  { name: "น้ำแข็ง", icon: "🧊", keywords: "น้ำแข็ง,ice" },
  { name: "ค่าน้ำค่าไฟ", icon: "💡", keywords: "ค่าน้ำ,ค่าไฟ,ค่าไฟฟ้า,ประปา,น้ำประปา,ค่าแก๊ส,แก๊ส" },
  { name: "ค่าเช่า", icon: "🏠", keywords: "ค่าเช่า,เช่าที่,เช่าร้าน,rent" },
  { name: "เงินเดือนพนักงาน", icon: "👷", keywords: "เงินเดือน,ค่าแรง,ค่าจ้าง,salary,พนักงาน,ลูกจ้าง" },
  { name: "การตลาด/โฆษณา", icon: "📣", keywords: "โฆษณา,การตลาด,ads,โปรโมท,ป้าย,บูสต์" },
  { name: "ค่าขนส่ง/เดินทาง", icon: "🛵", keywords: "ค่าส่ง,ขนส่ง,เดินทาง,น้ำมัน,วิน,แท็กซี่,grab,ส่งของ,เดลิเวอรี" },
  { name: "อุปกรณ์/ซ่อมบำรุง", icon: "🔧", keywords: "ซ่อม,อะไหล่,เครื่องมือ,บำรุง,maintenance" },
  { name: "ภาษี/ค่าธรรมเนียม", icon: "🧾", keywords: "ภาษี,ค่าธรรมเนียม,fee,tax,vat" },
  { name: "อื่นๆ (รายจ่าย)", icon: "📦", keywords: "" },
];

const incomeCategories = [
  { name: "ขายหน้าร้าน", icon: "🏪", keywords: "ขายหน้าร้าน,หน้าร้าน,ขายของ,ยอดขาย,ขาย,ขายดี" },
  { name: "ขายออนไลน์", icon: "📱", keywords: "ออนไลน์,online,เพจ,ไลน์,line,shopee,lazada,เดลิเวอรี,delivery,grab" },
  { name: "รายได้อื่น", icon: "💰", keywords: "รายได้อื่น,ดอกเบี้ย,เงินคืน,refund,ทิป" },
];

const paymentMethods = [
  { name: "เงินสด", kind: "CASH", keywords: "เงินสด,cash", isDefault: true },
  { name: "โอนธนาคาร", kind: "BANK", keywords: "โอน,เงินโอน,ธนาคาร,bank,พร้อมเพย์,promptpay,scb,kbank,ktb,bbl" },
  { name: "บัตรเครดิต", kind: "CREDIT", keywords: "บัตร,บัตรเครดิต,credit,รูดบัตร" },
  { name: "e-Wallet", kind: "EWALLET", keywords: "วอลเล็ต,wallet,ทรูมันนี่,truemoney,รับบิท,rabbit,linepay,shopeepay" },
];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  const shop = await prisma.shop.upsert({
    where: { id: SHOP_ID },
    update: {},
    create: { id: SHOP_ID, name: "ร้านกาแฟ FlowBook (เดโม)", plan: "PRO" },
  });

  // SQLite createMany has no skipDuplicates, so guard with count checks to stay re-runnable.
  if ((await prisma.category.count({ where: { shopId: SHOP_ID } })) === 0) {
    await prisma.category.createMany({
      data: [
        ...expenseCategories.map((c) => ({ shopId: SHOP_ID, type: "EXPENSE", isDefault: true, ...c })),
        ...incomeCategories.map((c) => ({ shopId: SHOP_ID, type: "INCOME", isDefault: true, ...c })),
      ],
    });
  }

  if ((await prisma.paymentMethod.count({ where: { shopId: SHOP_ID } })) === 0) {
    await prisma.paymentMethod.createMany({
      data: paymentMethods.map((p) => ({ shopId: SHOP_ID, ...p })),
    });
  }

  // Look up ids for sample data + the demo budget.
  const cats = await prisma.category.findMany({ where: { shopId: SHOP_ID } });
  const pms = await prisma.paymentMethod.findMany({ where: { shopId: SHOP_ID } });
  const catId = (name: string) => cats.find((c) => c.name === name)?.id;
  const pmId = (name: string) => pms.find((p) => p.name === name)?.id;

  // Only seed sample transactions once (so re-running seed without reset stays clean).
  const existingTx = await prisma.transaction.count({ where: { shopId: SHOP_ID } });
  if (existingTx === 0) {
    await prisma.transaction.createMany({
      data: [
        { shopId: SHOP_ID, type: "INCOME", amount: 3500, categoryId: catId("ขายหน้าร้าน"), paymentMethodId: pmId("เงินสด"), source: "POS", note: "ยอดขายหน้าร้าน", occurredAt: daysAgo(0) },
        { shopId: SHOP_ID, type: "INCOME", amount: 1200, categoryId: catId("ขายออนไลน์"), paymentMethodId: pmId("โอนธนาคาร"), source: "POS", note: "ออเดอร์เดลิเวอรี", occurredAt: daysAgo(0) },
        { shopId: SHOP_ID, type: "EXPENSE", amount: 800, categoryId: catId("วัตถุดิบ/ของสด"), paymentMethodId: pmId("เงินสด"), source: "TEXT", note: "ตลาดเช้า", occurredAt: daysAgo(0) },
        { shopId: SHOP_ID, type: "EXPENSE", amount: 50, categoryId: catId("น้ำแข็ง"), paymentMethodId: pmId("เงินสด"), source: "TEXT", note: "ค่าน้ำแข็ง", occurredAt: daysAgo(0) },
        { shopId: SHOP_ID, type: "INCOME", amount: 2800, categoryId: catId("ขายหน้าร้าน"), paymentMethodId: pmId("เงินสด"), source: "POS", occurredAt: daysAgo(1) },
        { shopId: SHOP_ID, type: "EXPENSE", amount: 9000, categoryId: catId("เงินเดือนพนักงาน"), paymentMethodId: pmId("โอนธนาคาร"), source: "MANUAL", note: "เงินเดือนรอบกลางเดือน", occurredAt: daysAgo(2) },
      ],
    });
  }

  // Demo budgets: one category budget + one overall monthly budget.
  const existingBudgets = await prisma.budget.count({ where: { shopId: SHOP_ID } });
  if (existingBudgets === 0) {
    await prisma.budget.createMany({
      data: [
        { shopId: SHOP_ID, categoryId: catId("วัตถุดิบ/ของสด"), period: "MONTHLY", amount: 15000 },
        { shopId: SHOP_ID, categoryId: null, period: "MONTHLY", amount: 40000 },
      ],
    });
  }

  const counts = {
    shop: shop.name,
    categories: cats.length,
    paymentMethods: pms.length,
    transactions: await prisma.transaction.count({ where: { shopId: SHOP_ID } }),
    budgets: await prisma.budget.count({ where: { shopId: SHOP_ID } }),
  };
  console.log("✅ Seed complete:", JSON.stringify(counts, null, 2));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
