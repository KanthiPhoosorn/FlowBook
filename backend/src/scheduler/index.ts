// ⛏️ Coder 2 — task 6. Register node-cron jobs here (auto-log runner + daily reminders).
// Called once from src/index.ts after the server starts.
export function startScheduler(): void {
  if (process.env.ENABLE_SCHEDULER === "false") {
    console.log("[scheduler] disabled (ENABLE_SCHEDULER=false)");
    return;
  }
  // TODO (Coder 2): cron('* * * * *') -> fire due AutoLogRules + push reminders.
  console.log("[scheduler] ready — no jobs registered yet (Coder 2, task 6)");
}
