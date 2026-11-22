import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { activityLogs, datasetRows, datasets } from "@/db/schema";
import { MAX_CSV_BYTES, parseAndValidateCsv } from "@/lib/analytics";
import { requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { slugifyName, verifyCsrfOrigin } from "@/lib/security";
import type { DatasetCategory } from "@/lib/types";

const categoryEnum = z.enum(["sales", "marketing", "inventory", "financial", "customer", "custom"]);

const uploadJsonSchema = z.object({
  name: z.string().trim().min(2, "Dataset name must be at least 2 characters.").max(120),
  category: categoryEnum.default("custom"),
  description: z.string().trim().max(500).optional().default(""),
  csvText: z.string().min(1, "CSV content is required."),
});

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const rows = await db.select().from(datasets).orderBy(desc(datasets.createdAt));
  const recentActivity = await db
    .select()
    .from(activityLogs)
    .orderBy(desc(activityLogs.createdAt))
    .limit(10);

  return NextResponse.json({
    datasets: rows.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      category: d.category,
      sourceType: d.sourceType,
      description: d.description,
      columns: d.columnsJson,
      rowCount: d.rowCount,
      validationSummary: d.validationSummary,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })),
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId,
      summary: a.summary,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const limit = checkRateLimit(clientKey(request, "csv-upload"), 15, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `CSV upload rate limit reached. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  let name = "";
  let category: DatasetCategory = "custom";
  let description = "";
  let csvText = "";

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    const rawName = String(formData.get("name") || "").trim();
    const rawCategory = String(formData.get("category") || "custom").trim();
    description = String(formData.get("description") || "").trim().slice(0, 500);

    const parsedCat = categoryEnum.safeParse(rawCategory);
    category = parsedCat.success ? parsedCat.data : "custom";

    if (file instanceof File) {
      if (file.size > MAX_CSV_BYTES) {
        return NextResponse.json(
          { error: `Uploaded file exceeds maximum allowed ${Math.round(MAX_CSV_BYTES / 1024)} KB limit.` },
          { status: 400 },
        );
      }
      csvText = await file.text();
      name = rawName || file.name.replace(/\.csv$/i, "").slice(0, 120) || "Uploaded CSV Dataset";
    } else {
      csvText = String(formData.get("csvText") || "");
      name = rawName || "Uploaded CSV Dataset";
    }

    if (name.length < 2) {
      return NextResponse.json({ error: "Dataset name must be at least 2 characters." }, { status: 400 });
    }
  } else {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }
    const parsed = uploadJsonSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid dataset payload." },
        { status: 400 },
      );
    }
    name = parsed.data.name;
    category = parsed.data.category;
    description = parsed.data.description;
    csvText = parsed.data.csvText;
  }

  let parsedCsv;
  try {
    parsedCsv = parseAndValidateCsv(csvText);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to parse CSV content." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const uniqueSuffix = crypto.randomBytes(3).toString("hex");
  const slug = `${slugifyName(name)}-${uniqueSuffix}`;

  const [created] = await db
    .insert(datasets)
    .values({
      name,
      slug,
      category,
      sourceType: "csv_upload",
      description:
        description ||
        `User-uploaded CSV dataset (${parsedCsv.rows.length} rows, ${parsedCsv.columns.length} validated columns).`,
      columnsJson: parsedCsv.columns,
      rowCount: parsedCsv.rows.length,
      validationSummary: parsedCsv.validationSummary,
      createdBy: auth.user.id,
    })
    .returning();

  // Insert rows in batches of 250 to stay well within parameter limits
  const batchSize = 250;
  for (let i = 0; i < parsedCsv.rows.length; i += batchSize) {
    const slice = parsedCsv.rows.slice(i, i + batchSize);
    await db.insert(datasetRows).values(
      slice.map((dataJson, idx) => ({
        datasetId: created.id,
        rowIndex: i + idx + 1,
        dataJson,
      })),
    );
  }

  await db.insert(activityLogs).values({
    userId: auth.user.id,
    action: "dataset.uploaded",
    entityType: "dataset",
    entityId: created.id,
    summary: `Imported CSV "${created.name}" (${created.rowCount} rows, ${parsedCsv.columns.length} columns, ${parsedCsv.validationSummary.malformedRows} malformed).`,
  });

  return NextResponse.json(
    {
      dataset: {
        id: created.id,
        name: created.name,
        slug: created.slug,
        category: created.category,
        sourceType: created.sourceType,
        description: created.description,
        columns: created.columnsJson,
        rowCount: created.rowCount,
        validationSummary: created.validationSummary,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
      previewRows: parsedCsv.rows.slice(0, 50),
    },
    { status: 201 },
  );
}
