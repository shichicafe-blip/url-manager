"use server";

import { failure, success, type ActionResult } from "@/lib/actions/result";
import { getCurrentProfile, isAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isValidUrl, normalizeUrl } from "@/lib/utils/url";
import type { Url } from "@/types/database";
import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/supabase/types";

type UrlUpdate = Database["public"]["Tables"]["urls"]["Update"];

type UrlInput = {
  title: string;
  url: string;
  categoryId: string;
  description?: string;
  tagIds?: string[];
};

function validateUrlInput(data: UrlInput): string | null {
  if (!data.title.trim()) return "タイトルを入力してください";
  if (!data.categoryId) return "カテゴリーを選択してください";

  const normalized = normalizeUrl(data.url);
  if (!isValidUrl(normalized)) return "有効な URL を入力してください";

  return null;
}

async function syncUrlTags(urlId: string, tagIds: string[] = []) {
  const supabase = await createClient();
  await supabase.from("url_tags").delete().eq("url_id", urlId);

  if (tagIds.length === 0) return;

  const { error } = await supabase.from("url_tags").insert(
    tagIds.map((tagId) => ({
      url_id: urlId,
      tag_id: tagId,
    })),
  );

  if (error) throw new Error(error.message);
}

export async function createUrl(data: UrlInput): Promise<ActionResult<Url>> {
  if (!isSupabaseConfigured()) return failure("Supabase が未設定です");

  const profile = await getCurrentProfile();
  if (!profile) return failure("認証が必要です");

  const validationError = validateUrlInput(data);
  if (validationError) return failure(validationError);

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("urls")
    .insert({
      title: data.title.trim(),
      url: normalizeUrl(data.url),
      category_id: data.categoryId,
      description: data.description?.trim() || null,
      user_id: profile.id,
    })
    .select("*")
    .single();

  if (error) return failure(error.message);

  try {
    await syncUrlTags(created.id, data.tagIds ?? []);
  } catch (tagError) {
    return failure(tagError instanceof Error ? tagError.message : "タグの保存に失敗しました");
  }

  revalidatePath("/");
  return success(created);
}

export async function updateUrl(
  id: string,
  data: Partial<UrlInput>,
): Promise<ActionResult<Url>> {
  if (!isSupabaseConfigured()) return failure("Supabase が未設定です");
  if (!(await getCurrentProfile())) return failure("認証が必要です");

  const payload: UrlUpdate = {};
  if (data.title !== undefined) payload.title = data.title.trim();
  if (data.url !== undefined) {
    const normalized = normalizeUrl(data.url);
    if (!isValidUrl(normalized)) return failure("有効な URL を入力してください");
    payload.url = normalized;
  }
  if (data.categoryId !== undefined) payload.category_id = data.categoryId;
  if (data.description !== undefined) payload.description = data.description.trim() || null;

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("urls")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return failure(error.message);

  if (data.tagIds !== undefined) {
    try {
      await syncUrlTags(id, data.tagIds);
    } catch (tagError) {
      return failure(tagError instanceof Error ? tagError.message : "タグの保存に失敗しました");
    }
  }

  revalidatePath("/");
  return success(updated);
}

export async function deleteUrl(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return failure("Supabase が未設定です");
  if (!(await getCurrentProfile())) return failure("認証が必要です");

  const supabase = await createClient();
  const { error } = await supabase.from("urls").delete().eq("id", id);

  if (error) return failure(error.message);

  revalidatePath("/");
  return success(undefined);
}

export async function openUrl(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return failure("Supabase が未設定です");

  const profile = await getCurrentProfile();
  if (!profile) return failure("認証が必要です");

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: current, error: fetchError } = await supabase
    .from("urls")
    .select("click_count")
    .eq("id", id)
    .single();

  if (fetchError) return failure(fetchError.message);

  const { error: logError } = await supabase.from("url_access_logs").insert({
    url_id: id,
    user_id: profile.id,
  });

  if (logError) return failure(logError.message);

  const { error: updateError } = await supabase
    .from("urls")
    .update({
      last_opened_at: now,
      click_count: (current.click_count ?? 0) + 1,
    })
    .eq("id", id);

  if (updateError) return failure(updateError.message);

  revalidatePath("/");
  return success(undefined);
}
