#!/usr/bin/env node
/**
 * Supabase リモート DB にスキーマ + シードを適用する
 *
 * 方法 A: .env.local に SUPABASE_ACCESS_TOKEN を設定
 * 方法 B: .env.local に SUPABASE_DB_PASSWORD を設定
 */
import { execSync } from "node:child_process";
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

function getProjectRef() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const match = url.match(/^https:\/\/([a-z0-9]+)\.supabase\.co\/?$/i);
  return match?.[1] ?? null;
}

async function setupViaManagementApi(projectRef, token) {
  const sqlPath = resolve(process.cwd(), "supabase/full_setup.sql");
  const query = readFileSync(sqlPath, "utf8");

  console.log("Management API で SQL を実行中...");
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );

  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Management API エラー (${res.status}): ${body}`);
  }

  console.log("✓ スキーマとシードデータを適用しました");
}

function setupViaCli(projectRef, password) {
  console.log("Supabase CLI でマイグレーションを適用中...");
  execSync(
    `npx supabase link --project-ref ${projectRef} --password "${password.replace(/"/g, '\\"')}" --yes`,
    { stdio: "inherit", cwd: process.cwd() },
  );
  execSync("npx supabase db push --linked --include-seed --yes", {
    stdio: "inherit",
    cwd: process.cwd(),
  });
  console.log("✓ マイグレーションとシードを適用しました");
}

async function verifySetup(projectRef) {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!key || !url) return;

  const res = await fetch(`${url}/rest/v1/categories?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });

  if (res.ok) {
    console.log("✓ categories テーブルを確認しました");
    return;
  }

  const text = await res.text();
  throw new Error(`セットアップ後も categories テーブルにアクセスできません: ${text}`);
}

loadEnvLocal();

const projectRef = getProjectRef();
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!projectRef) {
  console.error("エラー: .env.local の NEXT_PUBLIC_SUPABASE_URL が不正です");
  process.exit(1);
}

if (!accessToken && !dbPassword) {
  console.error(`
Supabase の SQL セットアップには追加の認証情報が必要です。

.env.local に以下のいずれかを追加してください:

  方法 A (推奨):
    SUPABASE_ACCESS_TOKEN=your_token
    → https://supabase.com/dashboard/account/tokens で作成

  方法 B:
    SUPABASE_DB_PASSWORD=your_db_password
    → Supabase Dashboard > Project Settings > Database

追加後、再度実行:
  npm run db:setup

または Supabase Dashboard > SQL Editor で supabase/full_setup.sql を実行してください。
`);
  process.exit(1);
}

try {
  if (accessToken) {
    await setupViaManagementApi(projectRef, accessToken);
  } else {
    setupViaCli(projectRef, dbPassword);
  }
  await verifySetup(projectRef);
} catch (error) {
  console.error("セットアップ失敗:", error instanceof Error ? error.message : error);
  process.exit(1);
}
