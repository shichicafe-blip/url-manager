"use client";

import { Button } from "@/components/ui/Button";
import { signOut } from "@/features/auth/actions";
import type { Profile } from "@/types/database";
import Link from "next/link";

type UserMenuProps = {
  profile: Profile;
};

export function UserMenu({ profile }: UserMenuProps) {
  const displayName = profile.display_name ?? profile.email.split("@")[0];

  return (
    <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
      {profile.role === "admin" && (
        <Link
          href="/admin"
          className="hidden text-sm text-neutral-600 hover:text-neutral-900 sm:inline"
        >
          管理
        </Link>
      )}
      <div className="hidden text-right sm:block">
        <p className="max-w-[8rem] truncate text-sm font-medium text-neutral-900 lg:max-w-none">
          {profile.display_name ?? profile.email}
        </p>
        <p className="text-xs text-neutral-500">
          {profile.role === "admin" ? "管理者" : "メンバー"}
        </p>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => signOut()}
        className="min-h-10"
        aria-label={`${displayName} をログアウト`}
      >
        <span className="sm:hidden">退出</span>
        <span className="hidden sm:inline">ログアウト</span>
      </Button>
    </div>
  );
}
