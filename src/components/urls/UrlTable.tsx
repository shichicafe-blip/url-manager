import type { UrlWithCategory } from "@/features/urls/types";
import { getHostname } from "@/lib/utils/url";

type UrlTableProps = {
  urls: UrlWithCategory[];
  onOpen: (url: UrlWithCategory) => void;
  onEdit: (url: UrlWithCategory) => void;
  onToggleFavorite: (urlId: string) => void;
};

export function UrlTable({ urls, onOpen, onEdit, onToggleFavorite }: UrlTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="min-w-full divide-y divide-neutral-200 text-sm">
        <thead className="bg-neutral-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-neutral-500">★</th>
            <th className="px-4 py-3 text-left font-medium text-neutral-500">タイトル</th>
            <th className="px-4 py-3 text-left font-medium text-neutral-500">URL</th>
            <th className="px-4 py-3 text-left font-medium text-neutral-500">カテゴリー</th>
            <th className="px-4 py-3 text-left font-medium text-neutral-500">説明</th>
            <th className="px-4 py-3 text-left font-medium text-neutral-500">最終閲覧</th>
            <th className="px-4 py-3 text-left font-medium text-neutral-500" />
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {urls.map((url) => (
            <tr key={url.id} className="hover:bg-neutral-50">
              <td className="px-4 py-3">
                <button
                  type="button"
                  aria-label={url.is_favorite ? "お気に入り解除" : "お気に入り登録"}
                  onClick={() => onToggleFavorite(url.id)}
                  className={url.is_favorite ? "text-amber-500" : "text-neutral-300 hover:text-amber-400"}
                >
                  ★
                </button>
              </td>
              <td className="px-4 py-3 font-medium text-neutral-900">
                <button type="button" onClick={() => onOpen(url)} className="hover:underline">
                  {url.title}
                </button>
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-neutral-500">{getHostname(url.url)}</td>
              <td className="px-4 py-3 text-neutral-600">{url.category.name}</td>
              <td className="max-w-sm truncate px-4 py-3 text-neutral-500">{url.description ?? "—"}</td>
              <td className="px-4 py-3 text-neutral-500">
                {url.last_opened_at
                  ? new Date(url.last_opened_at).toLocaleDateString("ja-JP")
                  : "—"}
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onEdit(url)}
                  className="text-neutral-500 hover:text-neutral-900"
                >
                  編集
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
