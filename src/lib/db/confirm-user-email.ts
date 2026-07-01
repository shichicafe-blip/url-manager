import { canUseDirectDatabase, withPostgres } from "@/lib/db/pg";

export async function confirmUserEmailDirect(email: string): Promise<boolean> {
  if (!canUseDirectDatabase()) return false;

  const trimmed = email.trim();
  if (!trimmed) return false;

  try {
    const result = await withPostgres(async (query) =>
      query(
        `update auth.users
         set email_confirmed_at = coalesce(email_confirmed_at, now())
         where lower(email) = lower($1)`,
        [trimmed],
      ),
    );
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error("confirmUserEmailDirect:", error);
    return false;
  }
}

export async function applyDevAuthSqlDirect(): Promise<boolean> {
  if (!canUseDirectDatabase()) return false;

  const { readFileSync } = await import("node:fs");
  const { resolve } = await import("node:path");
  const sqlPath = resolve(process.cwd(), "supabase/patches/002_dev_auto_confirm_email.sql");
  const sql = readFileSync(sqlPath, "utf8");

  try {
    await withPostgres(async (query) => {
      await query(sql);
    });
    return true;
  } catch (error) {
    console.error("applyDevAuthSqlDirect:", error);
    return false;
  }
}
