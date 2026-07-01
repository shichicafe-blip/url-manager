import type { UrlWithCategory } from "@/features/urls/types";
import { getHostname } from "@/lib/utils/url";

type UrlCardProps = {
  url: UrlWithCategory;
  onOpen: (url: UrlWithCategory) => void;
  onEdit: (url: UrlWithCategory) => void;
  onToggleFavorite: (urlId: string) => void;
};

export function UrlCard({ url, onOpen, onEdit, onToggleFavorite }: UrlCardProps) {
  return (
    <article className="rounded-lg border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onOpen(url)}
            className="text-left text-sm font-semibold text-neutral-900 hover:underline"
          >
            {url.title}
          </button>
          <p className="mt-1 truncate text-xs text-neutral-500">{getHostname(url.url)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={url.is_favorite ? "お気に入り解除" : "お気に入り登録"}
            onClick={() => onToggleFavorite(url.id)}
            className={url.is_favorite ? "text-amber-500" : "text-neutral-300 hover:text-amber-400"}
          >
            ★
          </button>
          <button
            type="button"
            aria-label="編集"
            onClick={() => onEdit(url)}
            className="rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
          >
            編集
          </button>
        </div>
      </div>

      {url.description && (
        <p className="mt-3 line-clamp-2 text-sm text-neutral-600">{url.description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-neutral-600"
          style={{ backgroundColor: `${url.category.color}20` }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: url.category.color }} />
          {url.category.name}
        </span>
        {url.tags.map((tag) => (
          <span
            key={tag.id}
            className="rounded-full px-2 py-0.5 text-xs text-white"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
          </span>
        ))}
        {url.last_opened_at && (
          <span className="text-xs text-neutral-400">
            最終: {new Date(url.last_opened_at).toLocaleDateString("ja-JP")}
          </span>
        )}
        {url.click_count > 0 && (
          <span className="text-xs text-neutral-400">{url.click_count} 回</span>
        )}
      </div>
    </article>
  );
}
