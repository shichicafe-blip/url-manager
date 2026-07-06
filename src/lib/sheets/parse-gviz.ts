import type { CellValue, SheetData } from "./types";

type GvizCell = { v: CellValue | null; f?: string | null } | null;
type GvizRow = { c: GvizCell[] | null };
type GvizResponse = {
  version?: string;
  status?: string;
  table?: {
    cols: { label: string; type?: string }[];
    rows: GvizRow[];
    parsedNumHeaders?: number;
  };
};

function cellDisplay(cell: GvizCell): CellValue {
  if (!cell) return null;
  if (cell.f) return cell.f;
  return cell.v ?? null;
}

function uniqueHeader(label: string, index: number, used: Set<string>): string {
  const base = label.trim() || `列${index + 1}`;
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let suffix = 2;
  while (used.has(`${base}_${suffix}`)) suffix += 1;
  const unique = `${base}_${suffix}`;
  used.add(unique);
  return unique;
}

function rowsToRecords(headers: string[], gvizRows: GvizRow[]): SheetData["rows"] {
  return gvizRows.map((row) => {
    const record: Record<string, CellValue> = {};
    headers.forEach((header, index) => {
      record[header] = cellDisplay(row.c?.[index] ?? null);
    });
    return record;
  });
}

function shouldUseFirstRowAsHeaders(cols: { label: string }[], firstRow?: GvizRow): boolean {
  const labelsEmpty = cols.every((col) => !col.label?.trim());
  const firstCells = firstRow?.c ?? [];
  const firstHasText = firstCells.some((cell) => {
    const value = cell?.v ?? cell?.f;
    return value !== null && value !== "";
  });
  return labelsEmpty && firstHasText;
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

  const gvizRows = table.rows ?? [];
  const used = new Set<string>();

  if (shouldUseFirstRowAsHeaders(table.cols, gvizRows[0])) {
    const headerCells = gvizRows[0].c ?? [];
    const headers = table.cols.map((_, index) =>
      uniqueHeader(String(cellDisplay(headerCells[index] ?? null) ?? ""), index, used),
    );
    return {
      headers,
      rows: rowsToRecords(headers, gvizRows.slice(1)),
    };
  }

  const headers = table.cols.map((col, index) =>
    uniqueHeader(col.label ?? "", index, used),
  );

  return {
    headers,
    rows: rowsToRecords(headers, gvizRows),
  };
}

export function parseCsvResponse(raw: string): SheetData {
  const lines = parseCsvLines(raw.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const used = new Set<string>();
  const headers = lines[0].map((cell, index) => uniqueHeader(cell, index, used));
  const rows = lines.slice(1).map((line) => {
    const record: Record<string, CellValue> = {};
    headers.forEach((header, index) => {
      const value = line[index] ?? "";
      record[header] = value === "" ? null : value;
    });
    return record;
  });

  return { headers, rows };
}

function parseCsvLines(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value.trim() !== "")) rows.push(row);
  }

  return rows;
}
