"use client";

import type { ColumnMeta, SheetRow } from "@/lib/sheets/types";
import { formatCellValue } from "@/lib/sheets/format";
import { cn } from "@/lib/utils/cn";

type ListViewProps = {
  rows: SheetRow[];
  columns: ColumnMeta[];
  primaryColumn: ColumnMeta | null;
  onRowClick?: (row: SheetRow) => void;
};

export function ListView({ rows, columns, primaryColumn, onRowClick }: ListViewProps) {
  const primary = primaryColumn ?? columns[0];
  const secondary = columns.filter((c) => c.key !== primary?.key).slice(0, 2);

  return (
    <div className="divide-y divide-[#e5e5ea] px-4 pb-6">
      {rows.map((row, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onRowClick?.(row)}
          className="flex w-full items-center gap-3 py-3 text-left active:bg-black/5"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#007aff]/10 text-lg font-semibold text-[#007aff]">
            {String(row[primary?.key ?? ""] ?? "?").charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-semibold text-[#1c1c1e]">
              {formatCellValue(row[primary?.key ?? ""] ?? null, primary?.kind ?? "text")}
            </p>
            {secondary.length > 0 && (
              <p className="truncate text-[13px] text-[#8e8e93]">
                {secondary
                  .map((col) => formatCellValue(row[col.key] ?? null, col.kind))
                  .join(" · ")}
              </p>
            )}
          </div>
          <span className="text-[#c7c7cc]">›</span>
        </button>
      ))}
    </div>
  );
}

type ListDetailProps = {
  row: SheetRow;
  columns: ColumnMeta[];
  onBack: () => void;
};

export function ListDetailView({ row, columns, onBack }: ListDetailProps) {
  return (
    <div className="px-4 pb-6">
      <button type="button" onClick={onBack} className="mb-4 text-[17px] text-[#007aff]">
        ‹ 一覧に戻る
      </button>
      <div className="rounded-2xl bg-white p-4 ios-icon-shadow">
        <div className="space-y-4">
          {columns.map((column) => (
            <div key={column.key}>
              <p className="text-[13px] font-medium text-[#8e8e93]">{column.label}</p>
              <p className="mt-1 text-[17px] font-semibold text-[#1c1c1e]">
                {formatCellValue(row[column.key] ?? null, column.kind)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
