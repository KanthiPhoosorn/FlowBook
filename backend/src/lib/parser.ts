// Thai keyword/NLP parser: turns a free-text entry like "ค่าน้ำแข็ง 50 บาท เงินสด"
// into a structured transaction draft (type / amount / category / payment method / note).
//
// This is intentionally rule-based (fast, offline, explainable). For receipt images
// or voice notes, upstream OCR/ASR should produce text that is fed straight into here.

export type TxType = "INCOME" | "EXPENSE";

export interface CategoryRef {
  id: string;
  name: string;
  type: string; // INCOME | EXPENSE
  keywords?: string | null;
}

export interface PaymentMethodRef {
  id: string;
  name: string;
  keywords?: string | null;
}

export interface ParseRefs {
  categories: CategoryRef[];
  paymentMethods: PaymentMethodRef[];
}

export interface ParsedEntry {
  type: TxType;
  amount: number | null;
  categoryId: string | null;
  categoryName: string | null;
  paymentMethodId: string | null;
  paymentMethodName: string | null;
  note: string;
  rawText: string;
  confidence: number; // 0..1
  warnings: string[];
}

const CURRENCY_RE = /บาท|฿|thb/gi;
// number with optional thousands separators / decimals, plus an optional magnitude unit
const NUMBER_RE = /(\d[\d,]*(?:\.\d+)?)\s*(k|พัน|หมื่น|แสน|ล้าน)?/gi;

const INCOME_KEYWORDS = ["ขาย", "ยอดขาย", "รายรับ", "รายได้", "ได้รับ", "ได้เงิน", "โอนเข้า", "เงินเข้า", "ทิป"];
const EXPENSE_KEYWORDS = ["จ่าย", "ซื้อ", "ค่า"];

function unitMultiplier(unit?: string): number {
  switch ((unit ?? "").toLowerCase()) {
    case "k":
    case "พัน":
      return 1_000;
    case "หมื่น":
      return 10_000;
    case "แสน":
      return 100_000;
    case "ล้าน":
      return 1_000_000;
    default:
      return 1;
  }
}

interface AmountMatch {
  value: number;
  start: number;
  end: number;
}

function extractAmount(text: string): { amount: number | null; span?: [number, number] } {
  const matches: AmountMatch[] = [];
  NUMBER_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = NUMBER_RE.exec(text)) !== null) {
    const value = parseFloat(m[1].replace(/,/g, "")) * unitMultiplier(m[2]);
    if (!Number.isNaN(value)) {
      matches.push({ value, start: m.index, end: m.index + m[0].trimEnd().length });
    }
  }
  if (matches.length === 0) return { amount: null };

  // Prefer the number immediately before a currency token ("... 3500 บาท").
  CURRENCY_RE.lastIndex = 0;
  const cur = CURRENCY_RE.exec(text)?.index ?? -1;
  if (cur >= 0) {
    const before = matches.filter((x) => x.start <= cur);
    if (before.length) {
      const best = before[before.length - 1];
      return { amount: best.value, span: [best.start, best.end] };
    }
  }
  // Otherwise take the last number (common "item amount" order).
  const last = matches[matches.length - 1];
  return { amount: last.value, span: [last.start, last.end] };
}

function detectTypeHint(text: string): TxType | null {
  const t = text.trim();
  if (t.startsWith("+")) return "INCOME";
  if (t.startsWith("-")) return "EXPENSE";
  const low = t.toLowerCase();
  if (INCOME_KEYWORDS.some((k) => low.includes(k))) return "INCOME";
  if (EXPENSE_KEYWORDS.some((k) => low.includes(k))) return "EXPENSE";
  return null;
}

function keywordsOf(item: { name: string; keywords?: string | null }): string[] {
  const list = (item.keywords ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  list.push(item.name.toLowerCase());
  return list;
}

function matchItem<T extends { name: string; keywords?: string | null }>(
  text: string,
  items: T[],
): { item: T; keyword: string } | null {
  const low = text.toLowerCase();
  let best: { item: T; keyword: string; score: number } | null = null;
  for (const item of items) {
    for (const kw of keywordsOf(item)) {
      if (kw && low.includes(kw)) {
        const score = kw.length; // longer match wins
        if (!best || score > best.score) best = { item, keyword: kw, score };
      }
    }
  }
  return best ? { item: best.item, keyword: best.keyword } : null;
}

export function parseEntry(rawText: string, refs: ParseRefs): ParsedEntry {
  const text = (rawText ?? "").trim();
  const warnings: string[] = [];

  const { amount, span } = extractAmount(text);
  if (amount === null) warnings.push("ไม่พบจำนวนเงินในข้อความ");

  let type = detectTypeHint(text);

  const catMatch = matchItem(text, refs.categories);
  if (!type && catMatch) type = catMatch.item.type as TxType;
  if (!type) type = "EXPENSE";

  // Keep the chosen category consistent with the final type.
  let category: CategoryRef | null = catMatch?.item ?? null;
  if (category && category.type !== type) {
    const sameType = matchItem(
      text,
      refs.categories.filter((c) => c.type === type),
    );
    category = sameType?.item ?? null;
  }
  if (!category) warnings.push("ไม่พบหมวดหมู่ที่ตรงกัน");

  const pmMatch = matchItem(text, refs.paymentMethods);
  const paymentMethod = pmMatch?.item ?? null;

  // Build a human note: drop the amount span + currency words + leading +/- sign.
  let note = text;
  if (span) note = note.slice(0, span[0]) + note.slice(span[1]);
  note = note.replace(CURRENCY_RE, " ").replace(/^[\s+\-]+/, "");
  note = note.replace(/\s+/g, " ").trim();
  if (!note) note = category?.name ?? "";

  let confidence = 0.4;
  if (amount !== null) confidence += 0.3;
  if (category) confidence += 0.2;
  if (paymentMethod) confidence += 0.1;

  return {
    type,
    amount,
    categoryId: category?.id ?? null,
    categoryName: category?.name ?? null,
    paymentMethodId: paymentMethod?.id ?? null,
    paymentMethodName: paymentMethod?.name ?? null,
    note,
    rawText: text,
    confidence: Math.min(1, confidence),
    warnings,
  };
}
