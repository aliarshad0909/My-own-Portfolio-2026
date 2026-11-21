import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/db";
import { activityLogs, datasetRows, datasets, savedDashboards, users } from "@/db/schema";
import { SAMPLE_DASHBOARDS, SAMPLE_DATASETS } from "@/db/sample-datasets";
import { buildDatasetMetadataFromRows } from "@/lib/analytics";
import { DEMO_ACCOUNT, generateLockedPassword, hashPassword } from "@/lib/crypto";

type SeedOptions = {
  usersOnly?: boolean;
  skipUsers?: boolean;
};

export async function seedDemoData(db: AppDatabase, options: SeedOptions = {}): Promise<void> {
  let demoUserId: string | null = null;

  if (!options.skipUsers) {
    const existingDemo = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, DEMO_ACCOUNT.email))
      .limit(1);

    if (existingDemo.length > 0) {
      demoUserId = existingDemo[0].id;
    } else {
      const [inserted] = await db
        .insert(users)
        .values({
          email: DEMO_ACCOUNT.email,
          name: DEMO_ACCOUNT.name,
          role: DEMO_ACCOUNT.role,
          passwordHash: hashPassword(DEMO_ACCOUNT.password),
          avatarColor: "#06b6d4",
        })
        .returning();
      demoUserId = inserted.id;
    }

    const existingDirector = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, "director@insightos.studio"))
      .limit(1);

    if (existingDirector.length === 0) {
      await db.insert(users).values({
        email: "director@insightos.studio",
        name: "Soren Patel (BI Director)",
        role: "admin",
        passwordHash: hashPassword(generateLockedPassword()),
        avatarColor: "#0891b2",
      });
    }
  } else {
    const existingDemo = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, DEMO_ACCOUNT.email))
      .limit(1);
    demoUserId = existingDemo[0]?.id ?? null;
  }

  if (options.usersOnly) return;

  const slugToId = new Map<string, string>();

  for (const spec of SAMPLE_DATASETS) {
    const { columns, validationSummary } = buildDatasetMetadataFromRows(spec.rows, spec.columns);

    const [insertedDataset] = await db
      .insert(datasets)
      .values({
        name: spec.name,
        slug: spec.slug,
        category: spec.category,
        sourceType: "sample",
        description: spec.description,
        columnsJson: columns,
        rowCount: spec.rows.length,
        validationSummary,
        createdBy: demoUserId,
      })
      .returning();

    slugToId.set(spec.slug, insertedDataset.id);

    const rowValues = spec.rows.map((dataJson, idx) => ({
      datasetId: insertedDataset.id,
      rowIndex: idx + 1,
      dataJson,
    }));

    if (rowValues.length > 0) {
      await db.insert(datasetRows).values(rowValues);
    }
  }

  for (const dash of SAMPLE_DASHBOARDS) {
    const datasetId = slugToId.get(dash.datasetSlug);
    if (!datasetId) continue;

    await db.insert(savedDashboards).values({
      name: dash.name,
      datasetId,
      description: dash.description,
      configJson: dash.config,
      createdBy: demoUserId,
    });
  }

  await db.insert(activityLogs).values([
    {
      userId: demoUserId,
      action: "dataset.seeded",
      entityType: "dataset",
      entityId: slugToId.get("sales-regional-2026") ?? null,
      summary: "Loaded 5 fictional demonstration datasets (98 total analytical rows) into PostgreSQL.",
    },
    {
      userId: demoUserId,
      action: "dashboard.created",
      entityType: "dashboard",
      entityId: null,
      summary: "Initialized 4 executive BI dashboards with OLS linear trend forecasting enabled.",
    },
  ]);
}
