#!/usr/bin/env node
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
  console.error("Missing env");
  process.exit(1);
}

const supabase = createClient(url, key);
const { error } = await supabase.rpc("dev_confirm_user", {
  user_email: "__rpc_check__@invalid.local",
});

if (!error) {
  console.log("OK: dev_confirm_user RPC exists");
  process.exit(0);
}

if (
  error.code === "PGRST202" ||
  error.message.includes("Could not find the function") ||
  error.message.includes("function public.dev_confirm_user")
) {
  console.log("MISSING: dev_confirm_user RPC not found");
  console.log("Run: npm run dev:auth-sql (requires DATABASE_URL or SUPABASE_ACCESS_TOKEN or SUPABASE_DB_PASSWORD in .env.local)");
  process.exit(2);
}

console.log("RPC error:", error.message);
process.exit(1);
