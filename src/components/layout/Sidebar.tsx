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
  open: boolean;
  onClose: () => void;
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
  open,
  onClose,
  onFilterChange,
  onManageCategories,
}: SidebarProps) {
  const selectFilter = (filter: UrlFilter) => {
    onFilterChange(filter);
    onClose();
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col border-r border-neutral-200 bg-neutral-50 transition-transform duration-200 ease-out md:relative md:z-0 md:w-64 md:shrink-0 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4">
          <div>
            <h1 className="text-sm font-semibold text-neutral-900">URL管理アプリ</h1>
            <p className="mt-1 text-xs text-neutral-500">REPLUSWORKS</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 md:hidden"
            aria-label="メニューを閉じる"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 pb-safe">
          <button
            type="button"
            onClick={() => selectFilter("all")}
            className={cn(
              "mb-1 flex min-h-11 w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors",
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
              onClick={() => selectFilter(item.id)}
              className={cn(
                "mb-1 flex min-h-11 w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
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
                onClick={() => selectFilter(category.id)}
                className={cn(
                  "mb-1 flex min-h-11 w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
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
                  onClick={() => selectFilter(`tag:${tag.id}`)}
                  className={cn(
                    "mb-1 flex min-h-11 w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
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
          <div className="border-t border-neutral-200 p-3 pb-safe">
            <button
              type="button"
              onClick={() => {
                onManageCategories();
                onClose();
              }}
              className="flex min-h-11 w-full items-center rounded-md px-3 py-2 text-left text-sm text-neutral-600 hover:bg-neutral-100"
            >
              カテゴリー管理
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
