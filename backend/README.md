# FlowBook — Backend

ระบบหลังบ้านของ **FlowBook**: เครื่องมือบันทึก **รายรับ–รายจ่าย** สำหรับร้านค้า (ฟีเจอร์ครบแบบ "ป้านวล") + รับยอดขายจาก **POS** ผ่าน REST API + คำนวณ **กำไรสุทธิ (P&L) แบบเรียลไทม์** พร้อม **LINE webhook** (ออปชัน)

> ภาพรวมธุรกิจ + **การแบ่งงานทีม (2 coders) และสถานะงานทั้งหมด** อยู่ที่ [`../README.md`](../README.md) — สรุป: **Coder 1 (Kanthi)** = tasks 1–5 (ฐานราก + โมดูลหลัก), **Coder 2** = tasks 6–9 (งบ/รายงาน/เชื่อมต่อ) · สเปกงานของ Coder 2 แบบลงมือได้อยู่ที่ท้ายไฟล์นี้

**Stack:** TypeScript · Express · Prisma + SQLite · zod · dayjs · exceljs · node-cron · @line/bot-sdk

---

## 🚀 เริ่มต้นใช้งาน (Getting started)

```bash
cd backend
npm install                 # ติดตั้ง dependencies
cp .env.example .env         # (Windows: copy .env.example .env)
npm run db:push              # สร้างตารางใน SQLite ตาม schema
npm run db:seed              # ใส่ข้อมูลเดโม (ร้าน demo-shop + หมวดหมู่ + ตัวอย่าง)
npm run dev                  # รัน dev server ที่ http://localhost:4000
```

