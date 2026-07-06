export type { Category } from "@/types/database";

export type CategoryFormData = {
  name: string;
  slug: string;
  color: string;
  sortOrder: number;
  parentId?: string | null;
  iconUrl?: string | null;
};
