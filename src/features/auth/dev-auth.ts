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

function missingDbPasswordError(): AuthError {
  return {
    message:
      "メール送信なし登録には SUPABASE_DB_PASSWORD が必要です。" +
      "Connect 画面の Database password を Vercel / .env.local に追加し、再デプロイしてください。",
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

export async function devSignUpAndEnter(
  supabase: SupabaseClient,
  email: string,
  password: string,
  displayName?: string,
) {
  await ensureAuthReady();

  if (!canUseDirectDatabase()) {
    return { error: missingDbPasswordError() };
  }

  const created = await createEmailUserDirect(email, password, displayName);
  if (!created.ok) {
    return {
      error: {
        message: "アカウント作成に失敗しました。Database password を確認してください。",
        name: "AuthApiError",
        status: 500,
      } as AuthError,
    };
  }

  return devSignInWithPassword(supabase, email, password);
}
