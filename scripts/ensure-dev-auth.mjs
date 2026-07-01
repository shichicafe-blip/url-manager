#!/usr/bin/env node
import { spawnSync } from "node:child_process";
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

if (process.env.NODE_ENV === "production") process.exit(0);

const check = spawnSync("node", ["scripts/check-dev-auth.mjs"], {
  cwd: process.cwd(),
  encoding: "utf8",
});

if (check.status === 0) process.exit(0);

const hasCreds =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_ACCESS_TOKEN ||
  process.env.SUPABASE_DB_PASSWORD;

if (hasCreds) {
  const result = spawnSync("node", ["scripts/apply-dev-auth-sql.mjs"], {
    stdio: "inherit",
    cwd: process.cwd(),
  });
  process.exit(result.status ?? 0);
}

console.warn(
  "\n⚠ dev_confirm_user 未適用。Connect 画面の DB password を .env.local に SUPABASE_DB_PASSWORD として追加するとログイン時に自動確認されます。\n",
);
