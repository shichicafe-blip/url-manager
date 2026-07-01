import { confirmUserEmailDirect } from "@/lib/db/confirm-user-email";
import type { AuthError, SupabaseClient } from "@supabase/supabase-js";

export function isDevEmailBypassEnabled(): boolean {
  return process.env.DEV_SKIP_EMAIL_CONFIRM !== "false";
}

function isEmailNotConfirmedError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("email not confirmed") ||
    lower.includes("email_not_confirmed") ||
    (lower.includes("メール") && lower.includes("確認"))
  );
}

export async function devConfirmUser(
  supabase: SupabaseClient,
  email: string,
): Promise<boolean> {
  const trimmedEmail = email.trim();

  const { error: rpcError } = await supabase.rpc("dev_confirm_user", {
    user_email: trimmedEmail,
  });
  if (!rpcError) return true;

  return confirmUserEmailDirect(trimmedEmail);
}

export async function devSignInWithPassword(
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

  const confirmed = await devConfirmUser(supabase, trimmedEmail);
  if (!confirmed) return result;

  return supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  });
}

export async function devSignUpAndEnter(
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

  if (error) return { error };

  if (data.session) {
    return { error: null };
  }

  await devConfirmUser(supabase, trimmedEmail);
  return devSignInWithPassword(supabase, trimmedEmail, password);
}
