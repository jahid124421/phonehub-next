import Link from "next/link";
import { SITE_URL } from "@/lib/config";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata = {
  title: "About",
  description: "What PhoneHub is and how we help you choose a phone.",
  openGraph: {
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'PhoneHub' }],
  },
};

export default function AboutPage() {
  return (
    <main className="container mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "About" }]} />

      <div className="max-w-3xl mx-auto prose mt-4">
        <h1>About PhoneHub</h1>

        <p>
          <strong>PhoneHub</strong> brings phone specifications, live prices across
          stores, and honest pros/cons together in one place — so you can research and
          decide without opening ten tabs.
        </p>

        <h2>What we do</h2>
        <ul>
          <li>Detailed, structured specifications for every phone.</li>
          <li>Price comparison across major retailers.</li>
          <li>Side-by-side comparison of up to four phones.</li>
          <li>Clear, original verdicts with pros and cons.</li>
        </ul>

        <h2>How our content is made</h2>
        <p>
          Specifications are aggregated from public sources and structured into a
          consistent format. Our written summaries, pros and cons are produced
          editorially based on those specifications — we don&apos;t copy other reviews.
        </p>

        <h2>How we stay free</h2>
        <p>
          We earn through affiliate commissions and advertising. This never changes
          the price you pay. See our{" "}
          <Link href="/disclosure">Affiliate Disclosure</Link>.
        </p>

        <h2>Get in touch</h2>
        <p>
          Feedback or a correction? Visit the{" "}
          <Link href="/contact">Contact page</Link>.
        </p>
      </div>
    </main>
  );
}
