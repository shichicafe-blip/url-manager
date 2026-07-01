#!/usr/bin/env node
/**
 * 公開前のワンショットセットアップ
 * - 開発用 Auth SQL 適用
 * - mailer_autoconfirm 有効化（ACCESS_TOKEN がある場合）
 */
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

const hasCreds =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_ACCESS_TOKEN ||
  process.env.SUPABASE_DB_PASSWORD;

if (!hasCreds) {
  console.error(`
公開前セットアップには .env.local に以下のいずれか1つが必要です:

  SUPABASE_DB_PASSWORD=...     ← Connect 画面（推奨）
  SUPABASE_ACCESS_TOKEN=...
  DATABASE_URL=postgresql://...

追加後: npm run setup:production
`);
  process.exit(1);
}

const result = spawnSync("node", ["scripts/apply-dev-auth-sql.mjs"], {
  stdio: "inherit",
  cwd: process.cwd(),
});

if (result.status !== 0) process.exit(result.status ?? 1);

const check = spawnSync("node", ["scripts/check-dev-auth.mjs"], {
  cwd: process.cwd(),
  encoding: "utf8",
});

if (check.status === 0) {
  console.log("\n✓ 認証セットアップ完了。ログイン・URL登録が使えます。");
  console.log("\nVercel 公開時の環境変数:");
  console.log("  NEXT_PUBLIC_SUPABASE_URL");
  console.log("  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  console.log("  （SUPABASE_DB_PASSWORD はセットアップ後 Vercel から削除可）");
} else {
  console.warn("\n⚠ RPC 確認に失敗。SUPABASE_DB_PASSWORD が正しいか確認してください。");
  process.exit(1);
}
