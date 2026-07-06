"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Category, CategoryFormData } from "@/features/categories/types";
import { getTopLevelCategories } from "@/lib/categories/tree";
import { useState } from "react";

type CategoryFormProps = {
  categories?: Category[];
  initialData?: Partial<CategoryFormData>;
  submitLabel?: string;
  onSubmit: (data: CategoryFormData) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  onCancel: () => void;
};

export function CategoryForm({
  categories = [],
  initialData,
  submitLabel = "保存",
  onSubmit,
  onDelete,
  onCancel,
}: CategoryFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [color, setColor] = useState(initialData?.color ?? "#6B7280");
  const [sortOrder, setSortOrder] = useState(initialData?.sortOrder ?? 0);
  const [parentId, setParentId] = useState<string | null>(initialData?.parentId ?? null);
  const [iconUrl, setIconUrl] = useState(initialData?.iconUrl ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const topLevel = getTopLevelCategories(categories);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        slug,
        color,
        sortOrder,
        parentId,
        iconUrl: iconUrl.trim() || null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !confirm("このフォルダを削除しますか？")) return;
    setIsSubmitting(true);
    try {
      await onDelete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">名前</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required disabled={isSubmitting} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">スラッグ</label>
        <Input value={slug} onChange={(e) => setSlug(e.target.value)} required disabled={isSubmitting} />
        <p className="mt-1 text-xs text-neutral-500">半角英小文字・数字・ハイフン</p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">親フォルダ</label>
        <select
          value={parentId ?? ""}
          onChange={(e) => setParentId(e.target.value || null)}
          disabled={isSubmitting}
          className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-base outline-none focus:border-neutral-400"
        >
          <option value="">なし（ホームに表示）</option>
          {topLevel.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">アイコン画像 URL</label>
        <Input
          value={iconUrl}
          onChange={(e) => setIconUrl(e.target.value)}
          placeholder="https://..."
          disabled={isSubmitting}
        />
        <p className="mt-1 text-xs text-neutral-500">未設定の場合は頭文字が表示されます</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">色</label>
          <input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            type="color"
            disabled={isSubmitting}
            className="h-11 w-full cursor-pointer rounded-xl border border-neutral-200 bg-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">並び順</label>
          <Input
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            type="number"
            disabled={isSubmitting}
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 pt-2">
        <div>
          {onDelete && (
            <Button type="button" variant="danger" size="sm" onClick={handleDelete} disabled={isSubmitting}>
              削除
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            キャンセル
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
