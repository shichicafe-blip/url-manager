"use client";

import type { ColumnMeta, SheetRow } from "@/lib/sheets/types";
import { formatCellValue, parseDisplayNumber } from "@/lib/sheets/format";

type KpiViewProps = {
  rows: SheetRow[];
  kpiColumns: ColumnMeta[];
};

export function KpiView({ rows, kpiColumns }: KpiViewProps) {
  const latestRow = rows[rows.length - 1] ?? rows[0];
  const columns = kpiColumns.length > 0 ? kpiColumns : [];

  if (!latestRow || columns.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-[15px] text-[#8e8e93]">
        KPIとして表示できる数値列がありません
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 px-4 pb-6">
      {columns.map((column) => {
        const raw = latestRow[column.key] ?? null;
        const num = parseDisplayNumber(raw);
        const isLarge = num !== null && Math.abs(num) >= 1000;

        return (
          <div
            key={column.key}
            className="rounded-2xl bg-white p-4 ios-icon-shadow"
          >
            <p className="text-[13px] font-medium text-[#8e8e93]">{column.label}</p>
            <p
              className={`mt-2 font-bold tracking-tight text-[#1c1c1e] ${
                isLarge ? "text-[22px]" : "text-[28px]"
              }`}
            >
              {formatCellValue(raw, column.kind)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
