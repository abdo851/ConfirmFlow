"use client";

import { useEffect } from "react";

export type ThemeChoice = "light" | "dark" | "system";

export const themeStorageKey = "confirma-theme";

export function readThemeChoice(): ThemeChoice {
  try {
    const stored = window.localStorage.getItem(themeStorageKey);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    return "system";
  }
  return "system";
}

export function applyTheme(choice: ThemeChoice) {
  const dark =
    choice === "dark" ||
    (choice === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.dataset.theme = choice;
  try {
    window.localStorage.setItem(themeStorageKey, choice);
  } catch {
    // Preference still applies for this page view.
  }
  document.cookie = `${themeStorageKey}=${choice}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function ThemeWatcher() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function sync() {
      if (readThemeChoice() === "system") {
        applyTheme("system");
      }
    }
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return null;
}
