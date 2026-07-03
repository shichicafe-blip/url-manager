-- ============================================================
-- 005: categories に icon_url（と階層用 parent_id）を追加
-- 実行場所: Supabase Dashboard → SQL Editor → Run
-- 本番DBを直接変更するのはこの SQL を手動実行したときのみ
-- ============================================================

-- 1) カラム追加（既にあればスキップ）
alter table public.categories
  add column if not exists icon_url text null;

alter table public.categories
  add column if not exists parent_id uuid null references public.categories (id) on delete restrict;

-- 2) インデックス（階層表示用・既にあればスキップ）
create index if not exists idx_categories_parent_id on public.categories (parent_id);

-- 3) URL 並び替え用（編集モードの DnD で使う・既にあればスキップ）
alter table public.urls
  add column if not exists sort_order integer not null default 0;

create index if not exists idx_urls_sort_order on public.urls (category_id, sort_order);

-- 4) 反映確認（icon_url 列が見えれば OK）
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'categories'
  and column_name in ('icon_url', 'parent_id')
order by column_name;

-- 5) サンプル確認（既存行は icon_url = NULL のまま）
select id, name, slug, parent_id, icon_url, sort_order
from public.categories
order by sort_order
limit 5;

-- ============================================================
-- schema cache について
-- SQL Editor で Run 後、通常は数秒で PostgREST に反映されます。
-- まだ同じエラーが出る場合:
--   1) ブラウザをハードリロード
--   2) 1〜2分待って再試行
--   3) Supabase Dashboard → Project Settings → API を開き直す
--   4) それでも直らない場合はプロジェクトを Pause → Resume
-- ============================================================
