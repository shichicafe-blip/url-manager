"use client";

import type { ViewMode } from "@/hooks/useViewMode";
import { cn } from "@/lib/utils/cn";

type UrlViewToggleProps = {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
};

export function UrlViewToggle({ viewMode, onChange }: UrlViewToggleProps) {
  return (
    <div className="inline-flex rounded-md border border-neutral-200 bg-white p-1">
      {(["card", "table"] as ViewMode[]).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={cn(
            "rounded px-3 py-1 text-sm transition-colors",
            viewMode === mode
              ? "bg-neutral-900 text-white"
              : "text-neutral-600 hover:bg-neutral-50",
          )}
        >
          {mode === "card" ? "カード" : "テーブル"}
        </button>
      ))}
    </div>
  );
}
