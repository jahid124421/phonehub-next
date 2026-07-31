import type { Metadata } from "next";
import DealsClient from "./DealsClient";

export const metadata: Metadata = {
  title: "Best Deals — PhoneHub",
  description: "Find the best value-for-money products on PhoneHub. Discover value kings, budget steals, and price drops across phones, monitors, and routers.",
};

export default function DealsPage() {
  return <DealsClient />;
}
