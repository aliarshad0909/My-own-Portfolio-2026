import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { suppliers } from "@/db/schema";
import { SuppliersClient } from "@/components/SuppliersClient";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const db = await getDb();
  const rows = await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
  return <SuppliersClient initialSuppliers={rows} />;
}
