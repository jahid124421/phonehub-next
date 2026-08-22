"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import CurrencyPicker from "./CurrencyPicker";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Brands", href: "/brands" },
  { label: "Compare", href: "/compare" },
  { label: "Deals", href: "/deals" },
  { label: "News", href: "/news" },
  { label: "AI Finder", href: "/ai-finder" },
  { label: "Benchmarks", href: "/benchmarks" },
  { label: "Guides", href: "/guides" },
  { label: "Upcoming", href: "/upcoming" },
  { label: "Tools", href: "/tools" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "var(--header-bg)",
        backdropFilter: "saturate(140%) blur(12px)",
        borderBottom: "1px solid var(--header-border)",
      }}
    >
      <div
        className="header-inner"
        style={{
          maxWidth: "var(--max)",
          margin: "0 auto",
          padding: "0 18px",
          display: "flex",
          alignItems: "center",
          gap: 18,
          height: 64,
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: "-0.5px",
            whiteSpace: "nowrap",
            color: "var(--text)",
            textDecoration: "none",
          }}
        >
          Phone<span style={{ color: "var(--primary)" }}>Hub</span>
        </Link>

        {/* Nav links — desktop */}
        <nav
          style={{
            display: "flex",
            gap: 4,
            marginLeft: 8,
          }}
          className="nav-links-desktop"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link flex items-center justify-center ${
                isActive(link.href) ? "nav-link--active" : ""
              }`}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                color: isActive(link.href) ? "var(--primary)" : "var(--muted)",
                fontWeight: 500,
                fontSize: 14,
                textDecoration: "none",
                transition: "0.15s",
                background: isActive(link.href) ? "var(--nav-hover-bg)" : "transparent",
                borderBottom: isActive(link.href) ? "2px solid var(--primary)" : "2px solid transparent",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search — opens the keyboard-first command palette */}
        <div
          style={{
            marginLeft: "auto",
            flex: 1,
            maxWidth: 420,
            display: "flex",
          }}
          className="header-search-form"
        >
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("phonehub:open-palette"))
            }
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
              fontSize: 14,
              textAlign: "left",
            }}
            aria-label="Open search (Ctrl+K)"
          >
            <svg
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ flexShrink: 0 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span style={{ flex: 1 }}>Search phones, laptops, cars...</span>
            <kbd
              style={{
                fontSize: 11,
                padding: "2px 6px",
                borderRadius: 5,
                border: "1px solid var(--search-border)",
                background: "var(--surface)",
                whiteSpace: "nowrap",
              }}
            >
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Icon-only search — shown at widths where the full field can't fit */}
        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("phonehub:open-palette"))
          }
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
          aria-label="Open search (Ctrl+K)"
        >
          <svg
            width="15"
            height="15"
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
        </button>

        {/* Currency picker */}
        <CurrencyPicker />

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            display: "none",
            background: "none",
            border: "none",
            color: "var(--text)",
            fontSize: 24,
            cursor: "pointer",
          }}
          className="nav-toggle-btn"
          aria-label="Menu"
        >
          ☰
        </button>
      </div>

      {/* Mobile nav drawer */}
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
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                color: isActive(link.href) ? "var(--primary)" : "var(--muted)",
                fontWeight: 500,
                fontSize: 14,
                textDecoration: "none",
                background: isActive(link.href) ? "var(--nav-hover-bg)" : "transparent",
              }}
            >
              {link.label}
            </Link>
          ))}
          <form action="/search" method="get" style={{ display: "flex", padding: "8px 14px" }}>
            <input
              type="text"
              name="q"
              placeholder="Search..."
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "10px 0 0 10px",
                border: "1px solid var(--search-border)",
                borderRight: "none",
                background: "var(--search-bg)",
                color: "var(--text)",
                outline: "none",
                fontSize: 14,
              }}
            />
            <button
              type="submit"
              style={{
                padding: "0 16px",
                border: "none",
                borderRadius: "0 10px 10px 0",
                background: "var(--primary)",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Search
            </button>
          </form>
        </nav>
      )}

      {/* Global responsive styles (rendered once, applies site-wide) */}
      <style>{`
        .nav-link:hover {
          color: var(--text) !important;
          background: var(--nav-hover-bg) !important;
        }
        .nav-link--active {
          color: var(--primary) !important;
          background: var(--nav-hover-bg) !important;
          border-bottom: 2px solid var(--primary) !important;
        }
        .nav-links-desktop {
          display: flex !important;
        }
        .nav-toggle-btn {
          display: none !important;
        }
        .header-search-form {
          max-width: 420px;
          min-width: 0;
        }
        /* Whenever the icon button is visible, the flex search field is hidden,
           so the icon must carry the auto margin that pushes the group right. */
        .header-search-icon-btn {
          margin-left: auto;
        }

        /* 1280–1499px: compact nav links so the full search field still fits */
        @media (max-width: 1499px) {
          .header-inner {
            gap: 10px !important;
          }
          .nav-links-desktop {
            gap: 2px !important;
            margin-left: 2px !important;
          }
          .nav-links-desktop .nav-link {
            padding: 6px 8px !important;
            font-size: 13px !important;
          }
        }

        /* 1024–1279px: compact links + icon-only search */
        @media (max-width: 1279px) {
          .header-search-form {
            display: none !important;
          }
          .header-search-icon-btn {
            display: inline-flex !important;
          }
        }

        /* ≤1023px: hamburger nav; the freed space fits the full search field */
        @media (max-width: 1023px) {
          .nav-links-desktop {
            display: none !important;
          }
          .nav-toggle-btn {
            display: block !important;
          }
          .header-search-form {
            display: flex !important;
          }
          .header-search-icon-btn {
            display: none !important;
          }
        }

        /* ≤640px: icon-only search (the mobile drawer has its own search form) */
        @media (max-width: 640px) {
          .header-search-form {
            display: none !important;
          }
          .header-search-icon-btn {
            display: inline-flex !important;
          }
        }
      `}</style>
    </header>
  );
}
