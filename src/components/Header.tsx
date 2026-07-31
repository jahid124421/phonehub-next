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
  { label: "News", href: "/news" },
  { label: "AI Finder", href: "/ai-finder" },
  { label: "Benchmarks", href: "/benchmarks" },
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

        {/* Search form */}
        <form
          action="/search"
          method="get"
          style={{
            marginLeft: "auto",
            flex: 1,
            maxWidth: 420,
            display: "flex",
          }}
          className="header-search-form"
        >
          <input
            type="text"
            name="q"
            placeholder="Search phones, laptops, cars..."
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
              fontSize: 14,
            }}
          >
            Search
          </button>
        </form>

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

      {/* Scoped responsive styles */}
      <style jsx>{`
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
        }
        @media (max-width: 860px) {
          .nav-links-desktop {
            display: none !important;
          }
          .nav-toggle-btn {
            display: block !important;
          }
          .header-search-form {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
