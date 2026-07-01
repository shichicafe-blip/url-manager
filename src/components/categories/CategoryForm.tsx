"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { CategoryFormData } from "@/features/categories/types";
import { useState } from "react";

type CategoryFormProps = {
  initialData?: Partial<CategoryFormData>;
  submitLabel?: string;
  onSubmit: (data: CategoryFormData) => Promise<void> | void;
  onCancel: () => void;
};

export function CategoryForm({
  initialData,
  submitLabel = "保存",
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [color, setColor] = useState(initialData?.color ?? "#6B7280");
  const [sortOrder, setSortOrder] = useState(initialData?.sortOrder ?? 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ name, slug, color, sortOrder });
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
        <p className="mt-1 text-xs text-neutral-500">半角英小文字・数字・ハイフン（例: github）</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">色</label>
          <input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            type="color"
            disabled={isSubmitting}
            className="h-9 w-full cursor-pointer rounded-md border border-neutral-200 bg-white disabled:opacity-50"
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
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          キャンセル
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "保存中..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
