// Standalone parser test (no test framework). Run: npm run test:parser
import { parseEntry, ParseRefs } from "./parser";

const refs: ParseRefs = {
  categories: [
    { id: "c-icehouse", name: "น้ำแข็ง", type: "EXPENSE", keywords: "น้ำแข็ง,ice" },
    { id: "c-material", name: "วัตถุดิบ/ของสด", type: "EXPENSE", keywords: "วัตถุดิบ,ของสด,ตลาด,ผัก" },
    { id: "c-util", name: "ค่าน้ำค่าไฟ", type: "EXPENSE", keywords: "ค่าน้ำ,ค่าไฟ" },
    { id: "c-salary", name: "เงินเดือนพนักงาน", type: "EXPENSE", keywords: "เงินเดือน,ค่าแรง" },
    { id: "c-sale", name: "ขายหน้าร้าน", type: "INCOME", keywords: "ขาย,ขายของ,ยอดขาย" },
    { id: "c-other-income", name: "รายได้อื่น", type: "INCOME", keywords: "ทิป,ดอกเบี้ย" },
  ],
  paymentMethods: [
    { id: "p-cash", name: "เงินสด", keywords: "เงินสด,cash" },
    { id: "p-bank", name: "โอนธนาคาร", keywords: "โอน,ธนาคาร,promptpay" },
    { id: "p-credit", name: "บัตรเครดิต", keywords: "บัตร,เครดิต,credit" },
  ],
};

interface Case {
  text: string;
  type: "INCOME" | "EXPENSE";
  amount: number | null;
  categoryId: string | null;
  paymentMethodId: string | null;
}

const cases: Case[] = [
  { text: "ค่าน้ำแข็ง 50 บาท เงินสด", type: "EXPENSE", amount: 50, categoryId: "c-icehouse", paymentMethodId: "p-cash" },
  { text: "ขายของ 3500 บาท เงินสด", type: "INCOME", amount: 3500, categoryId: "c-sale", paymentMethodId: "p-cash" },
  { text: "วัตถุดิบ ตลาดเช้า 1,200 โอน", type: "EXPENSE", amount: 1200, categoryId: "c-material", paymentMethodId: "p-bank" },
  { text: "ค่าไฟ 2k", type: "EXPENSE", amount: 2000, categoryId: "c-util", paymentMethodId: null },
  { text: "เงินเดือนพนักงาน 9000 โอน", type: "EXPENSE", amount: 9000, categoryId: "c-salary", paymentMethodId: "p-bank" },
  { text: "+1500 ทิป", type: "INCOME", amount: 1500, categoryId: "c-other-income", paymentMethodId: null },
  { text: "กาแฟ 45 บัตร", type: "EXPENSE", amount: 45, categoryId: null, paymentMethodId: "p-credit" },
];

let failed = 0;
for (const c of cases) {
  const r = parseEntry(c.text, refs);
  const errs: string[] = [];
  if (r.type !== c.type) errs.push(`type ${r.type}≠${c.type}`);
  if (r.amount !== c.amount) errs.push(`amount ${r.amount}≠${c.amount}`);
  if (r.categoryId !== c.categoryId) errs.push(`category ${r.categoryId}≠${c.categoryId}`);
  if (r.paymentMethodId !== c.paymentMethodId) errs.push(`payment ${r.paymentMethodId}≠${c.paymentMethodId}`);
  if (errs.length) {
    failed++;
    console.log(`❌ "${c.text}"\n   ${errs.join(", ")}`);
    console.log(`   got: ${JSON.stringify({ type: r.type, amount: r.amount, cat: r.categoryName, pm: r.paymentMethodName })}`);
  } else {
    console.log(`✅ "${c.text}"  →  ${r.type} ${r.amount} | ${r.categoryName ?? "-"} | ${r.paymentMethodName ?? "-"}`);
  }
}

console.log(`\n${cases.length - failed}/${cases.length} passed`);
process.exit(failed ? 1 : 0);
