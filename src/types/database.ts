import type { Database } from "@/lib/supabase/types";

export type { Database };

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Url = Database["public"]["Tables"]["urls"]["Row"];
export type UrlAccessLog = Database["public"]["Tables"]["url_access_logs"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Tag = Database["public"]["Tables"]["tags"]["Row"];
export type UserRole = Profile["role"];

export type UrlWithCategory = Url & {
  category: Category;
  tags: Tag[];
};
