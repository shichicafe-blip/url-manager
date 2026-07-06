"use client";

import type { ColumnMeta, SheetRow } from "@/lib/sheets/types";
import { parseDisplayNumber } from "@/lib/sheets/format";

type ChartViewProps = {
  rows: SheetRow[];
  xColumn: ColumnMeta | null;
  yColumns: ColumnMeta[];
};

function labelForRow(row: SheetRow, column: ColumnMeta | null, index: number): string {
  if (!column) return `${index + 1}`;
  const value = row[column.key];
  return value === null || value === "" ? `${index + 1}` : String(value).slice(0, 8);
}

export function ChartView({ rows, xColumn, yColumns }: ChartViewProps) {
  const series = yColumns[0];
  if (!series || rows.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-[15px] text-[#8e8e93]">
        グラフ表示に必要な数値列がありません
      </div>
    );
  }

  const values = rows
    .map((row) => parseDisplayNumber(row[series.key] ?? null))
    .filter((v): v is number => v !== null);
  const max = Math.max(...values, 1);

  return (
    <div className="space-y-6 px-4 pb-6">
      <div className="rounded-2xl bg-white p-4 ios-icon-shadow">
        <p className="mb-4 text-[15px] font-semibold text-[#1c1c1e]">{series.label}</p>
        <div className="flex h-48 items-end gap-2">
          {rows.map((row, index) => {
            const value = parseDisplayNumber(row[series.key] ?? null) ?? 0;
            const height = `${Math.max(8, (value / max) * 100)}%`;
            return (
              <div key={index} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-full w-full items-end justify-center">
                  <div
                    className="w-full max-w-[36px] rounded-t-lg bg-[#007aff]"
                    style={{ height }}
                    title={String(value)}
                  />
                </div>
                <span className="truncate text-[10px] text-[#8e8e93]">
                  {labelForRow(row, xColumn, index)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {yColumns.length > 1 && (
        <PieSummary rows={rows} columns={yColumns.slice(0, 4)} />
      )}
    </div>
  );
}

function PieSummary({ rows, columns }: { rows: SheetRow[]; columns: ColumnMeta[] }) {
  const latest = rows[rows.length - 1] ?? rows[0];
  const segments = columns
    .map((column) => ({
      label: column.label,
      value: Math.max(0, parseDisplayNumber(latest[column.key] ?? null) ?? 0),
    }))
    .filter((s) => s.value > 0);
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const colors = ["#007aff", "#34c759", "#ff9500", "#ff3b30"];

  let offset = 0;
  const gradient = segments
    .map((segment, index) => {
      const pct = (segment.value / total) * 100;
      const start = offset;
      offset += pct;
      return `${colors[index % colors.length]} ${start}% ${offset}%`;
    })
    .join(", ");

  return (
    <div className="rounded-2xl bg-white p-4 ios-icon-shadow">
      <p className="mb-4 text-[15px] font-semibold text-[#1c1c1e]">構成比</p>
      <div className="flex items-center gap-4">
        <div
          className="h-28 w-28 shrink-0 rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
        />
        <div className="space-y-2">
          {segments.map((segment, index) => (
            <div key={segment.label} className="flex items-center gap-2 text-[13px]">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-[#1c1c1e]">{segment.label}</span>
              <span className="text-[#8e8e93]">
                {Math.round((segment.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
