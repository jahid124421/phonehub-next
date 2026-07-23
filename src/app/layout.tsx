import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-XXXXXXXXXX";

export const metadata: Metadata = {
  metadataBase: new URL('https://phonehub.com'),
  title: {
    default: "PhoneHub — Find, Compare & Decide",
    template: "%s | PhoneHub",
  },
  description: "Find, compare & decide — the smartest way to research phones, laptops, cars & more.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: "website",
    siteName: "PhoneHub",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="phonehub" className={inter.variable}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.brandfetch.io" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

        {/* Organization JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "PhoneHub",
              url: "https://phonehub.com",
              logo: "https://phonehub.com/favicon.svg",
              sameAs: [],
            }),
          }}
        />

        {/* Google Analytics 4 — consent-aware (ported from Astro) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  var GA_ID="${GA_MEASUREMENT_ID}";
  var COOKIE_KEY="phonehub_cookie_consent";
  window.dataLayer=window.dataLayer||[];
  function gtag(){dataLayer.push(arguments);}
  window.gtag=gtag;
  gtag("consent","default",{analytics_storage:"denied"});
  var consent=null;
  try{consent=localStorage.getItem(COOKIE_KEY);}catch(e){}
  if(consent==="accepted"){
    gtag("consent","update",{analytics_storage:"granted"});
    var s=document.createElement("script");
    s.async=true;s.id="ga4-script";
    s.src="https://www.googletagmanager.com/gtag/js?id="+GA_ID;
    document.head.appendChild(s);
    gtag("js",new Date());
    gtag("config",GA_ID);
  }
})();`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
