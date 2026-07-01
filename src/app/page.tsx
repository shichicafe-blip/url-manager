import { AppShell } from "@/components/layout/AppShell";
import { getCategories } from "@/features/categories/queries";
import { getTags } from "@/features/tags/queries";
import { getUrls } from "@/features/urls/queries";
import { getCurrentProfile, isAdmin } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [categories, urls, tags, profile] = await Promise.all([
    getCategories(),
    getUrls(),
    getTags(),
    getCurrentProfile(),
  ]);

  return (
    <AppShell
      initialCategories={categories}
      initialUrls={urls}
      initialTags={tags}
      profile={profile}
      isAdmin={profile ? isAdmin(profile) : false}
      isSupabaseConfigured={isSupabaseConfigured()}
    />
  );
}
