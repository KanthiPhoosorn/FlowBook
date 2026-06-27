import { Router } from "express";
import { notImplemented } from "../lib/http";

// ⛏️ Coder 2 — task 8. Verify X-Line-Signature (HMAC-SHA256 with LINE_CHANNEL_SECRET),
// map lineUserId -> shop, parseEntry(text), create a transaction, reply in Thai.
// Wrap @line/bot-sdk in src/line/client.ts and only instantiate when env is set.
export const lineRouter = Router();

lineRouter.post("/webhook", notImplemented("Coder 2", "task 8: LINE webhook"));
