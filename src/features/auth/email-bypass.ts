import type { SupabaseClient } from "@supabase/supabase-js";

function isEmailNotConfirmedError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("email not confirmed") ||
    lower.includes("email_not_confirmed") ||
    (lower.includes("メール") && lower.includes("確認"))
  );
}

function isRecoverableSignUpError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    isEmailNotConfirmedError(message) ||
    lower.includes("already registered") ||
    lower.includes("already exists") ||
    lower.includes("user already registered") ||
    lower.includes("rate limit")
  );
}

async function confirmUserViaRpc(
  supabase: SupabaseClient,
  email: string,
): Promise<boolean> {
  const { error } = await supabase.rpc("dev_confirm_user", {
    user_email: email.trim(),
  });
  return !error;
}

export async function signInWithEmailConfirmBypass(
  supabase: SupabaseClient,
  email: string,
  password: string,
) {
  const trimmedEmail = email.trim();
  let result = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  });

  if (!result.error || !isEmailNotConfirmedError(result.error.message)) {
    return result;
  }

  const confirmed = await confirmUserViaRpc(supabase, trimmedEmail);
  if (!confirmed) return result;

  return supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  });
}

export async function signUpAndEnter(
  supabase: SupabaseClient,
  email: string,
  password: string,
  displayName?: string,
) {
  const trimmedEmail = email.trim();
  const { data, error } = await supabase.auth.signUp({
    email: trimmedEmail,
    password,
    options: {
      data: { display_name: displayName?.trim() || undefined },
    },
  });

  if (data.session) {
    return { error: null };
  }

  if (error && !isRecoverableSignUpError(error.message)) {
    return { error };
  }

  await confirmUserViaRpc(supabase, trimmedEmail);
  const signIn = await signInWithEmailConfirmBypass(
    supabase,
    trimmedEmail,
    password,
  );

  if (signIn.error) {
    return { error: signIn.error };
  }

  return { error: null };
}
