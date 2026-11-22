import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { activityLogs, datasetRows, datasets, savedDashboards } from "@/db/schema";
import { runAnalyticsQuery, serializeRowsToCsv } from "@/lib/analytics";
import { requireApiUser } from "@/lib/auth";
import { slugifyName, verifyCsrfOrigin } from "@/lib/security";

const uuidSchema = z.string().uuid();

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  if (!uuidSchema.safeParse(id).success) {
    return NextResponse.json({ error: "Invalid dashboard ID." }, { status: 400 });
  }

  const db = await getDb();
  const [record] = await db
    .select({
      dashboard: savedDashboards,
      dataset: datasets,
    })
    .from(savedDashboards)
    .innerJoin(datasets, eq(savedDashboards.datasetId, datasets.id))
    .where(eq(savedDashboards.id, id))
    .limit(1);

  if (!record) {
    return NextResponse.json({ error: "Saved dashboard not found." }, { status: 404 });
  }

  const rows = await db
    .select({ dataJson: datasetRows.dataJson })
    .from(datasetRows)
    .where(eq(datasetRows.datasetId, record.dataset.id))
    .orderBy(asc(datasetRows.rowIndex));

  const analytics = runAnalyticsQuery({
    datasetId: record.dataset.id,
    datasetName: record.dataset.name,
    sourceType: record.dataset.sourceType,
    category: record.dataset.category,
    columns: record.dataset.columnsJson,
    rows: rows.map((r) => r.dataJson),
    config: record.dashboard.configJson,
  });

  const url = new URL(request.url);
  if (url.searchParams.get("format") === "csv") {
    const reportRows = analytics.series.map((pt) => ({
      period_or_group: pt.label,
      metric_value: pt.value,
      record_count: pt.count,
      point_type: pt.isForecast ? "linear_forecast" : "observed",
    }));
    const csv = serializeRowsToCsv(
      ["period_or_group", "metric_value", "record_count", "point_type"],
      reportRows,
    );
    const filename = `${slugifyName(record.dashboard.name)}-report.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json({
    dashboard: {
      id: record.dashboard.id,
      name: record.dashboard.name,
      datasetId: record.dataset.id,
      datasetName: record.dataset.name,
      datasetCategory: record.dataset.category,
      datasetSourceType: record.dataset.sourceType,
      description: record.dashboard.description,
      config: record.dashboard.configJson,
      createdAt: record.dashboard.createdAt.toISOString(),
      updatedAt: record.dashboard.updatedAt.toISOString(),
    },
    analytics,
    columns: record.dataset.columnsJson,
    generatedAt: new Date().toISOString(),
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
    return NextResponse.json({ error: "Invalid dashboard ID." }, { status: 400 });
  }

  const db = await getDb();
  const [existing] = await db
    .select()
    .from(savedDashboards)
    .where(eq(savedDashboards.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Saved dashboard not found." }, { status: 404 });
  }

  await db.delete(savedDashboards).where(eq(savedDashboards.id, id));
  await db.insert(activityLogs).values({
    userId: auth.user.id,
    action: "dashboard.deleted",
    entityType: "dashboard",
    entityId: id,
    summary: `Deleted saved dashboard "${existing.name}".`,
  });

  return NextResponse.json({ ok: true });
}
