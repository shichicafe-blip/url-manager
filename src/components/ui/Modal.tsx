"use client";

import { cn } from "@/lib/utils/cn";
import { useEffect, type ReactNode } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
};

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="閉じる"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "relative z-10 flex max-h-[92dvh] w-full flex-col border border-neutral-200 bg-white shadow-xl",
          "rounded-t-2xl sm:max-w-lg sm:rounded-lg",
          className,
        )}
      >
        <div className="shrink-0 border-b border-neutral-100 px-4 py-4 sm:px-5">
          <h2 id="modal-title" className="text-base font-semibold text-neutral-900">
            {title}
          </h2>
        </div>
        <div className="overflow-y-auto px-4 py-4 pb-safe sm:px-5">{children}</div>
      </div>
    </div>
  );
}
