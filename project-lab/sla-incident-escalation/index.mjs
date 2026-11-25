const TARGET_MIN = { P1: 30, P2: 120, P3: 480, P4: 1440 };

export function evaluateSlaQueue(tickets, nowMs) {
  return tickets.map((t) => {
    const budget = TARGET_MIN[t.priority] || 480;
    const elapsedMin = Math.max(0, Math.round((nowMs - Date.parse(t.createdAt)) / 60_000));
    const burnPct = Math.round((elapsedMin / budget) * 100);
    const state = burnPct >= 100 ? "breached" : burnPct >= 75 ? "at_risk" : "healthy";
    const route = state === "breached" ? "page_duty_lead" : state === "at_risk" ? "slack_priority_alert" : "normal_queue";
    return { id: t.id, priority: t.priority, elapsedMin, budget, burnPct, state, route };
  }).sort((a, b) => b.burnPct - a.burnPct);
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  const now = Date.parse("2026-11-24T12:00:00Z");
  console.log(JSON.stringify(evaluateSlaQueue([{ id: "T-1", priority: "P1", createdAt: "2026-11-24T11:35:00Z" }], now), null, 2));
}
