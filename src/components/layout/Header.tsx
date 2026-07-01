"use client";

import { UserMenu } from "@/components/layout/UserMenu";
import { SearchBar } from "@/components/search/SearchBar";
import type { Profile } from "@/types/database";

type HeaderProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  profile?: Profile | null;
};

export function Header({ searchQuery, onSearchChange, profile }: HeaderProps) {
  return (
    <header className="flex items-center gap-4 border-b border-neutral-200 bg-white px-6 py-4">
      <SearchBar value={searchQuery} onChange={onSearchChange} />
      {profile && <UserMenu profile={profile} />}
    </header>
  );
}
