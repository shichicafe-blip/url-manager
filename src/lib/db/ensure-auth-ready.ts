import { applyDevAuthSqlDirect } from "@/lib/db/confirm-user-email";
import { canUseDirectDatabase } from "@/lib/db/pg";

let authReadyPromise: Promise<boolean> | null = null;

export async function ensureAuthReady(): Promise<boolean> {
  if (!canUseDirectDatabase()) return false;
  if (!authReadyPromise) {
    authReadyPromise = applyDevAuthSqlDirect().catch(() => false);
  }
  return authReadyPromise;
}
