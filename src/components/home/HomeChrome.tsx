"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type SectionTitleProps = {
  children: ReactNode;
};

export function SectionTitle({ children }: SectionTitleProps) {
  return (
    <h2 className="px-4 pb-2 pt-4 text-[13px] font-semibold uppercase tracking-wide text-[#8e8e93]">
      {children}
    </h2>
  );
}

type FolderHeaderProps = {
  title: string;
  onBack: () => void;
  rightAction?: ReactNode;
};

export function FolderHeader({ title, onBack, rightAction }: FolderHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 bg-[#f2f2f7]/90 px-2 py-2 pt-safe backdrop-blur-md">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-0.5 rounded-lg px-2 py-2 text-[17px] text-[#007aff] active:opacity-60"
        aria-label="戻る"
      >
        <span className="text-xl leading-none">‹</span>
        <span>戻る</span>
      </button>
      <h1 className="flex-1 truncate text-center text-[17px] font-semibold text-[#1c1c1e]">
        {title}
      </h1>
      <div className="w-[72px] flex justify-end">{rightAction}</div>
    </header>
  );
}

type HomeTopBarProps = {
  rightAction?: ReactNode;
};

export function HomeTopBar({ rightAction }: HomeTopBarProps) {
  return (
    <header className="flex items-center justify-between px-4 pb-1 pt-safe">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-[#8e8e93]">
          REPLUSWORKS
        </p>
        <h1 className="text-[28px] font-bold tracking-tight text-[#1c1c1e]">ホーム</h1>
      </div>
      {rightAction}
    </header>
  );
}

type ScreenWrapperProps = {
  children: ReactNode;
  animation: "forward" | "back" | "none";
  className?: string;
};

export function ScreenWrapper({ children, animation, className }: ScreenWrapperProps) {
  return (
    <div
      className={cn(
        "min-h-full",
        animation === "forward" && "animate-slide-in-right",
        animation === "back" && "animate-slide-in-left",
        className,
      )}
    >
      {children}
    </div>
  );
}
