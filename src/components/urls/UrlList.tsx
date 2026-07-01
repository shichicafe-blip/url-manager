"use client";

import { UrlCard } from "@/components/urls/UrlCard";
import { UrlTable } from "@/components/urls/UrlTable";
import type { ViewMode } from "@/hooks/useViewMode";
import type { UrlWithCategory } from "@/features/urls/types";

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
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-white py-16 text-center">
        <p className="text-sm font-medium text-neutral-700">URLがまだ登録されていません</p>
        <p className="mt-1 text-sm text-neutral-500">「+ URL追加」から登録してください</p>
      </div>
    );
  }

  if (viewMode === "table") {
    return (
      <UrlTable
        urls={urls}
        onOpen={onOpen}
        onEdit={onEdit}
        onToggleFavorite={onToggleFavorite}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
  );
}
