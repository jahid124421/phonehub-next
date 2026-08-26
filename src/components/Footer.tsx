import Link from "next/link";

const year = new Date().getFullYear();

const links = {
  about: [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  explore: [
    { label: "Search", href: "/search" },
    { label: "Advanced Finder", href: "/advanced-finder" },
    { label: "Compare", href: "/compare" },
    { label: "Deals", href: "/deals" },
    { label: "News", href: "/news" },
    { label: "Brands", href: "/brands" },
    { label: "AI Finder", href: "/ai-finder" },
    { label: "Benchmarks", href: "/benchmarks" },
    { label: "Buying Guides", href: "/guides" },
    { label: "Upcoming Phones", href: "/upcoming" },
    { label: "Best Of Lists", href: "/best/best-phones-2026" },
    { label: "Developer API", href: "/developers" },
    { label: "Tools", href: "/tools" },
    { label: "Monitors", href: "/search?cat=monitor" },
    { label: "Routers", href: "/search?cat=router" },
  ],
  company: [
    { label: "Home", href: "/" },
    { label: "Phones", href: "/search?cat=phone" },
    { label: "Laptops", href: "/search?cat=laptop" },
    { label: "Cars", href: "/search?cat=auto" },
    { label: "Watchlist", href: "/watchlist" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Disclosure", href: "/disclosure" },
  ],
};

export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        marginTop: 64,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* About column */}
          <div>
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: "var(--text)" }}
            >
              About
            </h3>
            <ul className="space-y-2">
              {links.about.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:underline"
                    style={{ color: "var(--muted)" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore column */}
          <div>
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: "var(--text)" }}
            >
              Explore
            </h3>
            <ul className="space-y-2">
              {links.explore.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:underline"
                    style={{ color: "var(--muted)" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company column */}
          <div>
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: "var(--text)" }}
            >
              Company
            </h3>
            <ul className="space-y-2">
              {links.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:underline"
                    style={{ color: "var(--muted)" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal column */}
          <div>
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: "var(--text)" }}
            >
              Legal
            </h3>
            <ul className="space-y-2">
              {links.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:underline"
                    style={{ color: "var(--muted)" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            &copy; {year} PhoneHub. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {/* GitHub */}
            <a
              href="https://github.com/jahid124421/phonehub-next"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors"
              style={{ color: "var(--muted)" }}
              aria-label="PhoneHub on GitHub"
              title="PhoneHub on GitHub"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
