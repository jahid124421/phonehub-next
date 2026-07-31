import type { Metadata } from "next";
import { getUpcomingDevices, type UpcomingDevice } from "@/lib/data";
import { SITE_URL } from "@/lib/config";
import UpcomingClient from "./UpcomingClient";

export const dynamic = "force-static";
export const revalidate = 86400; // daily

export const metadata: Metadata = {
  title: "Upcoming Phones 2026 — Rumors, Leaks & Confirmed Launches | PhoneHub",
  description:
    "Track 30+ upcoming smartphones and tablets — confirmed launches, leaks, and rumors from Samsung, Apple, Google, Xiaomi, OnePlus, and more.",
  keywords: [
    "upcoming phones 2026",
    "upcoming smartphones",
    "phone rumors",
    "phone leaks 2026",
    "iPhone 18",
    "Galaxy S25 FE",
    "Pixel 11",
  ],
  openGraph: {
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: "PhoneHub Upcoming Phones" }],
  },
};

const upcomingJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Upcoming Phones 2026 — Rumors, Leaks & Confirmed Launches | PhoneHub",
  description: "Track 30+ upcoming smartphones and tablets — confirmed launches, leaks, and rumors.",
  url: `${SITE_URL}/upcoming`,
};

export default function UpcomingPage() {
  const devices: UpcomingDevice[] = getUpcomingDevices();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(upcomingJsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Upcoming Phones & Devices</h1>
          <p className="mt-2" style={{ color: "var(--muted)" }}>
            Track {devices.length}+ upcoming smartphones, tablets and foldables — confirmed launches, leaks, and rumors
          </p>
        </div>
        <UpcomingClient devices={devices} />
      </div>
    </>
  );
}
