"use client";

import { UserMenu } from "@/components/layout/UserMenu";
import { SearchBar } from "@/components/search/SearchBar";
import type { Profile } from "@/types/database";

type HeaderProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  profile?: Profile | null;
  onMenuOpen: () => void;
};

export function Header({ searchQuery, onSearchChange, profile, onMenuOpen }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white px-3 py-3 sm:px-6 sm:py-4">
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={onMenuOpen}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 md:hidden"
          aria-label="メニューを開く"
        >
          ☰
        </button>
        <SearchBar value={searchQuery} onChange={onSearchChange} />
        {profile && <UserMenu profile={profile} />}
      </div>
    </header>
  );
}
