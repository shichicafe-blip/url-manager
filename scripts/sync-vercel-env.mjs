#!/usr/bin/env node
/** .env.local の環境変数を Vercel に同期 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
if (!existsSync(envPath)) {
  console.error(".env.local がありません");
  process.exit(1);
}

const vars = {};
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
}

const keys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_DB_PASSWORD",
];

for (const key of keys) {
  const value = vars[key];
  if (!value) {
    console.warn(`skip: ${key} (未設定)`);
    continue;
  }
  for (const env of ["production", "preview"]) {
    try {
      execSync(`npx vercel env rm ${key} ${env} --yes`, { stdio: "ignore", cwd: process.cwd() });
    } catch {
      // ignore if missing
    }
    execSync(`npx vercel env add ${key} ${env} --yes`, {
      input: value,
      stdio: ["pipe", "inherit", "inherit"],
      cwd: process.cwd(),
    });
    console.log(`✓ ${key} (${env})`);
  }
}

console.log("\n完了。npx vercel deploy --prod で再デプロイしてください。");
