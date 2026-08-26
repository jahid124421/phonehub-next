import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata = {
  title: "Affiliate Disclosure",
  description: "How PhoneHub earns from affiliate links and advertising.",
};

export default function DisclosurePage() {
  return (
    <main className="container mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Affiliate Disclosure" }]} />

      <div className="max-w-3xl mx-auto prose mt-4">
        <h1>Affiliate Disclosure</h1>

        <p>
          Some links on <strong>PhoneHub</strong> are affiliate links. If you click
          a &quot;Buy&quot; or store link and make a purchase, we may earn a commission — at{" "}
          <strong>no extra cost to you</strong>. This helps keep the Site running.
        </p>

        <h2>Programs we participate in</h2>
        <ul>
          <li>
            <strong>Amazon Associates</strong> — as an Amazon Associate we earn
            from qualifying purchases.
          </li>
          <li>
            <strong>Flipkart Affiliate</strong> and other retail affiliate
            programs.
          </li>
        </ul>

        <h2>About prices &amp; availability</h2>
        <p>
          Prices and availability shown are indicative and can change at any time.
          Always confirm the final price on the retailer&apos;s website before buying.
          We are not responsible for pricing errors or stock changes on third-party
          stores.
        </p>

        <h2>Editorial independence</h2>
        <p>
          Affiliate relationships do not influence our specifications data or the
          pros/cons and ratings shown. Commissions do not change the price you pay.
        </p>

        <h2>Advertising</h2>
        <p>
          We also display ads (e.g. via Google AdSense). See our{" "}
          <Link href="/privacy">Privacy Policy</Link> for how advertising cookies work.
        </p>
      </div>
    </main>
  );
}
