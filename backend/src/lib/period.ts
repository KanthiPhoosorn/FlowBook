import dayjs from "dayjs";

// Date/period helpers for budget cycles and reports.
// All math uses the process-local timezone (TZ in .env, default Asia/Bangkok).

export type Period = "DAILY" | "WEEKLY" | "MONTHLY";

// Half-open range [start, end): start inclusive, end exclusive.
export interface Range {
  start: Date;
  end: Date;
}

export function dayRange(ref: Date = new Date()): Range {
  const start = dayjs(ref).startOf("day");
  return { start: start.toDate(), end: start.add(1, "day").toDate() };
}

// weekStartsOn: 0 = Sunday, 1 = Monday (default).
export function weekRange(ref: Date = new Date(), weekStartsOn = 1): Range {
  const d = dayjs(ref);
  const diff = (d.day() - weekStartsOn + 7) % 7;
  const start = d.startOf("day").subtract(diff, "day");
  return { start: start.toDate(), end: start.add(7, "day").toDate() };
}

// Monthly cycle that starts on `startDay` (1-28). If today is before startDay,
// the current cycle began in the previous month.
export function monthRange(ref: Date = new Date(), startDay = 1): Range {
  const sd = Math.min(Math.max(Math.trunc(startDay), 1), 28);
  const d = dayjs(ref);
  let start = d.date(sd).startOf("day");
  if (d.date() < sd) start = start.subtract(1, "month");
  return { start: start.toDate(), end: start.add(1, "month").toDate() };
}

export interface PeriodOpts {
  ref?: Date;
  startDay?: number; // for MONTHLY
  weekStartsOn?: number; // for WEEKLY
}

export function periodRange(period: Period, opts: PeriodOpts = {}): Range {
  const ref = opts.ref ?? new Date();
  switch (period) {
    case "DAILY":
      return dayRange(ref);
    case "WEEKLY":
      return weekRange(ref, opts.weekStartsOn ?? 1);
    case "MONTHLY":
    default:
      return monthRange(ref, opts.startDay ?? 1);
  }
}

// Calendar month (year, month 1-12) — used by monthly reports.
export function calendarMonthRange(year: number, month1to12: number): Range {
  const start = dayjs(new Date(year, month1to12 - 1, 1)).startOf("day");
  return { start: start.toDate(), end: start.add(1, "month").toDate() };
}

// Parse a YYYY-MM-DD (or any dayjs-parseable) string into a Date, or undefined.
export function parseDate(s?: string | null): Date | undefined {
  if (!s) return undefined;
  const d = dayjs(s);
  return d.isValid() ? d.toDate() : undefined;
}

// Inclusive list of YYYY-MM-DD day labels covering a range — handy for graph axes.
export function dayLabels(range: Range): string[] {
  const labels: string[] = [];
  let cur = dayjs(range.start).startOf("day");
  const end = dayjs(range.end);
  while (cur.isBefore(end)) {
    labels.push(cur.format("YYYY-MM-DD"));
    cur = cur.add(1, "day");
  }
  return labels;
}

export function ymd(d: Date): string {
  return dayjs(d).format("YYYY-MM-DD");
}
