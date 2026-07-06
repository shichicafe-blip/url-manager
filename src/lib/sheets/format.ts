import type { CellValue, ColumnKind } from "./types";

export function formatCellValue(value: CellValue, kind: ColumnKind): string {
  if (value === null || value === "") return "—";

  if (kind === "currency") {
    const num = parseDisplayNumber(value);
    if (num !== null) {
      return new Intl.NumberFormat("ja-JP", {
        style: "currency",
        currency: "JPY",
        maximumFractionDigits: 0,
      }).format(num);
    }
  }

  if (kind === "percent") {
    const num = parseDisplayNumber(value);
    if (num !== null) {
      const pct = String(value).includes("%") ? num : num <= 1 ? num * 100 : num;
      return `${pct.toLocaleString("ja-JP", { maximumFractionDigits: 1 })}%`;
    }
  }

  if (kind === "number") {
    const num = parseDisplayNumber(value);
    if (num !== null) {
      return num.toLocaleString("ja-JP");
    }
  }

  if (kind === "date" && typeof value === "string") {
    const dateMatch = value.match(/Date\((\d+)\)/);
    if (dateMatch) {
      return new Date(Number(dateMatch[1])).toLocaleDateString("ja-JP");
    }
  }

  return String(value);
}

export function parseDisplayNumber(value: CellValue): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[¥￥,\s]/g, "").replace(/%/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  return new Date(iso).toLocaleString("ja-JP");
}
