-- 認証・権限・タグ・RLS

-- プロフィール（auth.users と連携）
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

-- 新規ユーザー登録時にプロフィール自動作成（最初の1人は admin）
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

-- タグ
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

-- 権限チェック用ヘルパー
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- RLS 有効化
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.urls enable row level security;
alter table public.url_access_logs enable row level security;
alter table public.tags enable row level security;
alter table public.url_tags enable row level security;

-- profiles
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_admin_update_roles"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- categories: 全員閲覧、admin のみ変更
create policy "categories_select_authenticated"
  on public.categories for select
  to authenticated
  using (true);

create policy "categories_insert_admin"
  on public.categories for insert
  to authenticated
  with check (public.is_admin());

create policy "categories_update_admin"
  on public.categories for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "categories_delete_admin"
  on public.categories for delete
  to authenticated
  using (public.is_admin());

-- urls: 認証ユーザー全員 CRUD（チーム共有）
create policy "urls_select_authenticated"
  on public.urls for select
  to authenticated
  using (true);

create policy "urls_insert_authenticated"
  on public.urls for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "urls_update_authenticated"
  on public.urls for update
  to authenticated
  using (true)
  with check (true);

create policy "urls_delete_authenticated"
  on public.urls for delete
  to authenticated
  using (true);

-- url_access_logs
create policy "url_access_logs_select_authenticated"
  on public.url_access_logs for select
  to authenticated
  using (true);

create policy "url_access_logs_insert_authenticated"
  on public.url_access_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

-- tags
create policy "tags_select_authenticated"
  on public.tags for select
  to authenticated
  using (true);

create policy "tags_insert_authenticated"
  on public.tags for insert
  to authenticated
  with check (true);

create policy "tags_update_authenticated"
  on public.tags for update
  to authenticated
  using (true)
  with check (true);

create policy "tags_delete_admin"
  on public.tags for delete
  to authenticated
  using (public.is_admin());

-- url_tags
create policy "url_tags_select_authenticated"
  on public.url_tags for select
  to authenticated
  using (true);

create policy "url_tags_insert_authenticated"
  on public.url_tags for insert
  to authenticated
  with check (true);

create policy "url_tags_delete_authenticated"
  on public.url_tags for delete
  to authenticated
  using (true);

-- 初期タグ
insert into public.tags (name, color) values
  ('重要', '#EF4444'),
  ('開発', '#3B82F6'),
  ('本番', '#10B981'),
  ('参考', '#F59E0B')
on conflict (name) do nothing;
