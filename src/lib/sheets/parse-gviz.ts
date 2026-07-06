import type { CellValue, SheetData } from "./types";

type GvizCell = { v: CellValue | null; f?: string | null } | null;
type GvizRow = { c: GvizCell[] | null };
type GvizResponse = {
  version?: string;
  status?: string;
  table?: {
    cols: { label: string; type?: string }[];
    rows: GvizRow[];
  };
};

function cellDisplay(cell: GvizCell): CellValue {
  if (!cell) return null;
  if (cell.f) return cell.f;
  return cell.v ?? null;
}

export function parseGvizResponse(raw: string): SheetData {
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd < 0) {
    throw new Error("スプレッドシートの応答を解析できませんでした");
  }

  const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as GvizResponse;
  if (parsed.status === "error") {
    throw new Error("スプレッドシートの取得に失敗しました");
  }

  const table = parsed.table;
  if (!table?.cols?.length) {
    return { headers: [], rows: [] };
  }

  const headers = table.cols.map((col, index) => {
    const label = col.label?.trim();
    return label || `列${index + 1}`;
  });

  const rows = (table.rows ?? []).map((row) => {
    const record: Record<string, CellValue> = {};
    headers.forEach((header, index) => {
      record[header] = cellDisplay(row.c?.[index] ?? null);
    });
    return record;
  });

  return { headers, rows };
}

export function normalizeHeaderKey(label: string, index: number): string {
  const trimmed = label.trim();
  return trimmed || `col_${index + 1}`;
}
