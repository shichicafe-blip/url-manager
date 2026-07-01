"use server";

import { failure, success, type ActionResult } from "@/lib/actions/result";
import {
  devSignInWithPassword,
  devSignUpAndEnter,
  isDevEmailBypassEnabled,
} from "@/features/auth/dev-auth";
import { ensureAuthReady } from "@/lib/db/ensure-auth-ready";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return failure("Supabase が未設定です");

  await ensureAuthReady();

  const supabase = await createClient();
  const signInResult = isDevEmailBypassEnabled()
    ? await devSignInWithPassword(supabase, email, password)
    : await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

  if (signInResult.error) return failure(signInResult.error.message);

  revalidatePath("/");
  redirect("/");
}

export async function signUp(
  email: string,
  password: string,
  displayName?: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return failure("Supabase が未設定です");

  await ensureAuthReady();

  const supabase = await createClient();

  if (isDevEmailBypassEnabled()) {
    const { error } = await devSignUpAndEnter(
      supabase,
      email,
      password,
      displayName,
    );
    if (!error) {
      revalidatePath("/");
      redirect("/");
    }
    if (error) return failure(error.message);
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { display_name: displayName?.trim() || undefined },
    },
  });

  if (error) return failure(error.message);

  if (data.session) {
    revalidatePath("/");
    redirect("/");
  }

  return success(undefined);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/login");
}
