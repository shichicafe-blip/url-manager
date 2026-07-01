"use client";

import { Button } from "@/components/ui/Button";
import type { Category } from "@/features/categories/types";

type CategoryListProps = {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
  onAdd: () => void;
};

export function CategoryList({ categories, onEdit, onDelete, onAdd }: CategoryListProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={onAdd}>
          + カテゴリー追加
        </Button>
      </div>
      <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
        {categories.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-neutral-500">
            カテゴリーがありません
          </li>
        ) : (
          categories.map((category) => (
            <li key={category.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                <div>
                  <p className="text-sm font-medium text-neutral-900">{category.name}</p>
                  <p className="text-xs text-neutral-500">{category.slug}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(category)}>
                  編集
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(category.id)}>
                  削除
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
