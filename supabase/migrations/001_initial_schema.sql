-- URL管理アプリ 初期スキーマ
-- MVP: 認証なし（user_id は将来のログイン用に nullable で保持）

create extension if not exists "pgcrypto";

-- カテゴリー
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  color text not null default '#6B7280',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- URL
create table public.urls (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  user_id uuid null,
  title text not null,
  url text not null,
  description text null,
  icon_url text null,
  is_favorite boolean not null default false,
  click_count integer not null default 0,
  last_opened_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 閲覧履歴
create table public.url_access_logs (
  id uuid primary key default gen_random_uuid(),
  url_id uuid not null references public.urls (id) on delete cascade,
  user_id uuid null,
  opened_at timestamptz not null default now()
);

-- インデックス
create index idx_urls_category_id on public.urls (category_id);
create index idx_urls_is_favorite on public.urls (is_favorite) where is_favorite = true;
create index idx_urls_last_opened_at on public.urls (last_opened_at desc nulls last);
create index idx_url_access_logs_url_id on public.url_access_logs (url_id);
create index idx_url_access_logs_opened_at on public.url_access_logs (opened_at desc);

-- updated_at 自動更新
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger urls_updated_at
  before update on public.urls
  for each row execute function public.set_updated_at();

-- MVP: RLS は無効（将来ログイン追加時に有効化）
alter table public.categories disable row level security;
alter table public.urls disable row level security;
alter table public.url_access_logs disable row level security;
