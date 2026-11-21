import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { activityLogs, datasetRows, datasets } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";

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

  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit") || "100");
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(500, Math.floor(limitParam))) : 100;
  const search = (url.searchParams.get("search") || "").trim().toLowerCase();

  const db = await getDb();
  const [dataset] = await db.select().from(datasets).where(eq(datasets.id, id)).limit(1);
  if (!dataset) {
    return NextResponse.json({ error: "Dataset not found." }, { status: 404 });
  }

  const allRows = await db
    .select({ rowIndex: datasetRows.rowIndex, dataJson: datasetRows.dataJson })
    .from(datasetRows)
    .where(eq(datasetRows.datasetId, id))
    .orderBy(asc(datasetRows.rowIndex));

  const filtered = search
    ? allRows.filter((r) =>
        Object.values(r.dataJson).some(
          (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(search),
        ),
      )
    : allRows;

  return NextResponse.json({
    dataset: {
      id: dataset.id,
      name: dataset.name,
      slug: dataset.slug,
      category: dataset.category,
      sourceType: dataset.sourceType,
      description: dataset.description,
      columns: dataset.columnsJson,
      rowCount: dataset.rowCount,
      validationSummary: dataset.validationSummary,
      createdAt: dataset.createdAt.toISOString(),
      updatedAt: dataset.updatedAt.toISOString(),
    },
    totalMatched: filtered.length,
    rows: filtered.slice(0, limit).map((r) => ({
      rowIndex: r.rowIndex,
      data: r.dataJson,
    })),
  });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

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

  await db.delete(datasets).where(eq(datasets.id, id));
  await db.insert(activityLogs).values({
    userId: auth.user.id,
    action: "dataset.deleted",
    entityType: "dataset",
    entityId: id,
    summary: `Removed dataset "${dataset.name}" (${dataset.rowCount} rows).`,
  });

  return NextResponse.json({ ok: true });
}
