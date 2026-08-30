"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import CurrencyPicker from "./CurrencyPicker";

const primaryLinks = [
  { label: "Discover", href: "/" },
  { label: "Compare", href: "/compare", withCount: true },
  { label: "Intelligence", href: "/ai-finder" },
];

const moreLinks = [
  { label: "Deals", href: "/deals", sub: "Price drops" },
  { label: "Guides", href: "/guides", sub: "Best picks" },
  { label: "Benchmarks", href: "/benchmarks", sub: "Scores" },
  { label: "News", href: "/news", sub: "Editorial" },
  { label: "Upcoming", href: "/upcoming", sub: "Calendar" },
  { label: "Tools", href: "/tools", sub: "Utilities" },
  { label: "Brands", href: "/brands", sub: "222 brands" },
];

function getCompareCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const v = localStorage.getItem("phonehub_compare");
    return v ? (JSON.parse(v) as string[]).length : 0;
  } catch {
    return 0;
  }
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [compareCount, setCompareCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    setCompareCount(getCompareCount());
    const h = (e: Event) => {
      const d = (e as CustomEvent).detail as string[] | undefined;
      setCompareCount(d ? d.length : getCompareCount());
    };
    window.addEventListener("compare-updated", h);
    window.addEventListener("storage", () => setCompareCount(getCompareCount()));
    return () => {
      window.removeEventListener("compare-updated", h);
      window.removeEventListener("storage", () => setCompareCount(getCompareCount()));
    };
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const openPalette = () => window.dispatchEvent(new CustomEvent("phonehub:open-palette"));

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "var(--header-bg)",
        backdropFilter: "saturate(140%) blur(14px)",
        borderBottom: "1px solid var(--header-border)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--max)",
          margin: "0 auto",
          padding: "0 18px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          height: 62,
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontWeight: 900,
            fontSize: 19,
            letterSpacing: "-0.04em",
            whiteSpace: "nowrap",
            color: "var(--text)",
            textDecoration: "none",
          }}
        >
          Phone<span style={{ color: "var(--primary)" }}>Hub</span>
        </Link>

        {/* Primary nav — 3 + More (Noir v2 beats Versus 10-link clutter) */}
        <nav className="nav-links-desktop" style={{ display: "flex", gap: 2, marginLeft: 6, alignItems: "center" }}>
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${isActive(link.href) ? "nav-link--active" : ""}`}
              style={{
                padding: "8px 11px",
                borderRadius: 8,
                color: isActive(link.href) ? "var(--text)" : "var(--muted)",
                fontWeight: 600,
                fontSize: 13,
                textDecoration: "none",
                background: isActive(link.href) ? "var(--surface-2)" : "transparent",
                border: "1px solid " + (isActive(link.href) ? "var(--border)" : "transparent"),
                display: "inline-flex",
                gap: 6,
                alignItems: "center",
              }}
            >
              {link.label}
              {link.withCount && compareCount > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "1px 6px",
                    borderRadius: 999,
                    background: "var(--primary)",
                    color: "#fff",
                  }}
                >
                  {compareCount}
                </span>
              )}
            </Link>
          ))}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setMoreOpen((v) => !v)}
              onBlur={() => setTimeout(() => setMoreOpen(false), 140)}
              className="nav-link"
              style={{
                padding: "8px 11px",
                borderRadius: 8,
                color: "var(--muted)",
                fontWeight: 600,
                fontSize: 13,
                background: moreOpen ? "var(--surface-2)" : "transparent",
                border: "1px solid " + (moreOpen ? "var(--border)" : "transparent"),
                cursor: "pointer",
              }}
              aria-haspopup="true"
              aria-expanded={moreOpen}
            >
              More ▾
            </button>
            {moreOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 10px)",
                  left: 0,
                  minWidth: 220,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: 6,
                  boxShadow: "var(--shadow-lg)",
                  zIndex: 20,
                }}
              >
                {moreLinks.map((m) => (
                  <Link
                    key={m.href}
                    href={m.href}
                    onClick={() => setMoreOpen(false)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "9px 10px",
                      borderRadius: 8,
                      fontSize: 13,
                      color: isActive(m.href) ? "var(--text)" : "var(--muted)",
                      background: isActive(m.href) ? "var(--surface-2)" : "transparent",
                      textDecoration: "none",
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{m.label}</span>
                    <small style={{ color: "var(--muted)", fontSize: 11 }}>{m.sub}</small>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Search pill — dispatches command palette; collapses to icon ≤1100px */}
        <div className="header-search-form" style={{ marginLeft: "auto", flex: 1, maxWidth: 420, display: "flex" }}>
          <button
            type="button"
            onClick={openPalette}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid var(--search-border)",
              background: "var(--search-bg)",
              color: "var(--muted)",
              cursor: "text",
              fontSize: 13,
              textAlign: "left",
            }}
            aria-label="Open search (Ctrl+K)"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Search phones, laptops, cars…
            </span>
            <kbd
              style={{
                fontSize: 11,
                padding: "2px 6px",
                borderRadius: 5,
                border: "1px solid var(--search-border)",
                background: "var(--surface)",
                whiteSpace: "nowrap",
                fontFamily: "monospace",
              }}
            >
              Ctrl K
            </kbd>
          </button>
        </div>

        <button
          type="button"
          onClick={openPalette}
          className="header-search-icon-btn"
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            flex: "none",
            borderRadius: 10,
            border: "1px solid var(--search-border)",
            background: "var(--search-bg)",
            color: "var(--muted)",
            cursor: "pointer",
          }}
          aria-label="Open search"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        <CurrencyPicker />
        <ThemeToggle />

        {/* Compare pill — always visible, shows count */}
        <Link
          href="/compare"
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 12px",
            borderRadius: 999,
            border: "1px solid var(--primary)",
            background: compareCount > 0 ? "var(--primary)" : "var(--surface)",
            color: compareCount > 0 ? "#fff" : "var(--muted)",
            fontWeight: 800,
            fontSize: 13,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Compare {compareCount > 0 ? `· ${compareCount}` : ""}
          {compareCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                minWidth: 18,
                height: 18,
                padding: "0 5px",
                borderRadius: 999,
                background: "#fff",
                color: "var(--primary)",
                fontSize: 11,
                fontWeight: 900,
                display: "grid",
                placeItems: "center",
                border: "2px solid var(--bg)",
              }}
            >
              {compareCount}
            </span>
          )}
        </Link>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            display: "none",
            background: "none",
            border: "none",
            color: "var(--text)",
            fontSize: 22,
            cursor: "pointer",
          }}
          className="nav-toggle-btn"
          aria-label="Menu"
        >
          ☰
        </button>
      </div>

      {mobileOpen && (
        <nav
          style={{
            background: "var(--surface)",
            borderTop: "1px solid var(--border)",
            padding: 10,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {[...primaryLinks, ...moreLinks].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                color: isActive(link.href) ? "var(--primary)" : "var(--muted)",
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
                background: isActive(link.href) ? "var(--surface-2)" : "transparent",
              }}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => {
              setMobileOpen(false);
              openPalette();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid var(--search-border)",
              background: "var(--search-bg)",
              color: "var(--muted)",
              cursor: "pointer",
              marginTop: 4,
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search…
          </button>
        </nav>
      )}

      <style>{`
        .nav-link:hover { color: var(--text) !important; background: var(--surface-2) !important; }
        .nav-links-desktop { display: flex !important; }
        .nav-toggle-btn { display: none !important; }
        .header-search-icon-btn { margin-left: auto; }
        @media (max-width: 1100px) {
          .header-search-form { display: none !important; }
          .header-search-icon-btn { display: inline-flex !important; }
        }
        @media (max-width: 860px) {
          .nav-links-desktop { display: none !important; }
          .nav-toggle-btn { display: block !important; }
          .header-search-form { display: flex !important; }
          .header-search-icon-btn { display: none !important; }
        }
        @media (max-width: 640px) {
          .header-search-form { display: none !important; }
          .header-search-icon-btn { display: inline-flex !important; }
        }
      `}</style>
    </header>
  );
}
