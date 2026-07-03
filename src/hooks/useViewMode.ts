"use client";

import { useEffect, useState } from "react";

export type ViewMode = "card" | "table";

const STORAGE_KEY = "url-manager:view-mode";

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 639px)").matches;
}

export function useViewMode(defaultMode: ViewMode = "card") {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultMode);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "card" || stored === "table") {
      setViewMode(isMobileViewport() ? "card" : stored);
      return;
    }
    setViewMode(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const handleChange = () => {
      if (media.matches) setViewMode("card");
    };
    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const updateViewMode = (mode: ViewMode) => {
    if (isMobileViewport()) {
      setViewMode("card");
      localStorage.setItem(STORAGE_KEY, "card");
      return;
    }
    setViewMode(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  return { viewMode, setViewMode: updateViewMode };
}
