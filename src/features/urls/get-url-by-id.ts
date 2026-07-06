import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { UrlWithCategory } from "@/features/urls/types";
import type { Tag } from "@/types/database";

type UrlTagRow = {
  tag: Tag | null;
};

type UrlRow = {
  category: UrlWithCategory["category"] | null;
  url_tags: UrlTagRow[] | null;
} & Omit<UrlWithCategory, "category" | "tags">;

export async function getUrlById(urlId: string): Promise<UrlWithCategory | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("urls")
    .select("*, category:categories(*), url_tags(tag:tags(*))")
    .eq("id", urlId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as UrlRow;
  if (!row.category) return null;

  const tags = (row.url_tags ?? [])
    .map((item) => item.tag)
    .filter((tag): tag is Tag => tag !== null);

  const { url_tags: _urlTags, category, ...url } = row;
  return { ...url, category, tags };
}