ทดสอบเร็ว ๆ:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/shops/demo-shop/categories
```

### Scripts

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | รัน server แบบ auto-reload (tsx watch) |
| `npm start` | รัน server ปกติ |
| `npm run db:push` | sync schema → SQLite |
| `npm run db:seed` | ใส่ข้อมูลเดโม |
| `npm run db:reset` | ล้าง DB + push + seed ใหม่ *(สำหรับ dev เท่านั้น)* |
| `npm run test:parser` | ทดสอบตัวแยกข้อความไทยแบบ standalone |
| `npm run typecheck` | ตรวจชนิดข้อมูลด้วย tsc |

### Environment (`.env`)

| ตัวแปร | ค่าเริ่มต้น | หมายเหตุ |
|---|---|---|
| `PORT` | `4000` | พอร์ต HTTP |
| `DATABASE_URL` | `file:./dev.db` | ไฟล์ SQLite (อ้างอิงจาก `prisma/`) |
| `TZ` | `Asia/Bangkok` | ใช้คำนวณรอบงบ/รายงาน |
| `ENABLE_SCHEDULER` | `true` | เปิด/ปิด cron (auto-log + reminder) |
| `LINE_CHANNEL_ACCESS_TOKEN` / `LINE_CHANNEL_SECRET` | (ว่าง) | ใส่เมื่อจะต่อ LINE จริง ปล่อยว่างได้ |

---

## 🗂️ โครงสร้างโปรเจกต์

```
backend/
├── prisma/
│   ├── schema.prisma     # โมเดลข้อมูลทั้งหมด               [Coder 1]
│   ├── seed.ts           # ข้อมูลเดโมภาษาไทย                [Coder 1]
│   └── dev.db            # ไฟล์ SQLite (gitignored)
├── src/
│   ├── index.ts          # bootstrap Express + mount routers [Coder 1]
│   ├── db.ts             # Prisma client                     [Coder 1]
│   ├── lib/
│   │   ├── parser.ts     # ตัวแยกข้อความไทย → ธุรกรรม        [Coder 1]
│   │   ├── period.ts     # รอบงบ/วันที่                      [Coder 1]
│   │   └── http.ts       # helper: asyncHandler / error      [Coder 1]
│   ├── modules/
│   │   ├── categories.ts        # ✅ Coder 1
│   │   ├── paymentMethods.ts    # ✅ Coder 1
│   │   ├── transactions.ts      # ✅ Coder 1
│   │   ├── budgets.ts           # ⛏️ Coder 2 (task 6)
│   │   ├── autolog.ts           # ⛏️ Coder 2 (task 6)
│   │   ├── reports.ts           # ⛏️ Coder 2 (task 7)
│   │   ├── export.ts            # ⛏️ Coder 2 (task 7)
│   │   └── pos.ts               # ⛏️ Coder 2 (task 8)
│   ├── line/                    # ⛏️ Coder 2 (task 8): webhook + client
│   └── scheduler/               # ⛏️ Coder 2 (task 6): node-cron jobs
└── requests.http                # ตัวอย่างการเรียก API
```

---

## 📡 API ที่ทำแล้ว (Coder 1)

ทุก endpoint รับ/ส่ง JSON (UTF-8). tenant เดโมคือ `shopId = demo-shop`

| Method | Path | ทำอะไร |
|---|---|---|
| `GET` | `/health` | เช็คว่า server ทำงาน |
| `POST` | `/api/shops` | สร้างร้าน |
| `GET` | `/api/shops/:shopId` | ดูข้อมูลร้าน + การตั้งค่า |
| `PATCH` | `/api/shops/:shopId` | แก้ plan / reminder / วันเริ่มรอบงบ |
| `GET` `POST` | `/api/shops/:shopId/categories` | หมวดหมู่ |
| `PATCH` `DELETE` | `/api/categories/:id` | แก้/ลบหมวดหมู่ |
| `GET` `POST` | `/api/shops/:shopId/payment-methods` | ช่องทางจ่าย |
| `PATCH` `DELETE` | `/api/payment-methods/:id` | แก้/ลบช่องทางจ่าย |
| `GET` `POST` | `/api/shops/:shopId/transactions` | ธุรกรรม (filter: `?type=&from=&to=&categoryId=`) |
| `PATCH` `DELETE` | `/api/transactions/:id` | แก้/ลบธุรกรรม |
| `POST` | `/api/shops/:shopId/transactions/parse` | พรีวิวการแยกข้อความไทย (ไม่บันทึก) |
| `POST` | `/api/shops/:shopId/transactions/upload` | บันทึกจากรูป/สลิป/เสียง (รับ `ocrText`/`transcript`) |

ตัวอย่าง `/parse`:

```jsonc
// POST /api/shops/demo-shop/transactions/parse   { "text": "ค่าน้ำแข็ง 50 บาท เงินสด" }
{
  "type": "EXPENSE", "amount": 50,
  "categoryName": "น้ำแข็ง", "paymentMethodName": "เงินสด",
  "note": "ค่าน้ำแข็ง", "confidence": 1, "warnings": []
}
```

---

## ⛏️ งานของ Coder 2 (สเปกพร้อมลงมือ)

ทุกโมดูลต่อยอดจาก schema + `parser.ts` + `period.ts` ที่มีแล้ว เขียน router แล้ว `mount` ใน `src/index.ts` ตามแพทเทิร์นเดียวกับโมดูลของ Coder 1 (ตอนนี้ endpoint เหล่านี้มี **stub ตอบ `501 Not Implemented`** ไว้ให้แล้ว — แค่เติม logic)

### Task 6 — Budgets + AutoLog + Reminders + Scheduler
ไฟล์: `src/modules/budgets.ts`, `src/modules/autolog.ts`, `src/scheduler/index.ts`
- **Budgets:** CRUD + `GET /api/shops/:shopId/budgets/status` → คำนวณ "ใช้ไป vs งบ" ของรอบปัจจุบัน โดยใช้ `periodRange(period, { startDay: shop.budgetStartDay })` จาก `period.ts` คืน `{ amount, spent, remaining, pct, overBudget }`
- **AutoLog:** CRUD รายการจดอัตโนมัติ **จำกัด ≤ 20 ต่อร้าน** (เกินให้ตอบ 400) + `POST .../autolog/:id/run` สร้างธุรกรรม `source="AUTO"` แล้วอัปเดต `lastRunAt`
- **Scheduler:** `node-cron` รันทุกนาที — ยิงกฎ auto-log ที่ถึงกำหนด + ส่ง reminder ให้ร้านที่ `reminderEnabled` ตรงเวลา `reminderTime` ปิดได้ด้วย `ENABLE_SCHEDULER=false` และ export `startScheduler()` ให้ `index.ts` เรียก

### Task 7 — Reports + P&L + Export
ไฟล์: `src/modules/reports.ts`, `src/modules/export.ts`
- `GET .../reports/summary?period=&date=` → `{ income, expense, net, count }`
- `GET .../reports/monthly?month=YYYY-MM` → ยอดรวม + แยกตามหมวด (`byCategory`) + รายวันสำหรับกราฟ (`byDay`)
- `GET .../reports/pl?from=&to=` → **งบกำไรขาดทุน**: รายรับรวม − รายจ่าย(แยกหมวด) = กำไรสุทธิ
- `GET .../reports/graph?from=&to=` → `{ labels[], income[], expense[], net[] }` ใช้ `dayLabels()` จาก `period.ts`
- **Export:** `GET .../export/csv` และ `.../export/xlsx` (ใช้ `exceljs`: sheet ธุรกรรม + sheet สรุป P&L, ตั้ง `Content-Disposition: attachment`)

### Task 8 — POS ingestion + LINE webhook
ไฟล์: `src/modules/pos.ts`, `src/line/webhook.ts`, `src/line/client.ts`
- **POS:** `POST /api/pos/sales` body `{ shopId, externalRef, occurredAt?, items:[{name,qty,unitPrice}] }` → สร้างธุรกรรม INCOME (`source="POS"`) + `SaleItem` หลายรายการ **idempotent บน `externalRef`**
- **LINE:** `POST /line/webhook` — ตรวจ `X-Line-Signature` (HMAC-SHA256 ด้วย `LINE_CHANNEL_SECRET`) → map `lineUserId` → ร้าน → `parseEntry(text)` → สร้างธุรกรรม → ตอบกลับ **ภาษาไทย** เช่น `บันทึกแล้ว ✅ ค่าน้ำแข็ง 50 บาท (เงินสด)` ห่อ `@line/bot-sdk` ใน `client.ts` (สร้าง instance เฉพาะเมื่อมี env)

---

## ⚠️ สิ่งที่เป็น "โครง" รอต่อ provider

- **OCR ใบเสร็จ/สลิป** และ **ASR เสียง** — endpoint `/upload` ทำงานได้โดย "รับข้อความที่ถอดมาแล้ว" (`ocrText` / `transcript`) แล้วส่งเข้า `parser.ts` ตัวถอดรูป/เสียงจริงต้องเสียบ provider เพิ่ม (เช่น Google Vision / Cloud Speech)
- **LINE แบบสด** — ต้องมี channel credentials + URL public (เช่น ngrok) ตอนนี้ตัวแยกข้อความไทย **ทำงานจริงและมีเทสต์** ทดสอบได้โดยไม่ต้องต่อ LINE
