import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { datasetRows, datasets } from "@/db/schema";
import { filterDatasetRows, serializeRowsToCsv } from "@/lib/analytics";
import { requireApiUser } from "@/lib/auth";
import { slugifyName } from "@/lib/security";

const uuidSchema = z.string().uuid();

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  if (!uuidSchema.safeParse(id).success) {
    return NextResponse.json({ error: "Invalid dataset ID." }, { status: 400 });
  }

  const db = await getDb();
  const [dataset] = await db.select().from(datasets).where(eq(datasets.id, id)).limit(1);
  if (!dataset) {
    return NextResponse.json({ error: "Dataset not found." }, { status: 404 });
  }

  const dbRows = await db
    .select({ dataJson: datasetRows.dataJson })
    .from(datasetRows)
    .where(eq(datasetRows.datasetId, id))
    .orderBy(asc(datasetRows.rowIndex));

  const url = new URL(request.url);
  const filterField = url.searchParams.get("filterField");
  const filterValue = url.searchParams.get("filterValue");
  const dateField = url.searchParams.get("dateField");
  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");

  const filtered = filterDatasetRows(
    dbRows.map((r) => r.dataJson),
    { filterField, filterValue, dateField, dateFrom, dateTo },
  );

  const columnNames = dataset.columnsJson.map((c) => c.name);
  const csvContent = serializeRowsToCsv(columnNames, filtered);
  const filename = `${slugifyName(dataset.name)}-export.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
