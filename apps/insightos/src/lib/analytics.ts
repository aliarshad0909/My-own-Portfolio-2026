import { neutralizeCsvFormula } from "@/lib/security";
import type {
  AggregationType,
  AnalyticsKpis,
  AnalyticsQueryResult,
  ColumnDataType,
  ColumnMeta,
  DashboardConfig,
  DatasetCategory,
  DatasetSourceType,
  ForecastSummary,
  RowData,
  SegmentShare,
  SeriesPoint,
  ValidationSummary,
} from "@/lib/types";

export const MAX_CSV_BYTES = 500 * 1024; // 500 KB
export const MAX_CSV_ROWS = 2000;
export const MAX_CSV_COLUMNS = 40;

export type ParsedCsvResult = {
  columns: ColumnMeta[];
  rows: RowData[];
  validationSummary: ValidationSummary;
};

/**
 * RFC 4180 compliant CSV parser supporting quoted fields, escaped quotes (""),
 * embedded commas/newlines, and CRLF/LF line endings.
 */
export function parseRawCsvRecords(csvText: string): string[][] {
  const cleaned = csvText.replace(/^\uFEFF/, "");
  const records: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    const next = cleaned[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field.trim());
      field = "";
    } else if (ch === "\r" && next === "\n") {
      row.push(field.trim());
      if (row.some((cell) => cell.length > 0)) {
        records.push(row);
      }
      row = [];
      field = "";
      i++;
    } else if (ch === "\n" || ch === "\r") {
      row.push(field.trim());
      if (row.some((cell) => cell.length > 0)) {
        records.push(row);
      }
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }

  row.push(field.trim());
  if (row.some((cell) => cell.length > 0)) {
    records.push(row);
  }

  return records;
}

export function tryParseNumeric(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Strip currency signs, commas, percent sign, spaces around numbers
  const normalized = trimmed.replace(/^[$€£]\s*/, "").replace(/,/g, "").replace(/%$/, "");
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

export function isDateLikeString(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  // Match YYYY-MM or YYYY-MM-DD or YYYY/MM/DD or ISO timestamps
  if (/^\d{4}-\d{2}(-\d{2})?(T.*)?$/.test(trimmed)) {
    const candidate = /^\d{4}-\d{2}$/.test(trimmed) ? `${trimmed}-01` : trimmed;
    const ms = Date.parse(candidate);
    return Number.isFinite(ms);
  }
  if (/^\d{4}\/\d{2}(\/\d{2})?$/.test(trimmed)) {
    const candidate = trimmed.replace(/\//g, "-");
    const ms = Date.parse(candidate.length === 7 ? `${candidate}-01` : candidate);
    return Number.isFinite(ms);
  }
  return false;
}

function normalizeHeader(raw: string, idx: number): string {
  const sanitized = raw
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s-]+/g, "_")
    .toLowerCase()
    .slice(0, 48);
  return sanitized || `column_${idx + 1}`;
}

