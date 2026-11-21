import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { activityLogs, datasets, savedDashboards } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";

const configSchema = z.object({
  chartType: z.enum(["bar", "line", "area"]),
  xField: z.string().min(1).max(80),
  yField: z.string().min(1).max(80),
  aggregation: z.enum(["sum", "avg", "count", "max"]),
  filterField: z.string().max(80).nullable().optional(),
  filterValue: z.string().max(120).nullable().optional(),
  dateField: z.string().max(80).nullable().optional(),
  dateFrom: z.string().max(32).nullable().optional(),
  dateTo: z.string().max(32).nullable().optional(),
  showForecast: z.boolean().optional().default(false),
});

const createDashboardSchema = z.object({
  name: z.string().trim().min(2, "Dashboard name must be at least 2 characters.").max(120),
  datasetId: z.string().uuid(),
  description: z.string().trim().max(500).optional().default(""),
  config: configSchema,
});

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const rows = await db
    .select({
      id: savedDashboards.id,
      name: savedDashboards.name,
      datasetId: savedDashboards.datasetId,
      description: savedDashboards.description,
      configJson: savedDashboards.configJson,
      createdAt: savedDashboards.createdAt,
      updatedAt: savedDashboards.updatedAt,
      datasetName: datasets.name,
      datasetCategory: datasets.category,
      datasetSourceType: datasets.sourceType,
    })
    .from(savedDashboards)
    .innerJoin(datasets, eq(savedDashboards.datasetId, datasets.id))
    .orderBy(desc(savedDashboards.createdAt));

  return NextResponse.json({
    dashboards: rows.map((r) => ({
      id: r.id,
      name: r.name,
      datasetId: r.datasetId,
      datasetName: r.datasetName,
      datasetCategory: r.datasetCategory,
      datasetSourceType: r.datasetSourceType,
      description: r.description,
      config: r.configJson,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = createDashboardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid dashboard configuration." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [dataset] = await db
    .select()
    .from(datasets)
    .where(eq(datasets.id, parsed.data.datasetId))
    .limit(1);

  if (!dataset) {
    return NextResponse.json({ error: "Referenced dataset does not exist." }, { status: 404 });
  }

  const [created] = await db
    .insert(savedDashboards)
    .values({
      name: parsed.data.name,
      datasetId: dataset.id,
      description:
        parsed.data.description ||
        `${parsed.data.config.aggregation.toUpperCase()}(${parsed.data.config.yField}) by ${parsed.data.config.xField} on ${dataset.name}.`,
      configJson: parsed.data.config,
      createdBy: auth.user.id,
    })
    .returning();

  await db.insert(activityLogs).values({
    userId: auth.user.id,
    action: "dashboard.saved",
    entityType: "dashboard",
    entityId: created.id,
    summary: `Saved dashboard "${created.name}" using ${parsed.data.config.chartType} chart on "${dataset.name}".`,
  });

  return NextResponse.json(
    {
      dashboard: {
        id: created.id,
        name: created.name,
        datasetId: created.datasetId,
        datasetName: dataset.name,
        datasetCategory: dataset.category,
        datasetSourceType: dataset.sourceType,
        description: created.description,
        config: created.configJson,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
