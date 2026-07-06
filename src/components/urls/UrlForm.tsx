"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Category } from "@/features/categories/types";
import type { Tag } from "@/features/tags/types";
import type { UrlFormData } from "@/features/urls/types";
import {
  categoryHasChildren,
  getChildCategories,
  getLeafCategories,
  getTopLevelCategories,
} from "@/lib/categories/tree";
import { cn } from "@/lib/utils/cn";
import { useMemo, useState } from "react";

type UrlFormProps = {
  categories: Category[];
  tags: Tag[];
  initialData?: Partial<UrlFormData>;
  submitLabel?: string;
  onSubmit: (data: UrlFormData) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  onCancel: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
};

export function UrlForm({
  categories,
  tags,
  initialData,
  submitLabel = "保存",
  onSubmit,
  onDelete,
  onCancel,
  onToggleFavorite,
  isFavorite,
}: UrlFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [url, setUrl] = useState(initialData?.url ?? "");
  const [iconUrl, setIconUrl] = useState(initialData?.iconUrl ?? "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "");
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialData?.tagIds ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const topLevel = getTopLevelCategories(categories);
  const leafCategories = getLeafCategories(categories);

  const initialParent = useMemo(() => {
    if (!initialData?.categoryId) return "";
    const cat = categories.find((c) => c.id === initialData.categoryId);
    return cat?.parent_id ?? "";
  }, [categories, initialData?.categoryId]);

  const [resolvedParent, setResolvedParent] = useState(initialParent);

  const subcategories = resolvedParent
    ? getChildCategories(categories, resolvedParent)
    : [];

  const selectableCategories = useMemo(() => {
    if (resolvedParent && subcategories.length > 0) return subcategories;
    return leafCategories;
  }, [resolvedParent, subcategories, leafCategories]);

  const showParentPicker = topLevel.some((c) => categoryHasChildren(categories, c.id));

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  const handleParentChange = (value: string) => {
    setResolvedParent(value);
    setParentCategoryId(value);
    const children = value ? getChildCategories(categories, value) : [];
    if (children.length > 0) {
      setCategoryId(children[0].id);
    } else if (value) {
      setCategoryId(value);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        url,
        categoryId: categoryId || selectableCategories[0]?.id || categories[0]?.id || "",
        description,
        iconUrl: iconUrl.trim() || null,
        tagIds: selectedTagIds,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !confirm("このアプリを削除しますか？")) return;
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
          placeholder="https://docs.google.com/spreadsheets/d/..."
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">アイコン画像 URL</label>
        <Input
          value={iconUrl}
          onChange={(e) => setIconUrl(e.target.value)}
          placeholder="https://..."
          disabled={isSubmitting}
        />
      </div>
      {showParentPicker && (
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">カテゴリー</label>
          <select
            value={resolvedParent || parentCategoryId}
            onChange={(e) => handleParentChange(e.target.value)}
            className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-base outline-none focus:border-neutral-400"
            disabled={isSubmitting}
          >
            <option value="">選択してください</option>
            {topLevel.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {subcategories.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">サブカテゴリー</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-base outline-none focus:border-neutral-400"
            required
            disabled={isSubmitting}
          >
            {subcategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {!showParentPicker && (
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">カテゴリー</label>
          <select
            value={categoryId || leafCategories[0]?.id}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-base outline-none focus:border-neutral-400"
            required
            disabled={isSubmitting || leafCategories.length === 0}
          >
            {leafCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}
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
                    : "border border-neutral-200 bg-white text-neutral-600",
                )}
                style={
                  selectedTagIds.includes(tag.id) ? { backgroundColor: tag.color } : undefined
                }
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {onToggleFavorite && (
        <button
          type="button"
          onClick={onToggleFavorite}
          className="flex items-center gap-2 text-sm text-neutral-700"
        >
          <span className={isFavorite ? "text-amber-500" : "text-neutral-300"}>★</span>
          {isFavorite ? "お気に入り済み" : "お気に入りに追加"}
        </button>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">メモ</label>
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
