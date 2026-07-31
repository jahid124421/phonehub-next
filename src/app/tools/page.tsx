import { SITE_URL } from '@/lib/config';
import type { Metadata } from 'next';
import ToolsClient from './ToolsClient';

export const metadata: Metadata = {
  title: 'Free Tech Tools - Speed Test, IP Lookup & Network Diagnostics',
  description:
    'Free online tech tools: internet speed test, IP geolocation lookup, ping test, DNS lookup, and network diagnostics. No signup required.',
  alternates: { canonical: `${SITE_URL}/tools` },
  openGraph: {
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'PhoneHub Tools' }],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Free Tech Tools - Speed Test, IP Lookup & Network Diagnostics | PhoneHub',
  description:
    'Free online tech tools: internet speed test, IP geolocation lookup, ping test, DNS lookup, and network diagnostics. No signup required.',
  url: `${SITE_URL}/tools`,
};

export default function ToolsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ToolsClient />
    </>
  );
}
