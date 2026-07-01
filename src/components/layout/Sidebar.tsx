"use client";

import { cn } from "@/lib/utils/cn";
import type { Category } from "@/features/categories/types";
import type { Tag } from "@/features/tags/types";
import type { UrlFilter } from "@/features/urls/types";

type SidebarProps = {
  categories: Category[];
  tags: Tag[];
  activeFilter: UrlFilter;
  isAdmin: boolean;
  onFilterChange: (filter: UrlFilter) => void;
  onManageCategories: () => void;
};

const specialItems: { id: UrlFilter; label: string; icon: string }[] = [
  { id: "favorites", label: "お気に入り", icon: "★" },
  { id: "recent", label: "最近開いた", icon: "🕐" },
];

export function Sidebar({
  categories,
  tags,
  activeFilter,
  isAdmin,
  onFilterChange,
  onManageCategories,
}: SidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50">
      <div className="border-b border-neutral-200 px-4 py-4">
        <h1 className="text-sm font-semibold text-neutral-900">URL管理アプリ</h1>
        <p className="mt-1 text-xs text-neutral-500">REPLUSWORKS</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <button
          type="button"
          onClick={() => onFilterChange("all")}
          className={cn(
            "mb-1 flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors",
            activeFilter === "all"
              ? "bg-white font-medium text-neutral-900 shadow-sm"
              : "text-neutral-600 hover:bg-neutral-100",
          )}
        >
          すべて
        </button>

        <div className="my-3 border-t border-neutral-200" />

        {specialItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onFilterChange(item.id)}
            className={cn(
              "mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
              activeFilter === item.id
                ? "bg-white font-medium text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:bg-neutral-100",
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div className="my-3 border-t border-neutral-200" />

        <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
          カテゴリー
        </p>

        {categories.length === 0 ? (
          <p className="px-3 text-sm text-neutral-400">カテゴリーがありません</p>
        ) : (
          categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onFilterChange(category.id)}
              className={cn(
                "mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                activeFilter === category.id
                  ? "bg-white font-medium text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:bg-neutral-100",
              )}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              {category.name}
            </button>
          ))
        )}

        {tags.length > 0 && (
          <>
            <div className="my-3 border-t border-neutral-200" />
            <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
              タグ
            </p>
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => onFilterChange(`tag:${tag.id}`)}
                className={cn(
                  "mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                  activeFilter === `tag:${tag.id}`
                    ? "bg-white font-medium text-neutral-900 shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100",
                )}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </button>
            ))}
          </>
        )}
      </nav>

      {isAdmin && (
        <div className="border-t border-neutral-200 p-3">
          <button
            type="button"
            onClick={onManageCategories}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-neutral-600 hover:bg-neutral-100"
          >
            カテゴリー管理
          </button>
        </div>
      )}
    </aside>
  );
}
