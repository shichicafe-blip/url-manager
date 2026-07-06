export type CellValue = string | number | boolean | null;

export type SheetRow = Record<string, CellValue>;

export type ColumnKind =
  | "text"
  | "number"
  | "currency"
  | "percent"
  | "date"
  | "boolean";

export type ColumnMeta = {
  key: string;
  label: string;
  kind: ColumnKind;
  isPrimary: boolean;
  isFilterable: boolean;
  isKpiCandidate: boolean;
  isChartSeries: boolean;
};

export type ViewMode = "auto" | "table" | "card" | "list" | "kpi" | "chart";

export type SheetData = {
  headers: string[];
  rows: SheetRow[];
  title?: string;
};

export type SheetAnalysis = {
  columns: ColumnMeta[];
  rowCount: number;
  columnCount: number;
  hasDateColumn: boolean;
  numericColumns: ColumnMeta[];
  kpiColumns: ColumnMeta[];
  filterColumns: ColumnMeta[];
  primaryColumn: ColumnMeta | null;
  recommendedView: Exclude<ViewMode, "auto">;
  chartXColumn: ColumnMeta | null;
  chartYColumns: ColumnMeta[];
};

export type SheetPayload = {
  data: SheetData;
  analysis: SheetAnalysis;
  fetchedAt: string;
  spreadsheetId: string;
  gid: string;
};
