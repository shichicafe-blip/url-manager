"use client";

import { Button } from "@/components/ui/Button";
import { signOut } from "@/features/auth/actions";
import type { Profile } from "@/types/database";
import Link from "next/link";

type UserMenuProps = {
  profile: Profile;
};

export function UserMenu({ profile }: UserMenuProps) {
  return (
    <div className="ml-auto flex items-center gap-3">
      {profile.role === "admin" && (
        <Link
          href="/admin"
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          管理
        </Link>
      )}
      <div className="text-right">
        <p className="text-sm font-medium text-neutral-900">
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
      >
        ログアウト
      </Button>
    </div>
  );
}
