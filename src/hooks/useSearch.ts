"use client";

import { useMemo, useState } from "react";
import type { UrlWithCategory } from "@/features/urls/types";

export function useSearch(urls: UrlWithCategory[]) {
  const [query, setQuery] = useState("");

  const filteredUrls = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return urls;

    return urls.filter((item) => {
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
  }, [query, urls]);

  return { query, setQuery, filteredUrls };
}