export function parseAndValidateCsv(csvText: string): ParsedCsvResult {
  const byteLength = Buffer.byteLength(csvText, "utf8");
  if (byteLength === 0 || !csvText.trim()) {
    throw new Error("CSV content is empty.");
  }
  if (byteLength > MAX_CSV_BYTES) {
    throw new Error(`CSV exceeds maximum allowed size of ${Math.round(MAX_CSV_BYTES / 1024)} KB.`);
  }

  const rawRecords = parseRawCsvRecords(csvText);
  if (rawRecords.length < 2) {
    throw new Error("CSV must include a header row and at least one data row.");
  }

  const rawHeaderRow = rawRecords[0];
  if (rawHeaderRow.length > MAX_CSV_COLUMNS) {
    throw new Error(`CSV exceeds maximum allowed ${MAX_CSV_COLUMNS} columns.`);
  }

  const dataRecords = rawRecords.slice(1);
  if (dataRecords.length > MAX_CSV_ROWS) {
    throw new Error(`CSV exceeds maximum allowed ${MAX_CSV_ROWS.toLocaleString()} rows.`);
  }

  const warnings: string[] = [];
  const duplicateHeaders: string[] = [];
  const seenHeaders = new Map<string, number>();
  const headers: string[] = rawHeaderRow.map((raw, idx) => {
    const base = normalizeHeader(raw, idx);
    const count = seenHeaders.get(base) ?? 0;
    seenHeaders.set(base, count + 1);
    if (count > 0) {
      duplicateHeaders.push(base);
      return `${base}_${count + 1}`;
    }
    return base;
  });

  if (duplicateHeaders.length > 0) {
    warnings.push(`Renamed duplicate column header(s): ${[...new Set(duplicateHeaders)].join(", ")}.`);
  }

  // Track malformed rows (wrong column count) while normalizing width
  let malformedRows = 0;
  const normalizedRecords: string[][] = dataRecords.map((rec) => {
    if (rec.length !== headers.length) {
      malformedRows++;
      const padded = [...rec];
      while (padded.length < headers.length) padded.push("");
      return padded.slice(0, headers.length);
    }
    return rec;
  });

  if (malformedRows > 0) {
    warnings.push(
      `${malformedRows} row(s) had mismatched column counts and were normalized to ${headers.length} columns.`,
    );
  }

  // Infer column types from non-empty cell values
  const columnTypes: ColumnDataType[] = headers.map((_, colIdx) => {
    const nonEmpty = normalizedRecords
      .map((r) => r[colIdx] ?? "")
      .filter((v) => v.length > 0);
    if (nonEmpty.length === 0) return "string";

    let numMatches = 0;
    let dateMatches = 0;
    for (const val of nonEmpty) {
      if (tryParseNumeric(val) !== null) numMatches++;
      if (isDateLikeString(val)) dateMatches++;
    }
    if (numMatches / nonEmpty.length >= 0.85) return "number";
    if (dateMatches / nonEmpty.length >= 0.85) return "date";
    return "string";
  });

  let missingCells = 0;
  const rows: RowData[] = normalizedRecords.map((rec) => {
    const obj: RowData = {};
    for (let c = 0; c < headers.length; c++) {
      const header = headers[c];
      const rawVal = (rec[c] ?? "").trim();
      if (rawVal === "") {
        obj[header] = null;
        missingCells++;
        continue;
      }
      if (columnTypes[c] === "number") {
        const parsed = tryParseNumeric(rawVal);
        obj[header] = parsed !== null ? parsed : null;
        if (parsed === null) missingCells++;
      } else {
        obj[header] = rawVal;
      }
    }
    return obj;
  });

  const columns: ColumnMeta[] = headers.map((name, c) => {
    let missingCount = 0;
    const distinct = new Set<string>();
    const samples: string[] = [];

    for (const row of rows) {
      const v = row[name];
      if (v === null || v === undefined || v === "") {
        missingCount++;
      } else {
        const str = String(v);
        distinct.add(str);
        if (samples.length < 3 && !samples.includes(str)) {
          samples.push(str);
        }
      }
    }

    return {
      name,
      type: columnTypes[c],
      missingCount,
      distinctCount: distinct.size,
      sampleValues: samples,
    };
  });

  if (missingCells > 0) {
    warnings.push(`Detected ${missingCells} missing or non-numeric empty cell(s) across the dataset.`);
  }

  const numericCols = columns.filter((c) => c.type === "number");
  if (numericCols.length === 0) {
    warnings.push("No numeric columns detected; count aggregation will be available for charting.");
  }

  const validationSummary: ValidationSummary = {
    totalRows: rows.length,
    validRows: rows.length - malformedRows,
    malformedRows,
    missingCells,
    duplicateHeaders: [...new Set(duplicateHeaders)],
    warnings,
    parsedAt: new Date().toISOString(),
  };

  return { columns, rows, validationSummary };
}

/**
 * Computes metadata and validation summary for already-typed JSON row arrays (used for seeded datasets).
 */
