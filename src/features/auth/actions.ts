"use server";

import { failure, success, type ActionResult } from "@/lib/actions/result";
import {
  signInWithEmailConfirmBypass,
  signUpAndEnter,
} from "@/features/auth/email-bypass";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return failure("Supabase が未設定です");

  const supabase = await createClient();
  const signInResult = await signInWithEmailConfirmBypass(
    supabase,
    email,
    password,
  );

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

  const supabase = await createClient();
  const { error } = await signUpAndEnter(
    supabase,
    email,
    password,
    displayName,
  );

  if (!error) {
    revalidatePath("/");
    redirect("/");
  }

  return failure(error.message);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/login");
}
