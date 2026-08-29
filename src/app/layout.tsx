import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import ScrollRestoration from "@/components/ScrollRestoration";
import CompareBar from "@/components/CompareBar";
import CommandPalette from "@/components/CommandPalette";
import { SITE_URL } from "@/lib/config";
import { organizationSchema } from "@/lib/schema";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PhoneHub — Find, Compare & Decide",
    template: "%s | PhoneHub",
  },
  description:
    "Find, compare & decide — the smartest way to research phones, laptops, cars & more.",
  applicationName: "PhoneHub",
  alternates: {
    canonical: "/",
  },
  // Declared once here so EVERY route inherits a share image. Previously only
  // the handful of pages that redeclared `images` produced an og:image, so the
  // homepage, /deals and all programmatic /vs and /best pages shared as blank
  // cards on Twitter, WhatsApp, Slack and Facebook.
  openGraph: {
    type: "website",
    siteName: "PhoneHub",
    locale: "en_US",
    url: SITE_URL,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PhoneHub — find, compare & decide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Two entries so the browser chrome matches the theme actually being shown
  // instead of always claiming the dark surface.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0f14" },
  ],
};

/**
 * Applies the saved (or OS-preferred) theme BEFORE first paint.
 *
 * The server always renders data-theme="phonehub" (dark). Without this, a
 * light-theme visitor got a full dark repaint on every single navigation
 * because ThemeToggle only reads localStorage in an effect, which runs after
 * hydration. Kept dependency-free and synchronous on purpose — it must block.
 */
const THEME_INIT = `(function(){try{var t=localStorage.getItem("phonehub_theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}document.documentElement.setAttribute("data-theme",t==="light"?"light":"phonehub");}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="phonehub"
      className={inter.variable}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.brandfetch.io" />

        {/* Organization JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema()),
          }}
        />

        {/* Puter.js — User-Pays AI ($0 server cost) */}
        <script src="https://js.puter.com/v2/" async />

        {/* Umami Analytics — privacy-first, self-hostable, no cookies */}
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <script
            defer
            src="https://cloud.umami.is/script.js"
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          />
        )}
      </head>
      <body className="min-h-screen flex flex-col">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <ScrollToTop />
        <ScrollRestoration />
        <CompareBar />
        <CommandPalette />
      </body>
    </html>
  );
}

