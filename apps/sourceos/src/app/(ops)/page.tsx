import { getDb } from "@/db";
import { getDashboardSummary } from "@/lib/procurement";
import { DashboardClient } from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const db = await getDb();
  const summary = await getDashboardSummary(db);
  return <DashboardClient summary={summary} />;
}
