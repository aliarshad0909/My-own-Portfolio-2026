import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { landedCostScenarios } from "@/db/schema";
import { LandedCostClient } from "@/components/LandedCostClient";

export const dynamic = "force-dynamic";

export default async function LandedCostPage() {
  const db = await getDb();
  const rows = await db
    .select()
    .from(landedCostScenarios)
    .orderBy(desc(landedCostScenarios.createdAt));

  return <LandedCostClient initialScenarios={rows} />;
}
