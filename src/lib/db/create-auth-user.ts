import { canUseDirectDatabase, withPostgres } from "@/lib/db/pg";

type CreateUserResult =
  | { ok: true; created: boolean }
  | { ok: false; reason: "no_db" | "failed" };

export async function createEmailUserDirect(
  email: string,
  password: string,
  displayName?: string,
): Promise<CreateUserResult> {
  if (!canUseDirectDatabase()) return { ok: false, reason: "no_db" };

  const trimmedEmail = email.trim();
  const meta = displayName?.trim()
    ? { display_name: displayName.trim() }
    : {};

  try {
    return await withPostgres(async (query) => {
      const existing = await query(
        `select id from auth.users where lower(email) = lower($1) limit 1`,
        [trimmedEmail],
      );

      if ((existing.rowCount ?? 0) > 0) {
        await query(
          `update auth.users
           set
             email_confirmed_at = coalesce(email_confirmed_at, now()),
             confirmed_at = coalesce(confirmed_at, now())
           where lower(email) = lower($1)`,
          [trimmedEmail],
        );
        return { ok: true, created: false };
      }

      const inserted = await query(
        `with new_user as (
           insert into auth.users (
             id,
             instance_id,
             aud,
             role,
             email,
             encrypted_password,
             email_confirmed_at,
             raw_app_meta_data,
             raw_user_meta_data,
             created_at,
             updated_at,
             is_super_admin
           )
           values (
             gen_random_uuid(),
             '00000000-0000-0000-0000-000000000000',
             'authenticated',
             'authenticated',
             $1,
             crypt($2, gen_salt('bf')),
             now(),
             '{"provider":"email","providers":["email"]}'::jsonb,
             $3::jsonb,
             now(),
             now(),
             false
           )
           returning id, email
         )
         insert into auth.identities (
           id,
           user_id,
           provider_id,
           identity_data,
           provider,
           last_sign_in_at,
           created_at,
           updated_at
         )
         select
           gen_random_uuid(),
           id,
           id::text,
           jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
           'email',
           now(),
           now(),
           now()
         from new_user`,
        [trimmedEmail, password, JSON.stringify(meta)],
      );

      if ((inserted.rowCount ?? 0) === 0) {
        return { ok: false, reason: "failed" };
      }

      return { ok: true, created: true };
    });
  } catch (error) {
    console.error("createEmailUserDirect:", error);
    return { ok: false, reason: "failed" };
  }
}
