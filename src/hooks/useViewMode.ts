"use client";

import { useEffect, useState } from "react";

export type ViewMode = "card" | "table";

const STORAGE_KEY = "url-manager:view-mode";

export function useViewMode(defaultMode: ViewMode = "card") {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultMode);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "card" || stored === "table") {
      setViewMode(stored);
    }
  }, []);

  const updateViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  return { viewMode, setViewMode: updateViewMode };
}
