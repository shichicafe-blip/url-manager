"use client";

import { CategoryForm } from "@/components/categories/CategoryForm";
import {
  FolderHeader,
  HomeTopBar,
  ScreenWrapper,
  SectionTitle,
} from "@/components/home/HomeChrome";
import { HomeSearchBar } from "@/components/home/HomeSearchBar";
import { IconGrid } from "@/components/home/IconGrid";
import { Modal } from "@/components/ui/Modal";
import { UrlForm } from "@/components/urls/UrlForm";
import {
  createCategory,
  deleteCategory,
  reorderCategories,
  updateCategory,
} from "@/features/categories/actions";
import type { Category } from "@/features/categories/types";
import type { Tag } from "@/features/tags/types";
import { toggleFavorite } from "@/features/favorites/actions";
import {
  createUrl,
  deleteUrl,
  openUrl,
  reorderUrls,
  updateUrl,
} from "@/features/urls/actions";
import type { UrlFormData, UrlWithCategory } from "@/features/urls/types";
import {
  getChildCategories,
  getFavoriteUrls,
  getRecentUrls,
  getTopLevelCategories,
  getUrlsInCategory,
  searchAll,
} from "@/lib/categories/tree";
import { getUrlIconColor } from "@/lib/icons";
import { isGoogleSheetsUrl } from "@/lib/sheets/parse-url";
import type { Profile } from "@/types/database";
import { signOut } from "@/features/auth/actions";
import Link from "next/link";
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

type NavScreen = { type: "home" } | { type: "folder"; categoryId: string };

