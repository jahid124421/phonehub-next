"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("phonehub_theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      // "phonehub" is the dark daisyUI theme name; "dark" matches no theme
      document.documentElement.setAttribute("data-theme", stored === "light" ? "light" : "phonehub");
    }
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("phonehub_theme", next);
    document.documentElement.setAttribute("data-theme", next === "light" ? "light" : "phonehub");
  };

  return (
    <>
      <style>{`
        .theme-toggle-btn:hover {
          border-color: var(--primary) !important;
          transform: translateY(-1px) !important;
        }
      `}</style>
      <button
        onClick={toggle}
        className="theme-toggle-btn"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          color: "var(--text)",
          width: 40,
          height: 40,
          borderRadius: 10,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
          transition: "0.15s",
          fontSize: 18,
        }}
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>
    </>
  );
}
