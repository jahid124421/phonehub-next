"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface PaletteResult {
  id: string;
  brand: string;
  name: string;
  category: string;
  image: string | null;
  basePrice: number;
}

const QUICK_LINKS = [
  { label: "Advanced Finder", href: "/advanced-finder", hint: "Filter by 40+ specs" },
  { label: "Compare phones", href: "/compare", hint: "Side-by-side, up to 4" },
  { label: "AI Finder", href: "/ai-finder", hint: "Describe what you need" },
  { label: "Latest news", href: "/news", hint: "Daily tech headlines" },
  { label: "Deals", href: "/deals", hint: "Price drops & value picks" },
  { label: "Upcoming launches", href: "/upcoming", hint: "Rumors & launch calendar" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PaletteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const router = useRouter();

  const showQuickLinks = query.trim().length === 0;
  const itemCount = showQuickLinks ? QUICK_LINKS.length : results.length;

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActiveIndex(0);
    // Restore focus to whatever had it before the palette opened (a11y)
    previouslyFocusedRef.current?.focus();
    previouslyFocusedRef.current = null;
  }, []);

  // Global keyboard listener: Ctrl+K / Cmd+K toggles, "/" opens when not typing
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if (
        e.key === "/" &&
        !open &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target as HTMLElement)?.isContentEditable
      ) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape" && open) {
        close();
      }
    };
    const onOpenEvent = () => setOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("phonehub:open-palette", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("phonehub:open-palette", onOpenEvent);
    };
  }, [open, close]);

  // Focus input when opened; remember the previously focused element
  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Focus trap: keep Tab/Shift+Tab cycling inside the dialog (a11y)
  const onDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const container = dialogRef.current;
    if (!container) return;
    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(
        'input, button, [href], [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute("disabled"));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !container.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !container.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  };

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      setActiveIndex(0);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&limit=8`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("search failed");
        const data = await res.json();
        setResults(data.results ?? []);
        setActiveIndex(0);
      } catch {
        /* aborted or failed — keep old results */
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const go = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router]
  );

  const activate = useCallback(
    (index: number) => {
      if (showQuickLinks) {
        const link = QUICK_LINKS[index];
        if (link) go(link.href);
      } else {
        const item = results[index];
        if (item) go(`/phone/${encodeURIComponent(item.id)}`);
      }
    },
    [showQuickLinks, results, go]
  );

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, itemCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (itemCount > 0) {
        activate(activeIndex);
      } else if (query.trim()) {
        go(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  // Keep active item scrolled into view
  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onKeyDown={onDialogKeyDown}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={close}
      />
      <div className="relative w-full max-w-xl rounded-2xl border border-base-content/10 bg-base-100 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b border-base-content/10">
          <svg
            className="w-4 h-4 shrink-0 opacity-60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search phones, brands, or jump to a page…"
            className="w-full h-14 bg-transparent outline-none text-base"
            aria-label="Search"
            aria-activedescendant={`palette-item-${activeIndex}`}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
          />
          <kbd className="kbd kbd-sm shrink-0 opacity-60">esc</kbd>
        </div>

        <ul
          id="palette-list"
          ref={listRef}
          role="listbox"
          className="max-h-[50vh] overflow-y-auto py-2"
        >
          {showQuickLinks &&
            QUICK_LINKS.map((link, i) => (
              <li key={link.href} id={`palette-item-${i}`} role="option" aria-selected={i === activeIndex}>
                <button
                  type="button"
                  onClick={() => go(link.href)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left ${
                    i === activeIndex ? "bg-primary/10" : ""
                  }`}
                >
                  <span className="font-medium">{link.label}</span>
                  <span className="text-sm opacity-50">{link.hint}</span>
                </button>
              </li>
            ))}

          {!showQuickLinks && loading && results.length === 0 && (
            <li className="px-4 py-6 text-center opacity-60">Searching…</li>
          )}

          {!showQuickLinks &&
            !loading &&
            results.length === 0 && (
              <li className="px-4 py-6 text-center opacity-60">
                No matches — press Enter for full search
              </li>
            )}

          {!showQuickLinks &&
            results.map((r, i) => (
              <li key={r.id} id={`palette-item-${i}`} role="option" aria-selected={i === activeIndex}>
                <button
                  type="button"
                  onClick={() => go(`/phone/${encodeURIComponent(r.id)}`)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${
                    i === activeIndex ? "bg-primary/10" : ""
                  }`}
                >
                  {r.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.image}
                      alt=""
                      className="w-8 h-10 object-contain shrink-0"
                      loading="lazy"
                    />
                  )}
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium truncate">
                      {r.brand} {r.name}
                    </span>
                    <span className="block text-sm opacity-50 capitalize">
                      {r.category}
                    </span>
                  </span>
                  {r.basePrice > 0 && (
                    <span className="text-sm font-semibold opacity-70">
                      ${r.basePrice}
                    </span>
                  )}
                </button>
              </li>
            ))}
        </ul>

        <div className="flex items-center gap-4 px-4 py-2 border-t border-base-content/10 text-xs opacity-50">
          <span>
            <kbd className="kbd kbd-xs">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="kbd kbd-xs">↵</kbd> open
          </span>
          <span>
            <kbd className="kbd kbd-xs">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
