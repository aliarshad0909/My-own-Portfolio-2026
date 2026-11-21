import assert from "node:assert/strict";
import test from "node:test";
import { asc, eq } from "drizzle-orm";
import {
  computeLinearForecast,
  parseAndValidateCsv,
  runAnalyticsQuery,
  serializeRowsToCsv,
} from "@/lib/analytics";
import {
  generateLockedPassword,
  hashPassword,
  resolveSessionSecret,
  verifyPassword,
} from "@/lib/crypto";
import { neutralizeCsvFormula } from "@/lib/security";

// Force isolated in-memory PGlite for PostgreSQL integration tests
process.env.DATABASE_URL = "";
process.env.INSIGHTOS_DATABASE_URL = "";
process.env.PGLITE_DATA_DIR = "memory://";

test("CSV parser infers column types, detects missing cells & malformed rows, and neutralizes export formulas", () => {
  const csv = [
    "month,region,revenue_usd,notes",
    "2026-01,North America,$12000,Clean row",
    "2026-02,EMEA,15500,=SUM(A1:A2)",
    "2026-03,APAC,,Missing metric",
    "2026-04,LATAM,19000", // malformed: missing 4th column
  ].join("\n");

  const parsed = parseAndValidateCsv(csv);
  assert.equal(parsed.rows.length, 4);
  assert.equal(parsed.validationSummary.malformedRows, 1);
  assert.ok(parsed.validationSummary.missingCells >= 2);

  const typeMap = Object.fromEntries(parsed.columns.map((c) => [c.name, c.type]));
  assert.equal(typeMap.month, "date");
  assert.equal(typeMap.region, "string");
  assert.equal(typeMap.revenue_usd, "number");
  assert.equal(typeMap.notes, "string");
  assert.equal(parsed.rows[0].revenue_usd, 12000);

  // CSV formula neutralization on export
  assert.equal(neutralizeCsvFormula("=SUM(A1:A2)"), "'=SUM(A1:A2)");
  const exported = serializeRowsToCsv(["month", "notes"], parsed.rows);
  assert.ok(exported.includes("'=SUM(A1:A2)"));
});

test("Aggregation engine computes sum/avg/count/max with category & date-range filters", () => {
  const rows = [
    { month: "2026-01", region: "NA", revenue: 100 },
    { month: "2026-01", region: "EMEA", revenue: 50 },
    { month: "2026-02", region: "NA", revenue: 200 },
    { month: "2026-03", region: "NA", revenue: 300 },
  ];
  const columns = [
    { name: "month", type: "date" as const, missingCount: 0, distinctCount: 3, sampleValues: [] },
    { name: "region", type: "string" as const, missingCount: 0, distinctCount: 2, sampleValues: [] },
    { name: "revenue", type: "number" as const, missingCount: 0, distinctCount: 4, sampleValues: [] },
  ];

  const sumRes = runAnalyticsQuery({
    datasetId: "ds-1",
    datasetName: "Test",
    sourceType: "csv_upload",
    category: "sales",
    columns,
    rows,
    config: {
      chartType: "bar",
      xField: "month",
      yField: "revenue",
      aggregation: "sum",
      filterField: "region",
      filterValue: "NA",
      dateField: "month",
      dateFrom: "2026-01-01",
      dateTo: "2026-02-28",
      showForecast: false,
    },
  });

  assert.equal(sumRes.kpis.matchedRows, 2);
  assert.equal(sumRes.kpis.metricSum, 300);
  assert.equal(sumRes.kpis.metricAvg, 150);
  assert.equal(sumRes.kpis.metricMax, 200);
  assert.equal(sumRes.series.length, 2);
  assert.equal(sumRes.series[0].value, 100);
  assert.equal(sumRes.series[1].value, 200);

  const avgRes = runAnalyticsQuery({
    datasetId: "ds-1",
    datasetName: "Test",
    sourceType: "csv_upload",
    category: "sales",
    columns,
    rows,
    config: {
      chartType: "line",
      xField: "region",
      yField: "revenue",
      aggregation: "avg",
      showForecast: false,
    },
  });
  const naPoint = avgRes.series.find((s) => s.label === "NA");
  assert.equal(naPoint?.value, 200);
});

test("OLS Linear Regression Forecast accurately projects 3 future periods with R² = 1 on linear series", () => {
  const forecast = computeLinearForecast(
    [
      { label: "2026-01", value: 100 },
      { label: "2026-02", value: 150 },
      { label: "2026-03", value: 200 },
      { label: "2026-04", value: 250 },
    ],
    3,
  );

  assert.equal(forecast.available, true);
  assert.equal(forecast.slope, 50);
  assert.equal(forecast.intercept, 100);
  assert.equal(forecast.rSquared, 1);
  assert.equal(forecast.projectedPoints.length, 3);
  assert.deepEqual(forecast.projectedPoints, [
    { label: "2026-05 (F)", value: 300 },
    { label: "2026-06 (F)", value: 350 },
    { label: "2026-07 (F)", value: 400 },
  ]);
});

