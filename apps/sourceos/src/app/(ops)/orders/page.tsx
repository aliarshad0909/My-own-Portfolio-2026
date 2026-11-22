import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { documents, purchaseOrders, shipments, suppliers } from "@/db/schema";
import { OrdersClient } from "@/components/OrdersClient";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const db = await getDb();
  const [poRows, shipmentRows, docRows, supplierRows] = await Promise.all([
    db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt)),
    db.select().from(shipments).orderBy(desc(shipments.createdAt)),
    db.select().from(documents).orderBy(desc(documents.createdAt)),
    db.select().from(suppliers).orderBy(desc(suppliers.rating)),
  ]);

  const supMap = new Map(supplierRows.map((s) => [s.id, s]));
  const poMap = new Map(poRows.map((p) => [p.id, p]));

  const enrichedPos = poRows.map((p) => ({
    ...p,
    supplierName: supMap.get(p.supplierId)?.name ?? "Unknown Supplier",
    supplierCountry: supMap.get(p.supplierId)?.country ?? "—",
  }));

  const enrichedShipments = shipmentRows.map((s) => {
    const po = poMap.get(s.poId);
    const sup = po ? supMap.get(po.supplierId) : undefined;
    return {
      ...s,
      poNumber: po?.poNumber ?? "N/A",
      itemName: po?.itemName ?? "Cargo",
      supplierName: sup?.name ?? "Unknown Supplier",
    };
  });

  return (
    <OrdersClient
      initialPos={enrichedPos}
      initialShipments={enrichedShipments}
      initialDocuments={docRows}
      suppliers={supplierRows}
    />
  );
}
