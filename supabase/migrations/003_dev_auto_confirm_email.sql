-- メール確認スキップ（anon key から dev_confirm_user RPC を呼ぶ前提）

create or replace function public.dev_confirm_user(user_email text)
returns void
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  update auth.users
  set email_confirmed_at = coalesce(email_confirmed_at, now())
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
  return new;
end;
$$;

drop trigger if exists on_auth_user_auto_confirm on auth.users;
create trigger on_auth_user_auto_confirm
  before insert on auth.users
  for each row execute function public.handle_auth_user_auto_confirm();

update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email_confirmed_at is null;
