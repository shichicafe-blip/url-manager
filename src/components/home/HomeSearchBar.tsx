"use client";

type HomeSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function HomeSearchBar({
  value,
  onChange,
  placeholder = "検索",
}: HomeSearchBarProps) {
  return (
    <div className="px-4 pb-2 pt-3">
      <div className="ios-search flex items-center gap-2 rounded-xl px-3 py-2.5">
        <span className="text-sm text-[#8e8e93]" aria-hidden>
          🔍
        </span>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label="検索"
          className="min-w-0 flex-1 bg-transparent text-base text-[#1c1c1e] outline-none placeholder:text-[#8e8e93]"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-sm text-[#007aff]"
            aria-label="検索をクリア"
          >
            取消
          </button>
        )}
      </div>
    </div>
  );
}