export function buildDatasetMetadataFromRows(
  rows: RowData[],
  explicitColumns?: Array<{ name: string; type: ColumnDataType }>,
): { columns: ColumnMeta[]; validationSummary: ValidationSummary } {
  const keys = explicitColumns
    ? explicitColumns.map((c) => c.name)
    : Array.from(new Set(rows.flatMap((r) => Object.keys(r))));

  let missingCells = 0;
  const columns: ColumnMeta[] = keys.map((name) => {
    const explicit = explicitColumns?.find((c) => c.name === name);
    let missingCount = 0;
    const distinct = new Set<string>();
    const samples: string[] = [];
    let numCount = 0;
    let dateCount = 0;
    let nonNull = 0;

    for (const row of rows) {
      const val = row[name];
      if (val === null || val === undefined || val === "") {
        missingCount++;
        missingCells++;
      } else {
        nonNull++;
        const str = String(val);
        distinct.add(str);
        if (samples.length < 3 && !samples.includes(str)) samples.push(str);
        if (typeof val === "number" || tryParseNumeric(str) !== null) numCount++;
        if (isDateLikeString(str)) dateCount++;
      }
    }

    const inferredType: ColumnDataType =
      explicit?.type ??
      (nonNull > 0 && numCount / nonNull >= 0.85
        ? "number"
        : nonNull > 0 && dateCount / nonNull >= 0.85
          ? "date"
          : "string");

    return {
      name,
      type: inferredType,
      missingCount,
      distinctCount: distinct.size,
      sampleValues: samples,
    };
  });

  return {
    columns,
    validationSummary: {
      totalRows: rows.length,
      validRows: rows.length,
      malformedRows: 0,
      missingCells,
      duplicateHeaders: [],
      warnings: [],
      parsedAt: new Date().toISOString(),
    },
  };
}

/**
 * Serializes rows to RFC 4180 CSV with CSV formula injection neutralization.
 */
export function serializeRowsToCsv(columns: string[], rows: RowData[]): string {
  const escapeCell = (raw: string | number | null | undefined): string => {
    if (raw === null || raw === undefined) return "";
    const str = typeof raw === "number" ? String(raw) : neutralizeCsvFormula(String(raw));
    if (/[",\r\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines: string[] = [columns.map((c) => escapeCell(c)).join(",")];
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCell(row[c])).join(","));
  }
  return lines.join("\r\n");
}

