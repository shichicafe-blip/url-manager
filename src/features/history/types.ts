export type { UrlAccessLog } from "@/types/database";

export type RecentUrl = {
  id: string;
  title: string;
  url: string;
  openedAt: string;
  categoryName: string;
};