test("Security crypto helpers hash/verify passwords and enforce SESSION_SECRET in production", () => {
  const pw = generateLockedPassword();
  assert.equal(pw.length, 64);
  const hash = hashPassword(pw);
  assert.equal(verifyPassword(pw, hash), true);
  assert.equal(verifyPassword("wrong-password", hash), false);

  const prevRender = process.env.RENDER;
  const prevSecret = process.env.SESSION_SECRET;
  try {
    process.env.RENDER = "true";
    process.env.SESSION_SECRET = "short";
    assert.throws(() => resolveSessionSecret(), /at least 32/);
    process.env.SESSION_SECRET = "a".repeat(32);
    assert.equal(resolveSessionSecret(), "a".repeat(32));
  } finally {
    process.env.RENDER = prevRender;
    process.env.SESSION_SECRET = prevSecret;
  }
});

test("PostgreSQL integration: seeded 5 datasets, custom CSV persistence, dashboard saving, and demo reset", async () => {
  const { getDb, resetDemoWorkspace } = await import("@/db");
  const { datasetRows, datasets, savedDashboards } = await import("@/db/schema");

  const db = await getDb();

  // 1. Verify all 5 fictional demonstration datasets are seeded
  const seededDatasets = await db.select().from(datasets);
  assert.equal(seededDatasets.length, 5);
  const categories = new Set(seededDatasets.map((d) => d.category));
  assert.ok(categories.has("sales"));
  assert.ok(categories.has("marketing"));
  assert.ok(categories.has("inventory"));
  assert.ok(categories.has("financial"));
  assert.ok(categories.has("customer"));

  // 2. Parse & persist a custom CSV dataset into PostgreSQL
  const customCsv = [
    "month,segment,revenue_usd",
    "2026-01,Enterprise,50000",
    "2026-02,Enterprise,65000",
    "2026-03,Enterprise,80000",
  ].join("\n");
  const parsed = parseAndValidateCsv(customCsv);

  const [createdDs] = await db
    .insert(datasets)
    .values({
      name: "Integration Test CSV",
      slug: "integration-test-csv",
      category: "custom",
      sourceType: "csv_upload",
      description: "Automated PostgreSQL persistence test",
      columnsJson: parsed.columns,
      rowCount: parsed.rows.length,
      validationSummary: parsed.validationSummary,
    })
    .returning();

  await db.insert(datasetRows).values(
    parsed.rows.map((dataJson, idx) => ({
      datasetId: createdDs.id,
      rowIndex: idx + 1,
      dataJson,
    })),
  );

  // 3. Query real rows back from PostgreSQL and run analytics + forecast
  const persistedRows = await db
    .select({ dataJson: datasetRows.dataJson })
    .from(datasetRows)
    .where(eq(datasetRows.datasetId, createdDs.id))
    .orderBy(asc(datasetRows.rowIndex));

  assert.equal(persistedRows.length, 3);

  const analytics = runAnalyticsQuery({
    datasetId: createdDs.id,
    datasetName: createdDs.name,
    sourceType: createdDs.sourceType,
    category: createdDs.category,
    columns: createdDs.columnsJson,
    rows: persistedRows.map((r) => r.dataJson),
    config: {
      chartType: "line",
      xField: "month",
      yField: "revenue_usd",
      aggregation: "sum",
      showForecast: true,
    },
  });

  assert.equal(analytics.kpis.metricSum, 195000);
  assert.equal(analytics.forecast.projectedPoints[0]?.value, 95000);

  // 4. Save a dashboard linked to the uploaded CSV dataset
  const [savedDash] = await db
    .insert(savedDashboards)
    .values({
      name: "Integration Forecast Board",
      datasetId: createdDs.id,
      description: "Saved from integration test",
      configJson: analytics.config,
    })
    .returning();

  assert.equal(savedDash.name, "Integration Forecast Board");

  const afterInsertDashboards = await db.select().from(savedDashboards);
  assert.equal(afterInsertDashboards.length, 5); // 4 seeded + 1 custom

  // 5. Verify demo reset restores exact seeded baseline (5 datasets, 4 dashboards)
  await resetDemoWorkspace();
  const afterResetDatasets = await db.select().from(datasets);
  const afterResetDashboards = await db.select().from(savedDashboards);
  assert.equal(afterResetDatasets.length, 5);
  assert.equal(afterResetDashboards.length, 4);
});
