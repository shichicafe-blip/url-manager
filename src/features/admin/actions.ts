"use server";

import { failure, success, type ActionResult } from "@/lib/actions/result";
import { getCurrentProfile, isAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Profile, UserRole } from "@/types/database";
import { revalidatePath } from "next/cache";

export async function getProfiles(): Promise<Profile[]> {
  if (!isSupabaseConfigured()) return [];

  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile)) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getProfiles:", error.message);
    return [];
  }

  return data ?? [];
}

export async function updateUserRole(
  userId: string,
  role: UserRole,
): Promise<ActionResult<Profile>> {
  if (!isSupabaseConfigured()) return failure("Supabase が未設定です");

  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile)) return failure("管理者権限が必要です");
  if (userId === profile.id && role !== "admin") {
    return failure("自分自身の管理者権限は解除できません");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) return failure(error.message);

  revalidatePath("/admin");
  return success(data);
}
