#!/usr/bin/env node
/**
 * 開発用 Auth SQL を適用（Dashboard / Service Role 不要）
 *
 * .env.local に以下のいずれか:
 *   DATABASE_URL=postgresql://...
 *   SUPABASE_ACCESS_TOKEN=...
 *   SUPABASE_DB_PASSWORD=...
 */
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

async function applyViaManagementApi(projectRef, token) {
  const sqlPath = resolve(process.cwd(), "supabase/patches/002_dev_auto_confirm_email.sql");
  const query = readFileSync(sqlPath, "utf8");

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
    throw new Error(`SQL failed (${res.status}): ${body}`);
  }

  const authRes = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mailer_autoconfirm: true,
        mailer_allow_unverified_email_sign_ins: true,
      }),
    },
  );

  if (!authRes.ok) {
    const authBody = await authRes.text();
    throw new Error(`Auth config failed (${authRes.status}): ${authBody}`);
  }

  console.log("✓ 開発用 Auth SQL + mailer_autoconfirm を適用しました");
}

async function applyViaDatabaseUrl(databaseUrl) {
  const { Client } = await import("pg");
  const sqlPath = resolve(process.cwd(), "supabase/patches/002_dev_auto_confirm_email.sql");
  const query = readFileSync(sqlPath, "utf8");

  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(query);
    console.log("✓ 開発用 Auth SQL を DATABASE_URL 経由で適用しました");
  } finally {
    await client.end();
  }
}

async function applyViaPassword(projectRef, password) {
  const { Client } = await import("pg");
  const sqlPath = resolve(process.cwd(), "supabase/patches/002_dev_auto_confirm_email.sql");
  const query = readFileSync(sqlPath, "utf8");
  const encoded = encodeURIComponent(password);
  const connectionString = `postgresql://postgres:${encoded}@db.${projectRef}.supabase.co:5432/postgres`;

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(query);
    console.log("✓ 開発用 Auth SQL を DB password 経由で適用しました");
  } finally {
    await client.end();
  }
}

function readArg(name) {
  const prefix = `--${name}=`;
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith(prefix)) return arg.slice(prefix.length);
  }
  return undefined;
}

async function readPasswordPrompt() {
  if (!process.stdin.isTTY) return undefined;

  const { createInterface } = await import("node:readline");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const password = await new Promise((resolve) => {
    rl.question("Supabase DB password (Connect 画面): ", (answer) => {
      rl.close();
      resolve(answer.trim() || undefined);
    });
  });
  return password;
}

loadEnvLocal();

const projectRef = getProjectRef();
let databaseUrl = process.env.DATABASE_URL;
let accessToken = process.env.SUPABASE_ACCESS_TOKEN;
let dbPassword = process.env.SUPABASE_DB_PASSWORD ?? readArg("password");

if (!projectRef) {
  console.error("エラー: NEXT_PUBLIC_SUPABASE_URL が不正です");
  process.exit(1);
}

if (!databaseUrl && !accessToken && !dbPassword) {
  dbPassword = await readPasswordPrompt();
}

if (!databaseUrl && !accessToken && !dbPassword) {
  console.error(`
開発用 Auth SQL を適用するには、以下のいずれか1つが必要です:

  .env.local に SUPABASE_DB_PASSWORD=... を追加
  .env.local に SUPABASE_ACCESS_TOKEN=... を追加
  .env.local に DATABASE_URL=postgresql://... を追加
  npm run dev:auth-sql -- --password=YOUR_DB_PASSWORD

DB password は Supabase Connect 画面で確認できます。
`);
  process.exit(1);
}

try {
  if (databaseUrl) {
    await applyViaDatabaseUrl(databaseUrl);
  } else if (accessToken) {
    await applyViaManagementApi(projectRef, accessToken);
  } else {
    await applyViaPassword(projectRef, dbPassword);
  }
} catch (error) {
  console.error("失敗:", error instanceof Error ? error.message : error);
  process.exit(1);
}
