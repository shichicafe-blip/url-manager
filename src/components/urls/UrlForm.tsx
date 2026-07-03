"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Category } from "@/features/categories/types";
import type { Tag } from "@/features/tags/types";
import type { UrlFormData } from "@/features/urls/types";
import { cn } from "@/lib/utils/cn";
import { useState } from "react";

type UrlFormProps = {
  categories: Category[];
  tags: Tag[];
  initialData?: UrlFormData;
  submitLabel?: string;
  onSubmit: (data: UrlFormData) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  onCancel: () => void;
};

export function UrlForm({
  categories,
  tags,
  initialData,
  submitLabel = "保存",
  onSubmit,
  onDelete,
  onCancel,
}: UrlFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [url, setUrl] = useState(initialData?.url ?? "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? categories[0]?.id ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialData?.tagIds ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        url,
        categoryId,
        description,
        tagIds: selectedTagIds,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !confirm("この URL を削除しますか？")) return;
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
        <label className="mb-1 block text-sm font-medium text-neutral-700">タイトル</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isSubmitting} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">URL</label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          type="url"
          required
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">カテゴリー</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="h-11 w-full rounded-md border border-neutral-200 bg-white px-3 text-base outline-none focus:border-neutral-400 disabled:opacity-50 sm:h-9 sm:text-sm"
          required
          disabled={isSubmitting || categories.length === 0}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      {tags.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700">タグ</label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                disabled={isSubmitting}
                onClick={() => toggleTag(tag.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  selectedTagIds.includes(tag.id)
                    ? "text-white"
                    : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
                )}
                style={
                  selectedTagIds.includes(tag.id)
                    ? { backgroundColor: tag.color }
                    : undefined
                }
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">説明</label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
        />
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
          <Button type="submit" disabled={isSubmitting || categories.length === 0}>
            {isSubmitting ? "保存中..." : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
