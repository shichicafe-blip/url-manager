export type { Url, UrlWithCategory, Tag } from "@/types/database";

export type UrlFormData = {
  title: string;
  url: string;
  categoryId: string;
  description?: string;
  tagIds?: string[];
};

export type UrlFilter = "all" | "favorites" | "recent" | string;
