"use client";

import { UrlCard } from "@/components/urls/UrlCard";
import { UrlTable } from "@/components/urls/UrlTable";
import type { ViewMode } from "@/hooks/useViewMode";
import type { UrlWithCategory } from "@/features/urls/types";
import { cn } from "@/lib/utils/cn";

type UrlListProps = {
  urls: UrlWithCategory[];
  viewMode: ViewMode;
  onOpen: (url: UrlWithCategory) => void;
  onEdit: (url: UrlWithCategory) => void;
  onToggleFavorite: (urlId: string) => void;
};

export function UrlList({ urls, viewMode, onOpen, onEdit, onToggleFavorite }: UrlListProps) {
  if (urls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-white px-4 py-12 text-center sm:py-16">
        <p className="text-sm font-medium text-neutral-700">URLがまだ登録されていません</p>
        <p className="mt-1 text-sm text-neutral-500">「+ URL追加」から登録してください</p>
      </div>
    );
  }

  return (
    <>
      {viewMode === "table" && (
        <div className="hidden sm:block">
          <UrlTable
            urls={urls}
            onOpen={onOpen}
            onEdit={onEdit}
            onToggleFavorite={onToggleFavorite}
          />
        </div>
      )}

      <div
        className={cn(
          "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3",
          viewMode === "table" && "sm:hidden",
        )}
      >
        {urls.map((url) => (
          <UrlCard
            key={url.id}
            url={url}
            onOpen={onOpen}
            onEdit={onEdit}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </>
  );
}
