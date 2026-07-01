"use server";

import { failure, success, type ActionResult } from "@/lib/actions/result";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { revalidatePath } from "next/cache";

export async function toggleFavorite(urlId: string): Promise<ActionResult<boolean>> {
  if (!isSupabaseConfigured()) return failure("Supabase が未設定です");
  if (!(await getCurrentProfile())) return failure("認証が必要です");

  const supabase = await createClient();
  const { data: current, error: fetchError } = await supabase
    .from("urls")
    .select("is_favorite")
    .eq("id", urlId)
    .single();

  if (fetchError) return failure(fetchError.message);

  const nextValue = !current.is_favorite;
  const { error: updateError } = await supabase
    .from("urls")
    .update({ is_favorite: nextValue })
    .eq("id", urlId);

  if (updateError) return failure(updateError.message);

  revalidatePath("/");
  return success(nextValue);
}
