import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { datasetRows, datasets } from "@/db/schema";
import { pickDefaultConfig, runAnalyticsQuery } from "@/lib/analytics";
import { requireApiUser } from "@/lib/auth";

const querySchema = z.object({
  datasetId: z.string().uuid(),
  chartType: z.enum(["bar", "line", "area"]).optional(),
  xField: z.string().max(80).optional(),
  yField: z.string().max(80).optional(),
  aggregation: z.enum(["sum", "avg", "count", "max"]).optional(),
  filterField: z.string().max(80).nullable().optional(),
  filterValue: z.string().max(120).nullable().optional(),
  dateField: z.string().max(80).nullable().optional(),
  dateFrom: z.string().max(32).nullable().optional(),
  dateTo: z.string().max(32).nullable().optional(),
  showForecast: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = querySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid analytics query." },
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
    return NextResponse.json({ error: "Dataset not found." }, { status: 404 });
  }

  const rows = await db
    .select({ dataJson: datasetRows.dataJson })
    .from(datasetRows)
    .where(eq(datasetRows.datasetId, dataset.id))
    .orderBy(asc(datasetRows.rowIndex));

  const defaults = pickDefaultConfig(dataset.columnsJson);
  const result = runAnalyticsQuery({
    datasetId: dataset.id,
    datasetName: dataset.name,
    sourceType: dataset.sourceType,
    category: dataset.category,
    columns: dataset.columnsJson,
    rows: rows.map((r) => r.dataJson),
    config: {
      chartType: parsed.data.chartType ?? defaults.chartType,
      xField: parsed.data.xField ?? defaults.xField,
      yField: parsed.data.yField ?? defaults.yField,
      aggregation: parsed.data.aggregation ?? defaults.aggregation,
      filterField: parsed.data.filterField !== undefined ? parsed.data.filterField : defaults.filterField,
      filterValue: parsed.data.filterValue ?? null,
      dateField: parsed.data.dateField !== undefined ? parsed.data.dateField : defaults.dateField,
      dateFrom: parsed.data.dateFrom ?? null,
      dateTo: parsed.data.dateTo ?? null,
      showForecast: parsed.data.showForecast !== undefined ? parsed.data.showForecast : defaults.showForecast,
    },
  });

  return NextResponse.json({
    result,
    columns: dataset.columnsJson,
    validationSummary: dataset.validationSummary,
  });
}
