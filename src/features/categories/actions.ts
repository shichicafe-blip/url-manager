"use server";

import { failure, success, type ActionResult } from "@/lib/actions/result";
import { getCurrentProfile, isAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Category } from "./types";
import { revalidatePath } from "next/cache";
import type { Database } from "@/lib/supabase/types";

type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];
type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];

type CategoryInput = {
  name: string;
  slug: string;
  color: string;
  sortOrder: number;
  parentId?: string | null;
  iconUrl?: string | null;
};

function validateCategoryInput(data: CategoryInput): string | null {
  if (!data.name.trim()) return "名前を入力してください";
  if (!data.slug.trim()) return "スラッグを入力してください";
  if (!/^[a-z0-9-]+$/.test(data.slug)) {
    return "スラッグは半角英小文字・数字・ハイフンのみ使用できます";
  }
  return null;
}

function buildCategoryInsertRow(data: CategoryInput): CategoryInsert {
  const row: CategoryInsert = {
    name: data.name.trim(),
    slug: data.slug.trim(),
    color: data.color,
    sort_order: data.sortOrder,
  };

  if (data.parentId) {
    row.parent_id = data.parentId;
  }

  const iconUrl = data.iconUrl?.trim();
  if (iconUrl) {
    row.icon_url = iconUrl;
  }

  return row;
}

function applyCategoryUpdates(
  data: Partial<CategoryInput>,
  payload: CategoryUpdate,
) {
  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.slug !== undefined) {
    if (!/^[a-z0-9-]+$/.test(data.slug)) {
      return "スラッグは半角英小文字・数字・ハイフンのみ使用できます";
    }
    payload.slug = data.slug.trim();
  }
  if (data.color !== undefined) payload.color = data.color;
  if (data.sortOrder !== undefined) payload.sort_order = data.sortOrder;
  if (data.parentId) payload.parent_id = data.parentId;
  if (data.parentId === null) payload.parent_id = null;
  if (data.iconUrl !== undefined) {
    const iconUrl = data.iconUrl?.trim();
    payload.icon_url = iconUrl || null;
  }
  return null;
}

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile) return failure("認証が必要です") as ActionResult<never>;
  if (!isAdmin(profile)) return failure("管理者権限が必要です") as ActionResult<never>;
  return null;
}

export async function createCategory(data: CategoryInput): Promise<ActionResult<Category>> {
  if (!isSupabaseConfigured()) return failure("Supabase が未設定です");

  const adminError = await requireAdmin();
  if (adminError) return adminError;

  const validationError = validateCategoryInput(data);
  if (validationError) return failure(validationError);

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("categories")
    .insert(buildCategoryInsertRow(data))
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return failure("このスラッグは既に使われています");
    return failure(error.message);
  }

  revalidatePath("/");
  return success(created);
}

export async function updateCategory(
  id: string,
  data: Partial<CategoryInput>,
): Promise<ActionResult<Category>> {
  if (!isSupabaseConfigured()) return failure("Supabase が未設定です");

  const adminError = await requireAdmin();
  if (adminError) return adminError;

  const payload: CategoryUpdate = {};
  const updateError = applyCategoryUpdates(data, payload);
  if (updateError) return failure(updateError);

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("categories")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return failure("このスラッグは既に使われています");
    return failure(error.message);
  }

  revalidatePath("/");
  return success(updated);
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return failure("Supabase が未設定です");

  const adminError = await requireAdmin();
  if (adminError) return adminError;

  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return failure("このカテゴリーに紐づく URL があるため削除できません");
    }
    return failure(error.message);
  }

  revalidatePath("/");
  return success(undefined);
}

export async function reorderCategories(orderedIds: string[]): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return failure("Supabase が未設定です");

  const adminError = await requireAdmin();
  if (adminError) return adminError;

  const supabase = await createClient();
  const updates = orderedIds.map((id, index) =>
    supabase.from("categories").update({ sort_order: index + 1 }).eq("id", id),
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return failure(failed.error.message);

  revalidatePath("/");
  return success(undefined);
}
