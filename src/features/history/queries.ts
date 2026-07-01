import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { RecentUrl } from "./types";

export async function getRecentUrls(limit = 20): Promise<RecentUrl[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("url_access_logs")
    .select("opened_at, url:urls(id, title, url, category:categories(name))")
    .order("opened_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentUrls:", error.message);
    return [];
  }

  return (data ?? []).flatMap((row) => {
    const url = row.url as {
      id: string;
      title: string;
      url: string;
      category: { name: string } | null;
    } | null;

    if (!url?.category) return [];

    return [
      {
        id: url.id,
        title: url.title,
        url: url.url,
        openedAt: row.opened_at,
        categoryName: url.category.name,
      },
    ];
  });
}
