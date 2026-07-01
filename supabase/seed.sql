-- 初期カテゴリー投入
insert into public.categories (name, slug, color, sort_order) values
  ('Tebanashi', 'tebanashi', '#3B82F6', 1),
  ('単独アプリ', 'standalone-app', '#8B5CF6', 2),
  ('LP', 'lp', '#EC4899', 3),
  ('SNS', 'sns', '#F97316', 4),
  ('広告', 'ads', '#EF4444', 5),
  ('GitHub', 'github', '#171717', 6),
  ('Claude', 'claude', '#D97706', 7),
  ('ChatGPT', 'chatgpt', '#10B981', 8),
  ('API', 'api', '#6366F1', 9),
  ('Supabase', 'supabase', '#14B8A6', 10),
  ('Vercel', 'vercel', '#000000', 11),
  ('店舗', 'store', '#84CC16', 12),
  ('飲食事業', 'food-business', '#F59E0B', 13),
  ('資料', 'documents', '#64748B', 14)
on conflict (slug) do nothing;
