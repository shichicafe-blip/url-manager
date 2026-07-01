-- URL管理アプリ 完全セットアップ SQL
-- Supabase Dashboard > SQL Editor にこのファイル全体を貼り付けて Run

-- ========== 001: 初期スキーマ ==========
create extension if not exists "pgcrypto";

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  color text not null default '#6B7280',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table public.url_access_logs (
  id uuid primary key default gen_random_uuid(),
  url_id uuid not null references public.urls (id) on delete cascade,
  user_id uuid null,
  opened_at timestamptz not null default now()
);

create index idx_urls_category_id on public.urls (category_id);
create index idx_urls_is_favorite on public.urls (is_favorite) where is_favorite = true;
create index idx_urls_last_opened_at on public.urls (last_opened_at desc nulls last);
create index idx_url_access_logs_url_id on public.url_access_logs (url_id);
create index idx_url_access_logs_opened_at on public.url_access_logs (opened_at desc);

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

-- ========== 002: 認証・権限・タグ・RLS ==========
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text null,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_count integer;
begin
  select count(*) into user_count from public.profiles;

  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    case when user_count = 0 then 'admin' else 'member' end
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#6B7280',
  created_at timestamptz not null default now()
);

create table public.url_tags (
  url_id uuid not null references public.urls (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (url_id, tag_id)
);

create index idx_url_tags_url_id on public.url_tags (url_id);
create index idx_url_tags_tag_id on public.url_tags (tag_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.urls enable row level security;
alter table public.url_access_logs enable row level security;
alter table public.tags enable row level security;
alter table public.url_tags enable row level security;

create policy "profiles_select_authenticated" on public.profiles for select to authenticated using (true);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_admin_update_roles" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "categories_select_authenticated" on public.categories for select to authenticated using (true);
create policy "categories_insert_admin" on public.categories for insert to authenticated with check (public.is_admin());
create policy "categories_update_admin" on public.categories for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "categories_delete_admin" on public.categories for delete to authenticated using (public.is_admin());

create policy "urls_select_authenticated" on public.urls for select to authenticated using (true);
create policy "urls_insert_authenticated" on public.urls for insert to authenticated with check (auth.uid() = user_id);
create policy "urls_update_authenticated" on public.urls for update to authenticated using (true) with check (true);
create policy "urls_delete_authenticated" on public.urls for delete to authenticated using (true);

create policy "url_access_logs_select_authenticated" on public.url_access_logs for select to authenticated using (true);
create policy "url_access_logs_insert_authenticated" on public.url_access_logs for insert to authenticated with check (auth.uid() = user_id);

create policy "tags_select_authenticated" on public.tags for select to authenticated using (true);
create policy "tags_insert_authenticated" on public.tags for insert to authenticated with check (true);
create policy "tags_update_authenticated" on public.tags for update to authenticated using (true) with check (true);
create policy "tags_delete_admin" on public.tags for delete to authenticated using (public.is_admin());

create policy "url_tags_select_authenticated" on public.url_tags for select to authenticated using (true);
create policy "url_tags_insert_authenticated" on public.url_tags for insert to authenticated with check (true);
create policy "url_tags_delete_authenticated" on public.url_tags for delete to authenticated using (true);

-- 権限付与
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- ========== seed: カテゴリー・タグ ==========
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

insert into public.tags (name, color) values
  ('重要', '#EF4444'),
  ('開発', '#3B82F6'),
  ('本番', '#10B981'),
  ('参考', '#F59E0B')
on conflict (name) do nothing;

-- ========== 003: 開発用メール確認スキップ ==========
create or replace function public.dev_confirm_user(user_email text)
returns void
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  update auth.users
  set
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    confirmed_at = coalesce(confirmed_at, now())
  where lower(email) = lower(user_email);
end;
$$;

revoke all on function public.dev_confirm_user(text) from public;
grant execute on function public.dev_confirm_user(text) to anon, authenticated, service_role;

create or replace function public.handle_auth_user_auto_confirm()
returns trigger
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  if new.email_confirmed_at is null then
    new.email_confirmed_at = now();
  end if;
  if new.confirmed_at is null then
    new.confirmed_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_auto_confirm on auth.users;
create trigger on_auth_user_auto_confirm
  before insert on auth.users
  for each row execute function public.handle_auth_user_auto_confirm();

update auth.users
set
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  confirmed_at = coalesce(confirmed_at, now())
where email_confirmed_at is null;