type ModalKind = "url" | "category" | null;

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
  const [tags] = useState(initialTags);
  const [navStack, setNavStack] = useState<NavScreen[]>([{ type: "home" }]);
  const [animation, setAnimation] = useState<"forward" | "back" | "none">("none");
  const [searchQuery, setSearchQuery] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [modalKind, setModalKind] = useState<ModalKind>(null);
  const [editingUrl, setEditingUrl] = useState<UrlWithCategory | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setCategories(initialCategories);
    setUrls(initialUrls);
  }, [initialCategories, initialUrls]);

  useEffect(() => {
    if (animation === "none") return;
    const timer = window.setTimeout(() => setAnimation("none"), 350);
    return () => window.clearTimeout(timer);
  }, [animation, navStack]);

  const currentScreen = navStack[navStack.length - 1];
  const currentCategory =
    currentScreen.type === "folder"
      ? categories.find((c) => c.id === currentScreen.categoryId)
      : null;

  const refresh = () => router.refresh();

  const pushFolder = (categoryId: string) => {
    setAnimation("forward");
    setNavStack((prev) => [...prev, { type: "folder", categoryId }]);
  };

  const popFolder = () => {
    if (navStack.length <= 1) return;
    setAnimation("back");
    setNavStack((prev) => prev.slice(0, -1));
  };

  const handleOpenUrl = async (url: UrlWithCategory) => {
    if (isGoogleSheetsUrl(url.url)) {
      router.push(`/sheet/${url.id}`);
      return;
    }

    window.open(url.url, "_blank", "noopener,noreferrer");
    const now = new Date().toISOString();
    setUrls((prev) =>
      prev.map((item) =>
        item.id === url.id
          ? { ...item, last_opened_at: now, click_count: item.click_count + 1 }
          : item,
      ),
    );
    const result = await openUrl(url.id);
    if (!result.ok) {
      setErrorMessage(result.error);
      refresh();
    }
  };

  const favorites = useMemo(() => getFavoriteUrls(urls), [urls]);
  const recent = useMemo(() => getRecentUrls(urls), [urls]);
  const topCategories = useMemo(() => getTopLevelCategories(categories), [categories]);
  const searchResults = useMemo(
    () => searchAll(searchQuery, categories, urls),
    [searchQuery, categories, urls],
  );

  const folderChildren = useMemo(() => {
    if (!currentCategory) return [];
    return getChildCategories(categories, currentCategory.id);
  }, [categories, currentCategory]);

  const folderUrls = useMemo(() => {
    if (!currentCategory) return [];
    return getUrlsInCategory(urls, currentCategory.id);
  }, [urls, currentCategory]);

  const showFolderAsCategories =
    currentCategory && (folderChildren.length > 0 || folderUrls.length === 0);

  const openUrlModal = (url?: UrlWithCategory, defaultCategoryId?: string) => {
    setEditingUrl(url ?? null);
    setDefaultCategoryId(defaultCategoryId);
    setModalKind("url");
    setErrorMessage(null);
  };

  const [defaultCategoryId, setDefaultCategoryId] = useState<string | undefined>();

  const openCategoryModal = (category?: Category | null, parentId?: string | null) => {
    setEditingCategory(category ?? null);
    setDefaultParentId(parentId);
    setModalKind("category");
    setErrorMessage(null);
  };

  const [defaultParentId, setDefaultParentId] = useState<string | null | undefined>();

  const closeModal = () => {
    setModalKind(null);
    setEditingUrl(null);
    setEditingCategory(null);
    setDefaultCategoryId(undefined);
    setDefaultParentId(undefined);
  };

  const handleUrlSubmit = async (data: UrlFormData) => {
    setErrorMessage(null);
    const result = editingUrl ? await updateUrl(editingUrl.id, data) : await createUrl(data);
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    closeModal();
    refresh();
  };

  const handleUrlDelete = async () => {
    if (!editingUrl) return;
    const result = await deleteUrl(editingUrl.id);
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    closeModal();
    refresh();
  };

  const handleCategorySubmit = async (data: {
    name: string;
    slug: string;
    color: string;
    sortOrder: number;
    parentId?: string | null;
    iconUrl?: string | null;
  }) => {
    setErrorMessage(null);
    const result = editingCategory
      ? await updateCategory(editingCategory.id, data)
      : await createCategory(data);
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    closeModal();
    refresh();
  };

  const handleCategoryDelete = async () => {
    if (!editingCategory || !confirm("このカテゴリーを削除しますか？")) return;
    const result = await deleteCategory(editingCategory.id);
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }
    closeModal();
    refresh();
  };

  const handleCategoryClick = (categoryId: string) => {
    if (editMode && isAdmin) {
      const cat = categories.find((c) => c.id === categoryId);
      if (cat) openCategoryModal(cat);
      return;
    }
    pushFolder(categoryId);
  };

  const handleUrlClick = (urlId: string) => {
    const url = urls.find((u) => u.id === urlId);
    if (!url) return;
    if (editMode && isAdmin) {
      openUrlModal(url);
      return;
    }
    void handleOpenUrl(url);
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

  const reorderCategoryItems = async (fromId: string, toId: string, parentId: string | null) => {
    const siblings = parentId
      ? getChildCategories(categories, parentId)
      : getTopLevelCategories(categories);
    const ids = siblings.map((c) => c.id);
    const fromIndex = ids.indexOf(fromId);
    const toIndex = ids.indexOf(toId);
    if (fromIndex < 0 || toIndex < 0) return;
    ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, fromId);
    const result = await reorderCategories(ids);
    if (!result.ok) setErrorMessage(result.error);
    else refresh();
  };

  const reorderUrlItems = async (fromId: string, toId: string, categoryId: string) => {
    const items = getUrlsInCategory(urls, categoryId);
    const ids = items.map((u) => u.id);
    const fromIndex = ids.indexOf(fromId);
    const toIndex = ids.indexOf(toId);
    if (fromIndex < 0 || toIndex < 0) return;
    ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, fromId);
    const result = await reorderUrls(ids);
    if (!result.ok) setErrorMessage(result.error);
    else refresh();
  };

  const urlToIcon = (url: UrlWithCategory) => ({
    id: url.id,
    title: url.title,
    iconUrl: url.icon_url,
    color: getUrlIconColor(url.url, url.category.color),
  });

  const categoryToIcon = (cat: Category) => ({
    id: cat.id,
    title: cat.name,
    iconUrl: cat.icon_url,
    color: cat.color,
  });

  const adminActions = isAdmin ? (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setEditMode((v) => !v)}
        className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
          editMode
            ? "bg-[#007aff] text-white"
            : "bg-white/70 text-[#007aff] backdrop-blur"
        }`}
      >
        {editMode ? "完了" : "編集"}
      </button>
      <Link
        href="/admin"
        className="rounded-full bg-white/70 px-3 py-1.5 text-[13px] font-medium text-[#007aff] backdrop-blur"
      >
        管理
      </Link>
    </div>
  ) : profile ? (
    <button
      type="button"
      onClick={() => signOut()}
      className="rounded-full bg-white/70 px-3 py-1.5 text-[13px] font-medium text-[#007aff] backdrop-blur"
    >
      退出
    </button>
  ) : null;

  const renderHome = () => (
    <ScreenWrapper animation={animation}>
      <HomeTopBar rightAction={adminActions} />
      <HomeSearchBar value={searchQuery} onChange={setSearchQuery} />

      {searchQuery.trim() ? (
        <>
          {searchResults.urls.length > 0 && (
            <>
              <SectionTitle>アプリ</SectionTitle>
              <IconGrid
                items={searchResults.urls.map(urlToIcon)}
                onItemClick={handleUrlClick}
                editMode={editMode}
              />
            </>
          )}
          {searchResults.categories.length > 0 && (
            <>
              <SectionTitle>フォルダ</SectionTitle>
              <IconGrid
                items={searchResults.categories.map(categoryToIcon)}
                onItemClick={handleCategoryClick}
                editMode={editMode}
                onReorder={
                  editMode
                    ? (from, to) => reorderCategoryItems(from, to, null)
                    : undefined
                }
              />
            </>
          )}
          {searchResults.urls.length === 0 && searchResults.categories.length === 0 && (
            <p className="px-4 py-8 text-center text-[15px] text-[#8e8e93]">
              見つかりませんでした
            </p>
          )}
        </>
      ) : (
        <>
          {favorites.length > 0 && (
            <>
              <SectionTitle>お気に入り</SectionTitle>
              <IconGrid
                items={favorites.map(urlToIcon)}
                onItemClick={handleUrlClick}
                editMode={editMode}
              />
            </>
          )}

          {recent.length > 0 && (
            <>
              <SectionTitle>最近開いた</SectionTitle>
              <IconGrid
                items={recent.map(urlToIcon)}
                onItemClick={handleUrlClick}
                editMode={editMode}
              />
            </>
          )}

          <SectionTitle>カテゴリー</SectionTitle>
          <IconGrid
            items={topCategories.map(categoryToIcon)}
            onItemClick={handleCategoryClick}
            editMode={editMode}
            onReorder={
              editMode ? (from, to) => reorderCategoryItems(from, to, null) : undefined
            }
          />

          {editMode && isAdmin && (
            <div className="px-4 py-4">
              <button
                type="button"
                onClick={() => openCategoryModal(null, null)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#c7c7cc] py-4 text-[15px] text-[#007aff]"
              >
                + カテゴリーを追加
              </button>
            </div>
          )}
        </>
      )}
    </ScreenWrapper>
  );

  const renderFolder = () => {
    if (!currentCategory) return null;

    const gridItems = showFolderAsCategories
      ? folderChildren.map(categoryToIcon)
      : folderUrls.map(urlToIcon);

    return (
      <ScreenWrapper animation={animation}>
        <FolderHeader
          title={currentCategory.name}
          onBack={popFolder}
          rightAction={adminActions}
        />

        {gridItems.length > 0 ? (
          <IconGrid
            items={gridItems}
            onItemClick={
              showFolderAsCategories ? handleCategoryClick : handleUrlClick
            }
            editMode={editMode}
            onReorder={
              editMode
                ? showFolderAsCategories
                  ? (from, to) =>
                      reorderCategoryItems(from, to, currentCategory.id)
                  : (from, to) => reorderUrlItems(from, to, currentCategory.id)
                : undefined
            }
          />
        ) : (
          <p className="px-4 py-12 text-center text-[15px] text-[#8e8e93]">
            {showFolderAsCategories
              ? "サブカテゴリーがありません"
              : "アプリがありません"}
          </p>
        )}

        {editMode && isAdmin && (
          <div className="space-y-3 px-4 py-4 pb-safe">
            {showFolderAsCategories && (
              <button
                type="button"
                onClick={() => openCategoryModal(null, currentCategory.id)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#c7c7cc] py-4 text-[15px] text-[#007aff]"
              >
                + サブカテゴリーを追加
              </button>
            )}
            {!showFolderAsCategories && (
              <button
                type="button"
                onClick={() => openUrlModal(undefined, currentCategory.id)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#c7c7cc] py-4 text-[15px] text-[#007aff]"
              >
                + アプリを追加
              </button>
            )}
          </div>
        )}
      </ScreenWrapper>
    );
  };

  return (
    <div className="ios-wallpaper mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <main className="flex-1 overflow-y-auto pb-safe">
        {!isSupabaseConfigured && (
          <div className="mx-4 mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Supabase が未設定です
          </div>
        )}

        {errorMessage && (
          <div className="mx-4 mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
            <button type="button" className="ml-2 underline" onClick={() => setErrorMessage(null)}>
              閉じる
            </button>
          </div>
        )}

        {currentScreen.type === "home" ? renderHome() : renderFolder()}
      </main>

      <Modal
        open={modalKind === "url"}
        onClose={closeModal}
        title={editingUrl ? "アプリを編集" : "アプリを追加"}
      >
        <UrlForm
          key={editingUrl?.id ?? `new-${defaultCategoryId}`}
          categories={categories}
          tags={tags}
          initialData={
            editingUrl
              ? {
                  title: editingUrl.title,
                  url: editingUrl.url,
                  categoryId: editingUrl.category_id,
                  description: editingUrl.description ?? undefined,
                  iconUrl: editingUrl.icon_url,
                  tagIds: editingUrl.tags.map((tag) => tag.id),
                }
              : defaultCategoryId
                ? { categoryId: defaultCategoryId }
                : undefined
          }
          onSubmit={handleUrlSubmit}
          onDelete={editingUrl ? handleUrlDelete : undefined}
          onCancel={closeModal}
          onToggleFavorite={
            editingUrl ? () => handleToggleFavorite(editingUrl.id) : undefined
          }
          isFavorite={editingUrl?.is_favorite}
        />
      </Modal>

      <Modal
        open={modalKind === "category"}
        onClose={closeModal}
        title={editingCategory ? "フォルダを編集" : "フォルダを追加"}
      >
        <CategoryForm
          key={editingCategory?.id ?? `new-${defaultParentId}`}
          categories={categories}
          initialData={
            editingCategory
              ? {
                  name: editingCategory.name,
                  slug: editingCategory.slug,
                  color: editingCategory.color,
                  sortOrder: editingCategory.sort_order,
                  parentId: editingCategory.parent_id,
                  iconUrl: editingCategory.icon_url,
                }
              : {
                  sortOrder:
                    (defaultParentId
                      ? getChildCategories(categories, defaultParentId)
                      : topCategories
                    ).length + 1,
                  parentId: defaultParentId ?? null,
                }
          }
          onSubmit={handleCategorySubmit}
          onDelete={editingCategory ? handleCategoryDelete : undefined}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
}
