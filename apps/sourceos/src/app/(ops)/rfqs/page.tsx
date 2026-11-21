import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { quotations, rfqs, suppliers } from "@/db/schema";
import { RfqsClient } from "@/components/RfqsClient";

export const dynamic = "force-dynamic";

export default async function RfqsPage() {
  const db = await getDb();
  const [rfqRows, quoteRows, supplierRows] = await Promise.all([
    db.select().from(rfqs).orderBy(desc(rfqs.createdAt)),
    db.select().from(quotations).orderBy(desc(quotations.createdAt)),
    db.select().from(suppliers).orderBy(desc(suppliers.rating)),
  ]);

  const supplierMap = new Map(supplierRows.map((s) => [s.id, s]));

  const enrichedRfqs = rfqRows.map((rfq) => ({
    ...rfq,
    quotations: quoteRows
      .filter((q) => q.rfqId === rfq.id)
      .map((q) => {
        const sup = supplierMap.get(q.supplierId);
        return {
          ...q,
          supplierName: sup?.name ?? "Unknown Supplier",
          supplierCountry: sup?.country ?? "—",
          supplierRating: sup?.rating ?? 0,
          supplierOnTimePct: sup?.onTimePct ?? 0,
          supplierStatus: sup?.qualificationStatus ?? "under_review",
          estimatedTotalCents:
            Math.max(rfq.targetQty, q.moq) * q.unitPriceCents + q.freightEstimateCents,
        };
      }),
  }));

  return <RfqsClient initialRfqs={enrichedRfqs} suppliers={supplierRows} />;
}
