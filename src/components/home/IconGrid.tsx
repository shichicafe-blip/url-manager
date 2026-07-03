"use client";

import { AppIcon } from "@/components/home/AppIcon";
import { cn } from "@/lib/utils/cn";

type IconGridItem = {
  id: string;
  title: string;
  iconUrl?: string | null;
  color?: string;
  badge?: string;
};

type IconGridProps = {
  items: IconGridItem[];
  onItemClick: (id: string) => void;
  editMode?: boolean;
  onReorder?: (fromId: string, toId: string) => void;
  className?: string;
};

export function IconGrid({
  items,
  onItemClick,
  editMode = false,
  onReorder,
  className,
}: IconGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-4 gap-x-1 gap-y-5 px-4",
        className,
      )}
    >
      {items.map((item) => (
        <AppIcon
          key={item.id}
          title={item.title}
          iconUrl={item.iconUrl}
          color={item.color}
          badge={item.badge}
          editMode={editMode}
          draggable={editMode && Boolean(onReorder)}
          onClick={() => onItemClick(item.id)}
          onDragStart={() => {
            if (typeof window !== "undefined") {
              window.sessionStorage.setItem("drag-item-id", item.id);
            }
          }}
          onDrop={() => {
            const fromId = window.sessionStorage.getItem("drag-item-id");
            if (fromId && fromId !== item.id) {
              onReorder?.(fromId, item.id);
            }
            window.sessionStorage.removeItem("drag-item-id");
          }}
        />
      ))}
    </div>
  );
}
