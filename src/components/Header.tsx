import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

const categories = [
  { label: "Phones", value: "phone", icon: "📱" },
  { label: "Laptops", value: "laptop", icon: "💻" },
  { label: "TVs", value: "tv", icon: "📺" },
  { label: "Cars", value: "auto", icon: "🚗" },
  { label: "Watches", value: "smartwatch", icon: "⌚" },
];

const navLinks = [
  { label: "Home", href: "/" },
  { label: "All Phones", href: "/search?cat=phone" },
  { label: "Brands", href: "/brands" },
  { label: "Compare", href: "/compare" },
  { label: "News", href: "/news" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-navy-900/80 backdrop-blur-xl border-b border-white/5">
      <div className="navbar max-w-7xl mx-auto px-4 h-16">
        {/* Left: Logo */}
        <div className="navbar-start">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white font-bold text-sm">
              P
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent hidden sm:inline">
              PhoneHub
            </span>
          </Link>
        </div>

        {/* Center: Nav links + Search */}
        <div className="navbar-center hidden md:flex">
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <form action="/search" method="get" className="relative ml-4 w-full max-w-xs">
            <input
              type="text"
              name="q"
              placeholder="Search phones, laptops, cars..."
              className="w-full h-10 pl-10 pr-4 rounded-full bg-navy-700/60 border border-white/10 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent-blue/50 focus:bg-navy-700/80 transition-all"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </form>
        </div>

        {/* Right: Theme toggle + Mobile menu */}
        <div className="navbar-end gap-2">
          {/* Desktop category pills */}
          <nav className="hidden lg:flex items-center gap-1">
            {categories.map((cat) => (
              <Link
                key={cat.value}
                href={`/search?cat=${cat.value}`}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.label}
              </Link>
            ))}
          </nav>

          <ThemeToggle />

          {/* Mobile hamburger */}
          <div className="dropdown dropdown-end lg:hidden">
            <label tabIndex={0} className="btn btn-ghost btn-sm text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content mt-3 p-3 shadow-2xl bg-navy-800/95 backdrop-blur-xl rounded-2xl w-64 border border-white/10"
            >
              <li className="mb-2">
                <form action="/search" method="get" className="md:hidden">
                  <input
                    type="text"
                    name="q"
                    placeholder="Search..."
                    className="w-full h-9 px-3 rounded-lg bg-navy-700/60 border border-white/10 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent-blue/50"
                  />
                </form>
              </li>
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="mt-2 pt-2 border-t border-white/10">
                <Link
                  href="/compare"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/10"
                >
                  <span>⚖️</span> Compare
                </Link>
              </li>
              <li>
                <Link
                  href="/news"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/10"
                >
                  <span>📰</span> News
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
