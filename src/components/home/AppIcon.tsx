"use client";

import { cn } from "@/lib/utils/cn";
import { getInitial } from "@/lib/icons";

type AppIconProps = {
  title: string;
  iconUrl?: string | null;
  color?: string;
  onClick: () => void;
  editMode?: boolean;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragOver?: (event: React.DragEvent) => void;
  onDrop?: () => void;
  isDragging?: boolean;
  badge?: string;
};

export function AppIcon({
  title,
  iconUrl,
  color = "#8E8E93",
  onClick,
  editMode = false,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging = false,
  badge,
}: AppIconProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 px-1",
        isDragging && "opacity-40",
      )}
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) return;
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onDragOver={(e) => {
        if (!draggable) return;
        e.preventDefault();
        onDragOver?.(e);
      }}
      onDrop={(e) => {
        if (!draggable) return;
        e.preventDefault();
        onDrop?.();
      }}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "relative flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-[14px] ios-icon-shadow transition-transform active:scale-90",
          editMode && "animate-wiggle",
        )}
        style={{ backgroundColor: iconUrl ? "#fff" : color }}
        aria-label={title}
      >
        {iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={iconUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-[26px] font-semibold text-white drop-shadow-sm">
            {getInitial(title)}
          </span>
        )}
        {badge && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
      </button>
      <span className="w-full truncate text-center text-[11px] leading-tight text-[#1c1c1e]">
        {title}
      </span>
    </div>
  );
}
