"use server";

import { failure, success, type ActionResult } from "@/lib/actions/result";
import { getCurrentProfile, isAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Tag } from "./types";
import { revalidatePath } from "next/cache";

export async function createTag(data: {
  name: string;
  color: string;
}): Promise<ActionResult<Tag>> {
  if (!isSupabaseConfigured()) return failure("Supabase が未設定です");
  if (!(await getCurrentProfile())) return failure("認証が必要です");

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("tags")
    .insert({ name: data.name.trim(), color: data.color })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return failure("このタグ名は既に存在します");
    return failure(error.message);
  }

  revalidatePath("/");
  return success(created);
}

export async function deleteTag(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return failure("Supabase が未設定です");

  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile)) return failure("管理者権限が必要です");

  const supabase = await createClient();
  const { error } = await supabase.from("tags").delete().eq("id", id);

  if (error) return failure(error.message);

  revalidatePath("/");
  return success(undefined);
}
