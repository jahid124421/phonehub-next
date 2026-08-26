import type { Metadata } from "next";
import WatchlistClient from "./WatchlistClient";

export const metadata: Metadata = {
  title: "My Watchlist — PhoneHub",
  // robots.ts already Disallows /watchlist; noindex belt-and-braces so it
  // can never surface in SERPs even if discovered another way.
  robots: { index: false, follow: false },
};

export default function WatchlistPage() {
  return <WatchlistClient />;
}
