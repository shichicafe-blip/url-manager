-- カテゴリ階層 + アイコン対応
alter table public.categories
  add column if not exists parent_id uuid null references public.categories (id) on delete restrict,
  add column if not exists icon_url text null;

create index if not exists idx_categories_parent_id on public.categories (parent_id);

alter table public.urls
  add column if not exists sort_order integer not null default 0;

create index if not exists idx_urls_sort_order on public.urls (category_id, sort_order);
