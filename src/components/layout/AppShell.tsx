"use client";

import { CategoryForm } from "@/components/categories/CategoryForm";
import { CategoryList } from "@/components/categories/CategoryList";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { UrlForm } from "@/components/urls/UrlForm";
import { UrlList } from "@/components/urls/UrlList";
import { UrlViewToggle } from "@/components/urls/UrlViewToggle";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/features/categories/actions";
import type { Category } from "@/features/categories/types";
import type { Tag } from "@/features/tags/types";
import { toggleFavorite } from "@/features/favorites/actions";
import {
  createUrl,
  deleteUrl,
  openUrl,
  updateUrl,
} from "@/features/urls/actions";
import type { UrlFilter, UrlFormData, UrlWithCategory } from "@/features/urls/types";
import { useSearch } from "@/hooks/useSearch";
import { useViewMode } from "@/hooks/useViewMode";
import type { Profile } from "@/types/database";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type AppShellProps = {
  initialCategories: Category[];
  initialUrls: UrlWithCategory[];
  initialTags: Tag[];
  profile: Profile | null;
  isAdmin: boolean;
  isSupabaseConfigured: boolean;
};

type CategoryModalView = "list" | "form";

export function AppShell({
  initialCategories,
  initialUrls,
  initialTags,
  profile,
  isAdmin,
  isSupabaseConfigured,
}: AppShellProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [urls, setUrls] = useState(initialUrls);
  const [tags, setTags] = useState(initialTags);
  const [activeFilter, setActiveFilter] = useState<UrlFilter>("all");
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [editingUrl, setEditingUrl] = useState<UrlWithCategory | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalView, setCategoryModalView] = useState<CategoryModalView>("list");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { viewMode, setViewMode } = useViewMode();

  useEffect(() => {
    setCategories(initialCategories);
    setUrls(initialUrls);
    setTags(initialTags);
  }, [initialCategories, initialUrls, initialTags]);

  const filteredByCategory = useMemo(() => {
    if (activeFilter === "all") return urls;
    if (activeFilter === "favorites") return urls.filter((url) => url.is_favorite);
    if (activeFilter === "recent") {
      return [...urls]
        .filter((url) => url.last_opened_at)
        .sort(
          (a, b) =>
            new Date(b.last_opened_at ?? 0).getTime() -
            new Date(a.last_opened_at ?? 0).getTime(),
        );
    }
    if (activeFilter.startsWith("tag:")) {
      const tagId = activeFilter.replace("tag:", "");
      return urls.filter((url) => url.tags.some((tag) => tag.id === tagId));
    }
    return urls.filter((url) => url.category_id === activeFilter);
  }, [activeFilter, urls]);

  const { query, setQuery, filteredUrls } = useSearch(filteredByCategory);

  const refresh = () => router.refresh();

  const handleOpenUrl = async (url: UrlWithCategory) => {
    window.open(url.url, "_blank", "noopener,noreferrer");

    const now = new Date().toISOString();
    setUrls((prev) =>
      prev.map((item) =>
        item.id === url.id
          ? {
              ...item,
              last_opened_at: now,
              click_count: item.click_count + 1,
            }
          : item,
      ),
    );

    const result = await openUrl(url.id);
    if (!result.ok) {
      setErrorMessage(result.error);
      refresh();
    }
  };

  const handleToggleFavorite = async (urlId: string) => {
    setUrls((prev) =>
      prev.map((item) =>
        item.id === urlId ? { ...item, is_favorite: !item.is_favorite } : item,
      ),
    );

    const result = await toggleFavorite(urlId);
    if (!result.ok) {
      setErrorMessage(result.error);
      refresh();
    }
  };

  const openCreateUrlModal = () => {
    setEditingUrl(null);
    setErrorMessage(null);
    setIsUrlModalOpen(true);
  };

  const openEditUrlModal = (url: UrlWithCategory) => {
    setEditingUrl(url);
    setErrorMessage(null);
    setIsUrlModalOpen(true);
  };

  const closeUrlModal = () => {
    setIsUrlModalOpen(false);
    setEditingUrl(null);
  };

  const handleUrlSubmit = async (data: UrlFormData) => {
    setErrorMessage(null);

    const result = editingUrl
      ? await updateUrl(editingUrl.id, data)
      : await createUrl(data);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    closeUrlModal();
    refresh();
  };

  const handleUrlDelete = async () => {
    if (!editingUrl) return;
    setErrorMessage(null);

    const result = await deleteUrl(editingUrl.id);
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    closeUrlModal();
    refresh();
  };

  const openCategoryModal = () => {
    setCategoryModalView("list");
    setEditingCategory(null);
    setErrorMessage(null);
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setCategoryModalView("list");
    setEditingCategory(null);
  };

  const openCategoryForm = (category: Category | null) => {
    setEditingCategory(category);
    setCategoryModalView("form");
    setErrorMessage(null);
  };

  const handleCategorySubmit = async (data: {
    name: string;
    slug: string;
    color: string;
    sortOrder: number;
  }) => {
    setErrorMessage(null);

    const result = editingCategory
      ? await updateCategory(editingCategory.id, data)
      : await createCategory(data);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    setCategoryModalView("list");
    setEditingCategory(null);
    refresh();
  };

  const handleCategoryDelete = async (categoryId: string) => {
    if (!confirm("このカテゴリーを削除しますか？")) return;
    setErrorMessage(null);

    const result = await deleteCategory(categoryId);
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    refresh();
  };

  return (
    <div className="flex h-screen bg-neutral-100">
      <Sidebar
        categories={categories}
        tags={tags}
        activeFilter={activeFilter}
        isAdmin={isAdmin}
        onFilterChange={setActiveFilter}
        onManageCategories={openCategoryModal}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header searchQuery={query} onSearchChange={setQuery} profile={profile} />

        <main className="flex-1 overflow-y-auto p-6">
          {!isSupabaseConfigured && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Supabase が未設定です。`.env.local` に接続情報を設定し、SQL マイグレーションを実行してください。
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errorMessage}
              <button
                type="button"
                className="ml-3 underline"
                onClick={() => setErrorMessage(null)}
              >
                閉じる
              </button>
            </div>
          )}

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">URL一覧</h2>
              <p className="text-sm text-neutral-500">{filteredUrls.length} 件</p>
            </div>
            <div className="flex items-center gap-3">
              <UrlViewToggle viewMode={viewMode} onChange={setViewMode} />
              <Button type="button" onClick={openCreateUrlModal} disabled={categories.length === 0}>
                + URL追加
              </Button>
            </div>
          </div>

          <UrlList
            urls={filteredUrls}
            viewMode={viewMode}
            onOpen={handleOpenUrl}
            onEdit={openEditUrlModal}
            onToggleFavorite={handleToggleFavorite}
          />
        </main>
      </div>

      <Modal
        open={isUrlModalOpen}
        onClose={closeUrlModal}
        title={editingUrl ? "URL編集" : "URL追加"}
      >
        {errorMessage && isUrlModalOpen && (
          <p className="mb-4 text-sm text-red-600">{errorMessage}</p>
        )}
        <UrlForm
          key={editingUrl?.id ?? "new"}
          categories={categories}
          tags={tags}
          initialData={
            editingUrl
              ? {
                  title: editingUrl.title,
                  url: editingUrl.url,
                  categoryId: editingUrl.category_id,
                  description: editingUrl.description ?? undefined,
                  tagIds: editingUrl.tags.map((tag) => tag.id),
                }
              : undefined
          }
          onSubmit={handleUrlSubmit}
          onDelete={editingUrl ? handleUrlDelete : undefined}
          onCancel={closeUrlModal}
        />
      </Modal>

      <Modal
        open={isCategoryModalOpen}
        onClose={closeCategoryModal}
        title={categoryModalView === "list" ? "カテゴリー管理" : editingCategory ? "カテゴリー編集" : "カテゴリー追加"}
        className="max-w-2xl"
      >
        {errorMessage && isCategoryModalOpen && (
          <p className="mb-4 text-sm text-red-600">{errorMessage}</p>
        )}

        {categoryModalView === "list" ? (
          <CategoryList
            categories={categories}
            onEdit={(category) => openCategoryForm(category)}
            onDelete={handleCategoryDelete}
            onAdd={() => openCategoryForm(null)}
          />
        ) : (
          <CategoryForm
            key={editingCategory?.id ?? "new"}
            initialData={
              editingCategory
                ? {
                    name: editingCategory.name,
                    slug: editingCategory.slug,
                    color: editingCategory.color,
                    sortOrder: editingCategory.sort_order,
                  }
                : { sortOrder: categories.length + 1 }
            }
            onSubmit={handleCategorySubmit}
            onCancel={() => {
              setCategoryModalView("list");
              setEditingCategory(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
