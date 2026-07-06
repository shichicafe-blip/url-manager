"use client";

import type { ColumnMeta, SheetRow } from "@/lib/sheets/types";
import { formatCellValue } from "@/lib/sheets/format";

type TableViewProps = {
  rows: SheetRow[];
  columns: ColumnMeta[];
  stickyColumnKey?: string | null;
};

export function TableView({ rows, columns, stickyColumnKey }: TableViewProps) {
  const stickyKey = stickyColumnKey ?? columns[0]?.key;
  const stickyColumn = columns.find((c) => c.key === stickyKey) ?? columns[0];
  const scrollColumns = columns.filter((c) => c.key !== stickyColumn?.key);

  if (columns.length <= 2) {
    return (
      <div className="space-y-3 px-4 pb-6">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="rounded-2xl bg-white p-4 ios-icon-shadow">
            {columns.map((column) => (
              <div key={column.key} className="flex justify-between gap-3 py-1.5">
                <span className="text-[13px] text-[#8e8e93]">{column.label}</span>
                <span className="text-[15px] font-medium text-[#1c1c1e]">
                  {formatCellValue(row[column.key] ?? null, column.kind)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 pb-6">
      <div className="overflow-hidden rounded-2xl bg-white ios-icon-shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#e5e5ea] bg-[#f9f9fb]">
                {stickyColumn && (
                  <th className="sticky left-0 z-10 min-w-[120px] bg-[#f9f9fb] px-3 py-3 text-[12px] font-semibold text-[#8e8e93]">
                    {stickyColumn.label}
                  </th>
                )}
                {scrollColumns.map((column) => (
                  <th
                    key={column.key}
                    className="min-w-[100px] px-3 py-3 text-[12px] font-semibold text-[#8e8e93]"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-[#f2f2f7] last:border-0">
                  {stickyColumn && (
                    <td className="sticky left-0 z-10 bg-white px-3 py-3 text-[14px] font-medium text-[#1c1c1e]">
                      {formatCellValue(row[stickyColumn.key] ?? null, stickyColumn.kind)}
                    </td>
                  )}
                  {scrollColumns.map((column) => (
                    <td key={column.key} className="px-3 py-3 text-[14px] text-[#1c1c1e]">
                      {formatCellValue(row[column.key] ?? null, column.kind)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
