"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

/**
 * The actual theme is applied before paint by the inline script in
 * `app/layout.tsx`, which writes data-theme onto <html>. This component only
 * mirrors that attribute so the icon matches what is on screen — it must not
 * decide the theme itself, or it would fight the pre-paint script and flash.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const applied = document.documentElement.getAttribute("data-theme");
    setTheme(applied === "light" ? "light" : "dark");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("phonehub_theme", next);
    } catch {
      // Private-mode / storage-disabled browsers: the toggle still works for
      // this page view, it just will not be remembered.
    }
    document.documentElement.setAttribute(
      "data-theme",
      next === "light" ? "light" : "phonehub"
    );
  };

  const isDark = theme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      onClick={toggle}
      className="icon-btn"
      aria-label={label}
      title={label}
      aria-pressed={!isDark}
    >
      {isDark ? (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}
