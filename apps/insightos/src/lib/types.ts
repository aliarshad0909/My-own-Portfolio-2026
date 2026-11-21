export type DatasetCategory =
  | "sales"
  | "marketing"
  | "inventory"
  | "financial"
  | "customer"
  | "custom";

export type DatasetSourceType = "sample" | "csv_upload";

export type ColumnDataType = "number" | "date" | "string";

export type ColumnMeta = {
  name: string;
  type: ColumnDataType;
  missingCount: number;
  distinctCount: number;
  sampleValues: string[];
};

export type ValidationSummary = {
  totalRows: number;
  validRows: number;
  malformedRows: number;
  missingCells: number;
  duplicateHeaders: string[];
  warnings: string[];
  parsedAt: string;
};

export type RowData = Record<string, string | number | null>;

export type ChartType = "bar" | "line" | "area";

export type AggregationType = "sum" | "avg" | "count" | "max";

export type DashboardConfig = {
  chartType: ChartType;
  xField: string;
  yField: string;
  aggregation: AggregationType;
  filterField?: string | null;
  filterValue?: string | null;
  dateField?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  showForecast?: boolean;
};

export type SeriesPoint = {
  label: string;
  value: number;
  count: number;
  isForecast?: boolean;
  forecastValue?: number | null;
};

export type ForecastSummary = {
  enabled: boolean;
  available: boolean;
  slope: number;
  intercept: number;
  rSquared: number;
  projectedPoints: Array<{ label: string; value: number }>;
  methodology: string;
};

export type SegmentShare = {
  label: string;
  value: number;
  count: number;
  sharePct: number;
};

export type AnalyticsKpis = {
  totalRows: number;
  matchedRows: number;
  metricSum: number;
  metricAvg: number;
  metricMin: number;
  metricMax: number;
  topSegment: string | null;
  topSegmentValue: number;
  periodGrowthPct: number | null;
};

export type AnalyticsQueryResult = {
  datasetId: string;
  datasetName: string;
  sourceType: DatasetSourceType;
  category: DatasetCategory;
  config: DashboardConfig;
  kpis: AnalyticsKpis;
  series: SeriesPoint[];
  forecast: ForecastSummary;
  topSegments: SegmentShare[];
  filterOptions: Record<string, string[]>;
  dateBounds: { min: string | null; max: string | null; field: string | null };
};

export type SafeUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarColor: string;
};

export type DatasetSummary = {
  id: string;
  name: string;
  slug: string;
  category: DatasetCategory;
  sourceType: DatasetSourceType;
  description: string;
  columns: ColumnMeta[];
  rowCount: number;
  validationSummary: ValidationSummary;
  createdAt: string;
  updatedAt: string;
};

export type SavedDashboardRecord = {
  id: string;
  name: string;
  datasetId: string;
  datasetName: string;
  datasetCategory: DatasetCategory;
  datasetSourceType: DatasetSourceType;
  description: string;
  config: DashboardConfig;
  createdAt: string;
  updatedAt: string;
};
