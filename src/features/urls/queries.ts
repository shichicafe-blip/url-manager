import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Tag } from "@/types/database";
import type { UrlWithCategory } from "./types";

type UrlTagRow = {
  tag: Tag | null;
};

type UrlRow = {
  category: UrlWithCategory["category"] | null;
  url_tags: UrlTagRow[] | null;
} & Omit<UrlWithCategory, "category" | "tags">;

function mapUrlRow(row: UrlRow): UrlWithCategory | null {
  if (!row.category) return null;

  const tags = (row.url_tags ?? [])
    .map((item) => item.tag)
    .filter((tag): tag is Tag => tag !== null);

  const { url_tags: _urlTags, category, ...url } = row;
  return { ...url, category, tags };
}

export async function getUrls(): Promise<UrlWithCategory[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("urls")
    .select("*, category:categories(*), url_tags(tag:tags(*))")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getUrls:", error.message);
    return [];
  }

  return (data ?? []).flatMap((row) => {
    const mapped = mapUrlRow(row as UrlRow);
    return mapped ? [mapped] : [];
  });
}
