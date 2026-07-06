"use client";

import { CardView } from "@/components/sheets/views/CardView";
import { ChartView } from "@/components/sheets/views/ChartView";
import { KpiView } from "@/components/sheets/views/KpiView";
import { ListDetailView, ListView } from "@/components/sheets/views/ListView";
import { TableView } from "@/components/sheets/views/TableView";
import { filterRows } from "@/lib/sheets/analyze";
import { formatRelativeTime } from "@/lib/sheets/format";
import type { SheetAnalysis, SheetData, SheetRow, ViewMode } from "@/lib/sheets/types";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { openUrl } from "@/features/urls/actions";

type SheetViewerProps = {
  urlId: string;
  title: string;
  initialPayload?: {
    data: SheetData;
    analysis: SheetAnalysis;
    fetchedAt: string;
  };
};

const VIEW_OPTIONS: { id: ViewMode; label: string }[] = [
  { id: "auto", label: "自動" },
  { id: "kpi", label: "KPI" },
  { id: "card", label: "カード" },
  { id: "list", label: "リスト" },
  { id: "table", label: "表" },
  { id: "chart", label: "グラフ" },
];

export function SheetViewer({ urlId, title, initialPayload }: SheetViewerProps) {
  const [data, setData] = useState<SheetData | null>(initialPayload?.data ?? null);
  const [analysis, setAnalysis] = useState<SheetAnalysis | null>(initialPayload?.analysis ?? null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(initialPayload?.fetchedAt ?? null);
  const [viewMode, setViewMode] = useState<ViewMode>("auto");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedRow, setSelectedRow] = useState<SheetRow | null>(null);
  const [loading, setLoading] = useState(!initialPayload);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openedRef = useRef(false);

  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    void openUrl(urlId);
  }, [urlId]);

  const loadSheet = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const response = await fetch(`/api/sheets/${urlId}`, { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "取得に失敗しました");

      setData(json.data);
      setAnalysis(json.analysis);
      setFetchedAt(json.fetchedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "取得に失敗しました");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [urlId]);

  useEffect(() => {
    if (!initialPayload) void loadSheet();
  }, [initialPayload, loadSheet]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadSheet(true);
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [loadSheet]);

  const filteredRows = useMemo(() => {
    if (!data) return [];
    return filterRows(data.rows, filters, searchQuery);
  }, [data, filters, searchQuery]);

  const activeView: Exclude<ViewMode, "auto"> = useMemo(() => {
    if (viewMode !== "auto") return viewMode;
    return analysis?.recommendedView ?? "card";
  }, [viewMode, analysis]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f2f2f7]">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#007aff] border-t-transparent" />
          <p className="text-[15px] text-[#8e8e93]">シートを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !data || !analysis) {
    return (
      <div className="mx-auto min-h-dvh max-w-md bg-[#f2f2f7] px-4 py-8">
        <Link href="/" className="text-[17px] text-[#007aff]">
          ‹ ホーム
        </Link>
        <div className="mt-8 rounded-2xl bg-white p-6 ios-icon-shadow">
          <h1 className="text-[20px] font-bold text-[#1c1c1e]">{title}</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[#ff3b30]">
            {error ?? "データを表示できません"}
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-[#8e8e93]">
            スプレッドシートを「リンクを知っている全員が閲覧可」に設定してください。元のシートは変更されません。
          </p>
          <button
            type="button"
            onClick={() => loadSheet()}
            className="mt-5 w-full rounded-xl bg-[#007aff] py-3 text-[17px] font-semibold text-white"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-[#f2f2f7] pb-safe">
      <header className="sticky top-0 z-20 bg-[#f2f2f7]/90 px-4 pb-3 pt-safe backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="text-[17px] text-[#007aff]">
            ‹ ホーム
          </Link>
          <button
            type="button"
            onClick={() => loadSheet(true)}
            disabled={refreshing}
            className="text-[15px] text-[#007aff] disabled:opacity-50"
          >
            {refreshing ? "更新中..." : "更新"}
          </button>
        </div>
        <h1 className="mt-2 text-[24px] font-bold tracking-tight text-[#1c1c1e]">{title}</h1>
        <p className="mt-1 text-[13px] text-[#8e8e93]">
          Smart Sheet Viewer · {filteredRows.length}件
          {fetchedAt ? ` · ${formatRelativeTime(fetchedAt)}` : ""}
        </p>

        <div className="ios-search mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5">
          <span className="text-sm text-[#8e8e93]">🔍</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="検索"
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#8e8e93]"
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {VIEW_OPTIONS.map((option) => {
            const isActive = viewMode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setViewMode(option.id);
                  setSelectedRow(null);
                }}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                  isActive ? "bg-[#007aff] text-white" : "bg-white text-[#8e8e93]",
                )}
              >
                {option.label}
                {option.id === "auto"
                  ? ` (${VIEW_OPTIONS.find((v) => v.id === analysis.recommendedView)?.label ?? "カード"})`
                  : ""}
              </button>
            );
          })}
        </div>

        {analysis.filterColumns.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {analysis.filterColumns.slice(0, 4).map((column) => {
              const values = Array.from(
                new Set(data.rows.map((row) => String(row[column.key] ?? "")).filter(Boolean)),
              ).slice(0, 20);

              return (
                <select
                  key={column.key}
                  value={filters[column.key] ?? "all"}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, [column.key]: e.target.value }))
                  }
                  className="rounded-full bg-white px-3 py-1.5 text-[13px] text-[#1c1c1e] outline-none"
                >
                  <option value="all">{column.label}</option>
                  {values.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              );
            })}
          </div>
        )}
      </header>

      <main className="pt-2">
        {selectedRow && activeView === "list" ? (
          <ListDetailView
            row={selectedRow}
            columns={analysis.columns}
            onBack={() => setSelectedRow(null)}
          />
        ) : activeView === "kpi" ? (
          <KpiView rows={filteredRows} kpiColumns={analysis.kpiColumns} />
        ) : activeView === "chart" ? (
          <ChartView
            rows={filteredRows}
            xColumn={analysis.chartXColumn}
            yColumns={analysis.chartYColumns}
          />
        ) : activeView === "table" ? (
          <TableView
            rows={filteredRows}
            columns={analysis.columns}
            stickyColumnKey={analysis.primaryColumn?.key}
          />
        ) : activeView === "list" ? (
          <ListView
            rows={filteredRows}
            columns={analysis.columns}
            primaryColumn={analysis.primaryColumn}
            onRowClick={setSelectedRow}
          />
        ) : (
          <CardView rows={filteredRows} columns={analysis.columns} />
        )}
      </main>
    </div>
  );
}
