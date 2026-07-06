import type { Category } from "@/types/database";
import type { UrlWithCategory } from "@/features/urls/types";

export function sortByOrder<T extends { sort_order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sort_order - b.sort_order);
}

export function getTopLevelCategories(categories: Category[]): Category[] {
  return sortByOrder(categories.filter((c) => !c.parent_id));
}

export function getChildCategories(categories: Category[], parentId: string): Category[] {
  return sortByOrder(categories.filter((c) => c.parent_id === parentId));
}

export function categoryHasChildren(categories: Category[], categoryId: string): boolean {
  return categories.some((c) => c.parent_id === categoryId);
}

export function getUrlsInCategory(urls: UrlWithCategory[], categoryId: string): UrlWithCategory[] {
  return [...urls.filter((u) => u.category_id === categoryId)].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
}

export function getLeafCategories(categories: Category[]): Category[] {
  const parentIds = new Set(
    categories.map((c) => c.parent_id).filter((id): id is string => Boolean(id)),
  );
  return sortByOrder(categories.filter((c) => !parentIds.has(c.id)));
}

export function getCategoryPath(categories: Category[], categoryId: string): Category[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const path: Category[] = [];
  let current = byId.get(categoryId);
  while (current) {
    path.unshift(current);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return path;
}

export function getFavoriteUrls(urls: UrlWithCategory[], limit = 8): UrlWithCategory[] {
  return urls.filter((u) => u.is_favorite).slice(0, limit);
}

export function getRecentUrls(urls: UrlWithCategory[], limit = 8): UrlWithCategory[] {
  return [...urls]
    .filter((u) => u.last_opened_at)
    .sort(
      (a, b) =>
        new Date(b.last_opened_at ?? 0).getTime() - new Date(a.last_opened_at ?? 0).getTime(),
    )
    .slice(0, limit);
}

export function searchAll(
  query: string,
  categories: Category[],
  urls: UrlWithCategory[],
): { categories: Category[]; urls: UrlWithCategory[] } {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return { categories: [], urls: [] };

  const matchedCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(normalized),
  );
  const matchedUrls = urls.filter((item) => {
    const haystack = [
      item.title,
      item.url,
      item.description ?? "",
      item.category.name,
      ...item.tags.map((tag) => tag.name),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });

  return { categories: matchedCategories, urls: matchedUrls };
}
