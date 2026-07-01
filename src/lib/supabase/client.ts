import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseKey, getSupabaseUrl } from "./config";
import type { Database } from "./types";

export function createClient() {
  return createBrowserClient<Database>(getSupabaseUrl()!, getSupabaseKey()!);
}
