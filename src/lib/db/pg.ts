import { getSupabaseUrl } from "@/lib/supabase/config";

function getProjectRef(): string | null {
  const url = getSupabaseUrl() ?? "";
  const match = url.match(/^https:\/\/([a-z0-9]+)\.supabase\.co\/?$/i);
  return match?.[1] ?? null;
}

export function getDatabasePassword(): string | undefined {
  return process.env.SUPABASE_DB_PASSWORD;
}

export function canUseDirectDatabase(): boolean {
  return Boolean(getDatabasePassword() && getProjectRef());
}

export async function withPostgres<T>(
  fn: (query: (text: string, params?: unknown[]) => Promise<{ rowCount: number | null }>) => Promise<T>,
): Promise<T> {
  const password = getDatabasePassword();
  const projectRef = getProjectRef();
  if (!password || !projectRef) {
    throw new Error("SUPABASE_DB_PASSWORD が未設定です");
  }

  const { Client } = await import("pg");
  const client = new Client({
    connectionString: `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    return await fn(async (text, params) => {
      const result = await client.query(text, params);
      return { rowCount: result.rowCount };
    });
  } finally {
    await client.end();
  }
}
