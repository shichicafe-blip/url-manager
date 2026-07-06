import type { CellValue, ColumnKind, ColumnMeta, SheetAnalysis, SheetData, ViewMode } from "./types";

const KPI_KEYWORDS = [
  "売上",
  "利益",
  "人件費",
  "口コミ",
  "アンケート",
  "todo",
  "達成",
  "予算",
  "来客",
  "客数",
  "単価",
  "コスト",
  "経費",
  "売上高",
  "粗利",
  "rating",
  "score",
  "total",
  "amount",
  "revenue",
  "profit",
];

const FILTER_KEYWORDS = ["店舗", "担当", "月", "日付", "date", "category", "カテゴ", "商品", "store", "shop"];

const PRIMARY_KEYWORDS = ["名前", "店舗", "商品", "タイトル", "name", "title", "項目", "label"];

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

function matchesKeywords(label: string, keywords: string[]): boolean {
  const normalized = normalizeLabel(label);
  return keywords.some((word) => normalized.includes(word.toLowerCase()));
}

function parseNumber(value: CellValue): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[¥￥,\s]/g, "").replace(/%/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function looksLikeDate(value: CellValue): boolean {
  if (typeof value !== "string") return false;
  return /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(value) || /Date\(\d+\)/.test(value);
}

function detectKind(values: CellValue[], label: string): ColumnKind {
  const nonEmpty = values.filter((v) => v !== null && v !== "");
  if (nonEmpty.length === 0) return "text";

  const percentHits = nonEmpty.filter((v) => typeof v === "string" && v.includes("%")).length;
  if (percentHits / nonEmpty.length > 0.5 || label.includes("率")) return "percent";

  const currencyHits = nonEmpty.filter(
    (v) => typeof v === "string" && (/[¥￥]/.test(v) || matchesKeywords(label, ["売上", "利益", "金額", "cost"])),
  ).length;
  const numericHits = nonEmpty.filter((v) => parseNumber(v) !== null).length;

  if (currencyHits / nonEmpty.length > 0.3) return "currency";
  if (numericHits / nonEmpty.length > 0.7) return "number";

  const dateHits = nonEmpty.filter((v) => looksLikeDate(v)).length;
  if (dateHits / nonEmpty.length > 0.6 || matchesKeywords(label, ["日付", "date", "月"])) return "date";

  if (nonEmpty.every((v) => typeof v === "boolean")) return "boolean";

  return "text";
}

function pickRecommendedView(columns: ColumnMeta[], rowCount: number): Exclude<ViewMode, "auto"> {
  const numeric = columns.filter((c) => ["number", "currency", "percent"].includes(c.kind));
  const kpi = columns.filter((c) => c.isKpiCandidate);
  const dateCol = columns.find((c) => c.kind === "date");
  const textCols = columns.filter((c) => c.kind === "text");

  if (rowCount === 1 && kpi.length >= 2) return "kpi";
  if (rowCount <= 6 && kpi.length >= 2 && numeric.length >= 2) return "kpi";
  if (dateCol && numeric.length >= 1 && rowCount >= 3) return "chart";
  if (rowCount >= 8 && textCols.length >= 1 && columns.length <= 5) return "list";
  if (columns.length <= 6 && rowCount >= 1) return "card";
  if (columns.length >= 7) return "table";
  return "card";
}

export function analyzeSheet(data: SheetData): SheetAnalysis {
  const headers = data.headers.length
    ? data.headers
    : Object.keys(data.rows[0] ?? {});

  const columns: ColumnMeta[] = headers.map((label, index) => {
    const values = data.rows.map((row) => row[label] ?? null);
    const kind = detectKind(values, label);
    const isKpiCandidate =
      ["number", "currency", "percent"].includes(kind) &&
      (matchesKeywords(label, KPI_KEYWORDS) || (data.rows.length <= 3 && kind !== "text"));

    return {
      key: label,
      label,
      kind,
      isPrimary: matchesKeywords(label, PRIMARY_KEYWORDS) || (kind === "text" && index === 0),
      isFilterable:
        kind === "text" ||
        kind === "date" ||
        matchesKeywords(label, FILTER_KEYWORDS),
      isKpiCandidate,
      isChartSeries: ["number", "currency", "percent"].includes(kind),
    };
  });

  const numericColumns = columns.filter((c) => ["number", "currency", "percent"].includes(c.kind));
  const kpiColumns = columns.filter((c) => c.isKpiCandidate);
  const filterColumns = columns.filter((c) => c.isFilterable);
  const primaryColumn = columns.find((c) => c.isPrimary) ?? columns.find((c) => c.kind === "text") ?? null;
  const chartXColumn = columns.find((c) => c.kind === "date") ?? primaryColumn;
  const chartYColumns = numericColumns.filter((c) => c.key !== chartXColumn?.key).slice(0, 3);
  const recommendedView = pickRecommendedView(columns, data.rows.length);

  return {
    columns,
    rowCount: data.rows.length,
    columnCount: columns.length,
    hasDateColumn: columns.some((c) => c.kind === "date"),
    numericColumns,
    kpiColumns,
    filterColumns,
    primaryColumn,
    recommendedView,
    chartXColumn,
    chartYColumns,
  };
}

export function filterRows(
  rows: SheetData["rows"],
  filters: Record<string, string>,
  searchQuery: string,
): SheetData["rows"] {
  const normalizedSearch = searchQuery.trim().toLowerCase();

  return rows.filter((row) => {
    const filterOk = Object.entries(filters).every(([key, value]) => {
      if (!value || value === "all") return true;
      return String(row[key] ?? "").toLowerCase() === value.toLowerCase();
    });

    if (!filterOk) return false;
    if (!normalizedSearch) return true;

    return Object.values(row).some((value) =>
      String(value ?? "").toLowerCase().includes(normalizedSearch),
    );
  });
}