function normalizeComparableDate(val: string): string {
  const trimmed = val.trim().replace(/\//g, "-");
  if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`;
  return trimmed.slice(0, 10);
}

function nextPeriodLabel(lastLabel: string, step: number): string {
  const ymMatch = /^(\d{4})-(\d{2})$/.exec(lastLabel.trim());
  if (ymMatch) {
    const year = Number(ymMatch[1]);
    const month = Number(ymMatch[2]) - 1; // 0-indexed
    const d = new Date(Date.UTC(year, month + step, 1));
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    return `${y}-${m} (F)`;
  }
  const ymdMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(lastLabel.trim());
  if (ymdMatch) {
    const d = new Date(
      Date.UTC(Number(ymdMatch[1]), Number(ymdMatch[2]) - 1, Number(ymdMatch[3]) + step * 30),
    );
    return `${d.toISOString().slice(0, 10)} (F)`;
  }
  return `Forecast +${step}`;
}

/**
 * Ordinary Least Squares (OLS) 3-period linear regression forecast.
 * Strictly deterministic and derived from the actual aggregated numeric series.
 */
export function computeLinearForecast(
  series: Array<{ label: string; value: number }>,
  periods = 3,
): ForecastSummary {
  if (series.length < 2) {
    return {
      enabled: true,
      available: false,
      slope: 0,
      intercept: 0,
      rSquared: 0,
      projectedPoints: [],
      methodology: "At least 2 grouped periods are required to fit an ordinary least squares (OLS) trendline.",
    };
  }

  const n = series.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = series[i].value;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Coefficient of determination (R^2)
  const meanY = sumY / n;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const predicted = intercept + slope * i;
    ssTot += (series[i].value - meanY) ** 2;
    ssRes += (series[i].value - predicted) ** 2;
  }
  const rSquared = ssTot === 0 ? 1 : Math.max(0, Math.min(1, 1 - ssRes / ssTot));

  const allNonNegative = series.every((p) => p.value >= 0);
  const lastLabel = series[series.length - 1].label;
  const projectedPoints: Array<{ label: string; value: number }> = [];

  for (let step = 1; step <= periods; step++) {
    const x = n - 1 + step;
    let predicted = intercept + slope * x;
    if (allNonNegative && predicted < 0) predicted = 0;
    projectedPoints.push({
      label: nextPeriodLabel(lastLabel, step),
      value: Math.round(predicted * 100) / 100,
    });
  }

  const roundedSlope = Math.round(slope * 100) / 100;
  const roundedIntercept = Math.round(intercept * 100) / 100;
  const roundedR2 = Math.round(rSquared * 1000) / 1000;

  return {
    enabled: true,
    available: true,
    slope: roundedSlope,
    intercept: roundedIntercept,
    rSquared: roundedR2,
    projectedPoints,
    methodology: `Linear OLS regression (y = ${roundedIntercept} + ${roundedSlope}·t, R² = ${roundedR2}) fit across ${n} observed points and projected ${periods} periods forward. Statistical demonstration only — not a live external market forecast.`,
  };
}

function aggregateValues(values: number[], totalRowsInBucket: number, mode: AggregationType): number {
  if (mode === "count") return totalRowsInBucket;
  if (values.length === 0) return 0;
  if (mode === "sum") return Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100;
  if (mode === "avg") return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
  if (mode === "max") return Math.round(Math.max(...values) * 100) / 100;
  return 0;
}

export function pickDefaultConfig(columns: ColumnMeta[]): DashboardConfig {
  const dateCol = columns.find((c) => c.type === "date");
  const stringCol = columns.find((c) => c.type === "string");
  const numericCol = columns.find((c) => c.type === "number");

  const xField = dateCol?.name ?? stringCol?.name ?? columns[0]?.name ?? "";
  const yField = numericCol?.name ?? columns[0]?.name ?? "";
  const aggregation: AggregationType = numericCol ? "sum" : "count";

  return {
    chartType: dateCol ? "area" : "bar",
    xField,
    yField,
    aggregation,
    filterField: stringCol?.name ?? null,
    filterValue: null,
    dateField: dateCol?.name ?? null,
    dateFrom: null,
    dateTo: null,
    showForecast: Boolean(dateCol && numericCol),
  };
}

export function filterDatasetRows(
  rows: RowData[],
  config: Pick<DashboardConfig, "filterField" | "filterValue" | "dateField" | "dateFrom" | "dateTo">,
): RowData[] {
  return rows.filter((row) => {
    if (config.filterField && config.filterValue) {
      const cell = row[config.filterField];
      if (cell === null || cell === undefined) return false;
      if (String(cell).toLowerCase() !== config.filterValue.toLowerCase()) return false;
    }

    if (config.dateField && (config.dateFrom || config.dateTo)) {
      const rawDate = row[config.dateField];
      if (rawDate === null || rawDate === undefined) return false;
      const normalized = normalizeComparableDate(String(rawDate));
      if (config.dateFrom && normalized < normalizeComparableDate(config.dateFrom)) return false;
      if (config.dateTo && normalized > normalizeComparableDate(config.dateTo)) return false;
    }

    return true;
  });
}

export function runAnalyticsQuery(params: {
  datasetId: string;
  datasetName: string;
  sourceType: DatasetSourceType;
  category: DatasetCategory;
  columns: ColumnMeta[];
  rows: RowData[];
  config: DashboardConfig;
}): AnalyticsQueryResult {
  const { datasetId, datasetName, sourceType, category, columns, rows } = params;
  const colMap = new Map(columns.map((c) => [c.name, c]));

  // Normalize config against valid dataset columns
  const fallback = pickDefaultConfig(columns);
  const xField = colMap.has(params.config.xField) ? params.config.xField : fallback.xField;
  const yField = colMap.has(params.config.yField) ? params.config.yField : fallback.yField;
  const yCol = colMap.get(yField);
  const aggregation: AggregationType =
    yCol?.type !== "number" && params.config.aggregation !== "count"
      ? "count"
      : params.config.aggregation;

  const dateCol =
    (params.config.dateField && colMap.get(params.config.dateField)?.type === "date"
      ? colMap.get(params.config.dateField)
      : columns.find((c) => c.type === "date")) ?? null;

  const normalizedConfig: DashboardConfig = {
    chartType: params.config.chartType || fallback.chartType,
    xField,
    yField,
    aggregation,
    filterField: params.config.filterField && colMap.has(params.config.filterField) ? params.config.filterField : null,
    filterValue: params.config.filterValue?.trim() || null,
    dateField: dateCol?.name ?? null,
    dateFrom: params.config.dateFrom?.trim() || null,
    dateTo: params.config.dateTo?.trim() || null,
    showForecast: Boolean(params.config.showForecast),
  };

  // Build available filter options for string columns
  const filterOptions: Record<string, string[]> = {};
  for (const col of columns) {
    if (col.type === "string" && col.distinctCount <= 40) {
      const vals = Array.from(
        new Set(
          rows
            .map((r) => r[col.name])
            .filter((v): v is string | number => v !== null && v !== undefined && String(v).trim() !== "")
            .map((v) => String(v)),
        ),
      ).sort((a, b) => a.localeCompare(b));
      filterOptions[col.name] = vals;
    }
  }

  // Date bounds across unfiltered rows
  let minDate: string | null = null;
  let maxDate: string | null = null;
  if (dateCol) {
    const dates = rows
      .map((r) => r[dateCol.name])
      .filter((v): v is string | number => v !== null && v !== undefined && String(v).trim() !== "")
      .map((v) => normalizeComparableDate(String(v)))
      .sort();
    if (dates.length > 0) {
      minDate = dates[0];
      maxDate = dates[dates.length - 1];
    }
  }

  // Filter rows
  const filteredRows = filterDatasetRows(rows, normalizedConfig);

  // Extract raw numeric metric values across filtered rows for KPIs
  const metricValues: number[] = [];
  for (const row of filteredRows) {
    const raw = row[yField];
    if (typeof raw === "number" && Number.isFinite(raw)) {
      metricValues.push(raw);
    } else if (typeof raw === "string") {
      const parsed = tryParseNumeric(raw);
      if (parsed !== null) metricValues.push(parsed);
    }
  }

  const metricSum =
    aggregation === "count"
      ? filteredRows.length
      : Math.round(metricValues.reduce((a, b) => a + b, 0) * 100) / 100;
  const metricAvg =
    metricValues.length > 0
      ? Math.round((metricValues.reduce((a, b) => a + b, 0) / metricValues.length) * 100) / 100
      : 0;
  const metricMin = metricValues.length > 0 ? Math.min(...metricValues) : 0;
  const metricMax = metricValues.length > 0 ? Math.max(...metricValues) : 0;

  // Group by xField
  const buckets = new Map<string, { values: number[]; count: number }>();
  for (const row of filteredRows) {
    const rawX = row[xField];
    const label = rawX === null || rawX === undefined || String(rawX).trim() === "" ? "(Missing)" : String(rawX);
    let bucket = buckets.get(label);
    if (!bucket) {
      bucket = { values: [], count: 0 };
      buckets.set(label, bucket);
    }
    bucket.count += 1;
    const rawY = row[yField];
    if (typeof rawY === "number" && Number.isFinite(rawY)) {
      bucket.values.push(rawY);
    } else if (typeof rawY === "string") {
      const parsed = tryParseNumeric(rawY);
      if (parsed !== null) bucket.values.push(parsed);
    }
  }

  const xCol = colMap.get(xField);
  const groupedEntries = Array.from(buckets.entries()).map(([label, bucket]) => ({
    label,
    value: aggregateValues(bucket.values, bucket.count, aggregation),
    count: bucket.count,
  }));

  if (xCol?.type === "date") {
    groupedEntries.sort((a, b) => a.label.localeCompare(b.label));
  } else {
    groupedEntries.sort((a, b) => b.value - a.value);
  }

  const baseSeries: SeriesPoint[] = groupedEntries.map((item) => ({
    label: item.label,
    value: item.value,
    count: item.count,
    isForecast: false,
    forecastValue: null,
  }));

  // Compute period growth from first to last grouped point only for chronological date dimensions
  let periodGrowthPct: number | null = null;
  if (xCol?.type === "date" && baseSeries.length >= 2) {
    const first = baseSeries[0].value;
    const last = baseSeries[baseSeries.length - 1].value;
    if (first !== 0) {
      periodGrowthPct = Math.round(((last - first) / Math.abs(first)) * 1000) / 10;
    }
  }

  // Forecast
  let forecast: ForecastSummary = {
    enabled: false,
    available: baseSeries.length >= 2,
    slope: 0,
    intercept: 0,
    rSquared: 0,
    projectedPoints: [],
    methodology: "Enable Linear Forecast to project the next 3 periods using ordinary least squares (OLS) regression.",
  };

  const finalSeries: SeriesPoint[] = [...baseSeries];
  if (normalizedConfig.showForecast) {
    forecast = computeLinearForecast(baseSeries, 3);
    if (forecast.available && finalSeries.length > 0) {
      // Connect forecast dashed line smoothly from the last observed point
      finalSeries[finalSeries.length - 1] = {
        ...finalSeries[finalSeries.length - 1],
        forecastValue: finalSeries[finalSeries.length - 1].value,
      };
      for (const proj of forecast.projectedPoints) {
        finalSeries.push({
          label: proj.label,
          value: proj.value,
          count: 0,
          isForecast: true,
          forecastValue: proj.value,
        });
      }
    }
  }

  // Top segments breakdown (prefer first string column if xField is a date, else use xField)
  const segmentField =
    xCol?.type === "date"
      ? (columns.find((c) => c.type === "string")?.name ?? xField)
      : xField;

  const segBuckets = new Map<string, { values: number[]; count: number }>();
  for (const row of filteredRows) {
    const rawSeg = row[segmentField];
    const label = rawSeg === null || rawSeg === undefined || String(rawSeg).trim() === "" ? "(Unspecified)" : String(rawSeg);
    let b = segBuckets.get(label);
    if (!b) {
      b = { values: [], count: 0 };
      segBuckets.set(label, b);
    }
    b.count += 1;
    const rawY = row[yField];
    if (typeof rawY === "number" && Number.isFinite(rawY)) b.values.push(rawY);
  }

  const segList = Array.from(segBuckets.entries())
    .map(([label, b]) => ({
      label,
      value: aggregateValues(b.values, b.count, aggregation),
      count: b.count,
    }))
    .sort((a, b) => b.value - a.value);

  const totalSegValue = segList.reduce((acc, s) => acc + Math.max(0, s.value), 0);
  const topSegments: SegmentShare[] = segList.slice(0, 6).map((s) => ({
    label: s.label,
    value: s.value,
    count: s.count,
    sharePct: totalSegValue > 0 ? Math.round((Math.max(0, s.value) / totalSegValue) * 1000) / 10 : 0,
  }));

  const kpis: AnalyticsKpis = {
    totalRows: rows.length,
    matchedRows: filteredRows.length,
    metricSum,
    metricAvg,
    metricMin,
    metricMax,
    topSegment: topSegments[0]?.label ?? null,
    topSegmentValue: topSegments[0]?.value ?? 0,
    periodGrowthPct,
  };

  return {
    datasetId,
    datasetName,
    sourceType,
    category,
    config: normalizedConfig,
    kpis,
    series: finalSeries,
    forecast,
    topSegments,
    filterOptions,
    dateBounds: { min: minDate, max: maxDate, field: dateCol?.name ?? null },
  };
}
