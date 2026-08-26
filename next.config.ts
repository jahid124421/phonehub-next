import type { NextConfig } from "next";

// Content-Security-Policy. Applied in production only — dev mode needs
// 'unsafe-eval' for HMR, which we don't want to allow in prod.
// Hosts allowed beyond 'self':
//   giscus.app        — comments widget (script + iframe)
//   cloud.umami.is    — optional analytics (enabled via NEXT_PUBLIC_UMAMI_WEBSITE_ID)
//   api.groq.com / generativelanguage.googleapis.com — LLM APIs (server-side
//     only, but allowed here so a future browser-side call won't break)
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://giscus.app https://cloud.umami.is",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: data: blob:",
  "connect-src 'self' https://api.groq.com https://generativelanguage.googleapis.com https://cloud.umami.is",
  "font-src 'self' data:",
  "frame-src https://giscus.app",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // HSTS: safe unconditionally — browsers ignore it over plain HTTP (dev).
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Content-Security-Policy', value: csp }]
    : []),
];

const nextConfig: NextConfig = {
  // Pin the workspace root so Next doesn't pick up stray parent-directory
  // lockfiles (there are package-lock.json files above this project).
  turbopack: {
    root: __dirname,
  },
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'fdn2.gsmarena.com' },
      { protocol: 'https', hostname: 'cdn2.gsmarena.com' },
      { protocol: 'https', hostname: 'cdn.simpleicons.org' },
      { protocol: 'https', hostname: 'cdn.brandfetch.io' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
