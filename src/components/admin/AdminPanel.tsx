"use client";

import { updateUserRole } from "@/features/admin/actions";
import type { Profile, UserRole } from "@/types/database";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

type AdminPanelProps = {
  profiles: Profile[];
};

export function AdminPanel({ profiles }: AdminPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setError(null);
    setUpdatingId(userId);

    const result = await updateUserRole(userId, role);
    setUpdatingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.refresh();
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">ユーザー管理</h1>
          <p className="mt-1 text-sm text-neutral-500">社員の権限を管理します</p>
        </div>
        <Link href="/" className="text-sm text-neutral-600 hover:text-neutral-900">
          ← 戻る
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-neutral-500">名前</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-500">メール</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-500">権限</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-500">登録日</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">
                  {profile.display_name ?? "—"}
                </td>
                <td className="px-4 py-3 text-neutral-600">{profile.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={profile.role}
                    disabled={updatingId === profile.id}
                    onChange={(e) => handleRoleChange(profile.id, e.target.value as UserRole)}
                    className="rounded-md border border-neutral-200 px-2 py-1 text-sm"
                  >
                    <option value="admin">管理者</option>
                    <option value="member">メンバー</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {new Date(profile.created_at).toLocaleDateString("ja-JP")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
