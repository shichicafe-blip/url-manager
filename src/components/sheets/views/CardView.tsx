"use client";

import type { ColumnMeta, SheetRow } from "@/lib/sheets/types";
import { formatCellValue } from "@/lib/sheets/format";
import { cn } from "@/lib/utils/cn";

type CardViewProps = {
  rows: SheetRow[];
  columns: ColumnMeta[];
  onRowClick?: (row: SheetRow) => void;
};

export function CardView({ rows, columns, onRowClick }: CardViewProps) {
  const visibleColumns = columns.filter((c) => c.key);

  return (
    <div className="space-y-3 px-4 pb-6">
      {rows.map((row, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onRowClick?.(row)}
          className={cn(
            "w-full rounded-2xl bg-white p-4 text-left ios-icon-shadow transition-transform active:scale-[0.98]",
            onRowClick && "cursor-pointer",
          )}
        >
          <div className="space-y-3">
            {visibleColumns.map((column) => (
              <div key={column.key} className="flex items-start justify-between gap-3">
                <span className="shrink-0 text-[13px] font-medium text-[#8e8e93]">
                  {column.label}
                </span>
                <span
                  className={cn(
                    "text-right text-[15px] font-semibold text-[#1c1c1e]",
                    ["number", "currency", "percent"].includes(column.kind) && "text-[17px]",
                  )}
                >
                  {formatCellValue(row[column.key] ?? null, column.kind)}
                </span>
              </div>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}
