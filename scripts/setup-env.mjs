#!/usr/bin/env node
/**
 * .env.local を作成するセットアップスクリプト
 * 使い方: node scripts/setup-env.mjs <SUPABASE_URL> <SUPABASE_ANON_KEY>
 */
import { writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const [url, anonKey] = process.argv.slice(2);

if (!url || !anonKey) {
  console.error(`
使い方:
  node scripts/setup-env.mjs <SUPABASE_URL> <SUPABASE_ANON_KEY>

例:
  node scripts/setup-env.mjs https://abcdefgh.supabase.co eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Supabase Dashboard > Project Settings > API から取得できます。
`);
  process.exit(1);
}

if (!url.startsWith("https://") || !url.includes("supabase.co")) {
  console.warn("警告: URL の形式が通常の Supabase URL と異なります。続行します...");
}

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  console.error("エラー: .env.local は既に存在します。削除してから再実行してください。");
  process.exit(1);
}

const content = `# Supabase (自動生成)
NEXT_PUBLIC_SUPABASE_URL=${url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}
`;

writeFileSync(envPath, content, "utf8");
console.log("✓ .env.local を作成しました");
console.log("  次のステップ: Supabase SQL Editor で supabase/full_setup.sql を実行");
