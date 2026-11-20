import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { activities, contacts, deals, leads, users } from "@/db/schema";
import { DEAL_STAGES, LEAD_SOURCES } from "@/lib/constants";

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
}

function lastNMonthKeys(n: number): string[] {
  const now = new Date();
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push(monthKey(d));
  }
  return out;
}

export async function getDashboardData() {
  const db = await getDb();
  const [allContacts, allLeads, allDeals, allActivities, allUsers] = await Promise.all([
    db.select().from(contacts),
    db.select().from(leads),
    db.select().from(deals),
    db.select().from(activities).orderBy(desc(activities.createdAt)),
    db.select({ id: users.id, name: users.name, avatarColor: users.avatarColor, role: users.role }).from(users),
  ]);

  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const contactMap = new Map(allContacts.map((c) => [c.id, c]));
  const dealMap = new Map(allDeals.map((d) => [d.id, d]));

  const activeDeals = allDeals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const wonDeals = allDeals.filter((d) => d.stage === "won");
  const lostDeals = allDeals.filter((d) => d.stage === "lost");
  const closedCount = wonDeals.length + lostDeals.length;

  const pipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);
  const weightedPipelineValue = activeDeals.reduce((sum, d) => sum + Math.round((d.value * d.probability) / 100), 0);
  const totalWonRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const conversionRate = closedCount > 0 ? Math.round((wonDeals.length / closedCount) * 1000) / 10 : 0;

  const newLeadsCount = allLeads.filter((l) => l.status === "new" || l.status === "contacted").length;

  const months = lastNMonthKeys(6);
  const monthlyRevenue = months.map((key) => {
    const wonInMonth = wonDeals.filter((d) => monthKey(new Date(d.closedAt ?? d.updatedAt)) === key);
    const createdInMonth = allDeals.filter((d) => monthKey(new Date(d.createdAt)) === key);
    return {
      month: monthLabel(key),
      revenue: wonInMonth.reduce((s, d) => s + d.value, 0),
      dealsWon: wonInMonth.length,
      dealsCreated: createdInMonth.length,
    };
  });

  const enrichActivity = (a: (typeof allActivities)[number]) => {
    const c = a.contactId ? contactMap.get(a.contactId) : undefined;
    const d = a.dealId ? dealMap.get(a.dealId) : undefined;
    const u = a.ownerId ? userMap.get(a.ownerId) : undefined;
    return {
      ...a,
      contactName: c ? `${c.firstName} ${c.lastName}` : null,
      dealTitle: d ? d.title : null,
      ownerName: u?.name ?? "Unassigned",
    };
  };

  const recentActivities = allActivities.slice(0, 6).map(enrichActivity);
  const upcomingTasks = allActivities
    .filter((a) => a.status === "pending")
    .sort((a, b) => {
      const ta = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
      const tb = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
      return ta - tb;
    })
    .slice(0, 6)
    .map(enrichActivity);

  return {
    kpis: {
      totalContacts: allContacts.length,
      newLeads: newLeadsCount,
      totalLeads: allLeads.length,
      activeOpportunities: activeDeals.length,
      dealsWon: wonDeals.length,
      dealsLost: lostDeals.length,
      pipelineValue,
      weightedPipelineValue,
      totalWonRevenue,
      conversionRate,
    },
    monthlyRevenue,
    recentActivities,
    upcomingTasks,
  };
}

export async function getAnalyticsData() {
  const db = await getDb();
  const [allDeals, allLeads, allUsers, allActivities] = await Promise.all([
    db.select().from(deals),
    db.select().from(leads),
    db.select({ id: users.id, name: users.name, avatarColor: users.avatarColor }).from(users),
    db.select().from(activities),
  ]);

  const months = lastNMonthKeys(6);
  const monthlyDeals = months.map((key) => {
    const created = allDeals.filter((d) => monthKey(new Date(d.createdAt)) === key);
    const won = allDeals.filter((d) => d.stage === "won" && monthKey(new Date(d.closedAt ?? d.updatedAt)) === key);
    const lost = allDeals.filter((d) => d.stage === "lost" && monthKey(new Date(d.closedAt ?? d.updatedAt)) === key);
    return {
      month: monthLabel(key),
      created: created.length,
      won: won.length,
      lost: lost.length,
      revenue: won.reduce((sum, d) => sum + d.value, 0),
    };
  });

  const pipelineDistribution = DEAL_STAGES.map((stage) => {
    const matching = allDeals.filter((d) => d.stage === stage.id);
    return {
      stage: stage.id,
      label: stage.label,
      color: stage.color,
      count: matching.length,
      value: matching.reduce((sum, d) => sum + d.value, 0),
    };
  });

  const leadConversionBySource = LEAD_SOURCES.map((src) => {
    const matching = allLeads.filter((l) => l.source === src.id);
    const qualifiedOrConverted = matching.filter((l) => l.status === "qualified" || l.status === "converted");
    const converted = matching.filter((l) => l.status === "converted");
    return {
      source: src.id,
      label: src.label,
      total: matching.length,
      qualified: qualifiedOrConverted.length,
      converted: converted.length,
      conversionRate: matching.length > 0 ? Math.round((qualifiedOrConverted.length / matching.length) * 100) : 0,
    };
  });

  const leadFunnel = [
    { label: "Total Leads", count: allLeads.length },
    { label: "Contacted+", count: allLeads.filter((l) => l.status !== "new" && l.status !== "unqualified").length },
    { label: "Qualified+", count: allLeads.filter((l) => l.status === "qualified" || l.status === "converted").length },
    { label: "Converted to Deal", count: allLeads.filter((l) => l.status === "converted").length },
  ];

  const salesPerformance = allUsers.map((u) => {
    const ownedDeals = allDeals.filter((d) => d.ownerId === u.id);
    const won = ownedDeals.filter((d) => d.stage === "won");
    const lost = ownedDeals.filter((d) => d.stage === "lost");
    const open = ownedDeals.filter((d) => d.stage !== "won" && d.stage !== "lost");
    const closed = won.length + lost.length;
    const completedTasks = allActivities.filter((a) => a.ownerId === u.id && a.status === "completed").length;
    return {
      id: u.id,
      name: u.name,
      avatarColor: u.avatarColor,
      openDeals: open.length,
      pipelineValue: open.reduce((sum, d) => sum + d.value, 0),
      wonDeals: won.length,
      wonRevenue: won.reduce((sum, d) => sum + d.value, 0),
      winRate: closed > 0 ? Math.round((won.length / closed) * 100) : 0,
      completedTasks,
    };
  });

  const wonDeals = allDeals.filter((d) => d.stage === "won");
  const lostDeals = allDeals.filter((d) => d.stage === "lost");
  const avgDealSize = wonDeals.length > 0 ? Math.round(wonDeals.reduce((s, d) => s + d.value, 0) / wonDeals.length) : 0;

  return {
    summary: {
      totalRevenueWon: wonDeals.reduce((s, d) => s + d.value, 0),
      activePipelineValue: allDeals.filter((d) => d.stage !== "won" && d.stage !== "lost").reduce((s, d) => s + d.value, 0),
      avgDealSize,
      winRate: wonDeals.length + lostDeals.length > 0 ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 1000) / 10 : 0,
    },
    monthlyDeals,
    pipelineDistribution,
    leadFunnel,
    leadConversionBySource,
    salesPerformance,
  };
}

