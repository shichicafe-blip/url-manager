#!/usr/bin/env node
/**
 * 開発用: サインアップ → ログイン → URL 1件登録までを CLI で確認
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(url, key);
const email = `devtest${Date.now()}@gmail.com`;
const password = "testpass123";

async function devConfirmViaRpc(email) {
  const { error } = await supabase.rpc("dev_confirm_user", {
    user_email: email,
  });
  return !error;
}

async function devSignIn(email, password) {
  let result = await supabase.auth.signInWithPassword({ email, password });
  if (!result.error) return result;

  const msg = result.error.message.toLowerCase();
  if (!msg.includes("email not confirmed") && !msg.includes("email_not_confirmed")) {
    return result;
  }

  const confirmed = await devConfirmViaRpc(email);
  if (!confirmed) return result;

  return supabase.auth.signInWithPassword({ email, password });
}

async function main() {
  console.log("1. Sign up:", email);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error("Sign up failed:", signUpError.message);
    process.exit(1);
  }

  if (!signUpData.session) {
    console.log("2. No session after signUp, confirming via RPC...");
    const rpcOk = await devConfirmViaRpc(email);
    console.log("   RPC result:", rpcOk ? "OK" : "FAILED");
  } else {
    console.log("2. Session returned from signUp");
  }

  console.log("3. Sign in...");
  const { data: signInData, error: signInError } = await devSignIn(email, password);
  if (signInError) {
    console.error("Sign in failed:", signInError.message);
    process.exit(1);
  }

  console.log("   Signed in as:", signInData.user?.email);

  const authed = createClient(url, key, {
    global: {
      headers: { Authorization: `Bearer ${signInData.session.access_token}` },
    },
  });

  console.log("4. Fetch categories...");
  const { data: categories, error: catError } = await authed
    .from("categories")
    .select("id")
    .limit(1);

  if (catError || !categories?.length) {
    console.error("Categories failed:", catError?.message ?? "empty");
    process.exit(1);
  }

  console.log("5. Insert URL...");
  const { data: created, error: insertError } = await authed
    .from("urls")
    .insert({
      title: "Test URL",
      url: "https://example.com",
      category_id: categories[0].id,
      user_id: signInData.user.id,
    })
    .select("id, title")
    .single();

  if (insertError) {
    console.error("URL insert failed:", insertError.message);
    process.exit(1);
  }

  console.log("SUCCESS:", created);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
