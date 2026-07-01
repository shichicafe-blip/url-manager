import { confirmUserEmailDirect } from "@/lib/db/confirm-user-email";
import { createEmailUserDirect } from "@/lib/db/create-auth-user";
import { ensureAuthReady } from "@/lib/db/ensure-auth-ready";
import { canUseDirectDatabase } from "@/lib/db/pg";
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

function isRateLimitError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("rate limit") || lower.includes("too many requests");
}

function isUserAlreadyExistsError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("already registered") ||
    lower.includes("already exists") ||
    lower.includes("user already registered")
  );
}

function missingDbPasswordError(): AuthError {
  return {
    message:
      "メール送信なし登録には SUPABASE_DB_PASSWORD の設定が必要です。" +
      "Connect 画面の Database password を Vercel / .env.local に追加してください。",
    name: "AuthApiError",
    status: 500,
  } as AuthError;
}

export async function devConfirmUser(
  supabase: SupabaseClient,
  email: string,
): Promise<boolean> {
  await ensureAuthReady();

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
  await ensureAuthReady();

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

async function signUpViaDatabase(
  supabase: SupabaseClient,
  email: string,
  password: string,
  displayName?: string,
) {
  await ensureAuthReady();

  const created = await createEmailUserDirect(email, password, displayName);
  if (!created.ok) {
    if (created.reason === "no_db") {
      return { error: missingDbPasswordError() };
    }
    return {
      error: {
        message: "アカウント作成に失敗しました。",
        name: "AuthApiError",
        status: 500,
      } as AuthError,
    };
  }

  return devSignInWithPassword(supabase, email, password);
}

export async function devSignUpAndEnter(
  supabase: SupabaseClient,
  email: string,
  password: string,
  displayName?: string,
) {
  await ensureAuthReady();

  if (canUseDirectDatabase()) {
    return signUpViaDatabase(supabase, email, password, displayName);
  }

  const trimmedEmail = email.trim();
  const { data, error } = await supabase.auth.signUp({
    email: trimmedEmail,
    password,
    options: {
      data: { display_name: displayName?.trim() || undefined },
    },
  });

  if (error) {
    if (
      isRateLimitError(error.message) ||
      isUserAlreadyExistsError(error.message) ||
      isEmailNotConfirmedError(error.message)
    ) {
      await devConfirmUser(supabase, trimmedEmail);
      const signIn = await devSignInWithPassword(supabase, trimmedEmail, password);
      if (!signIn.error) return { error: null };
    }
    return { error };
  }

  if (data.session) {
    return { error: null };
  }

  await devConfirmUser(supabase, trimmedEmail);
  const signIn = await devSignInWithPassword(supabase, trimmedEmail, password);
  return { error: signIn.error };
}
