import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata = {
  title: "Privacy Policy",
  description: "How PhoneHub handles data, cookies and third-party services.",
};

export default function PrivacyPage() {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="container mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]} />

      <div className="max-w-3xl mx-auto prose mt-4">
        <h1>Privacy Policy</h1>
        <p className="text-base-content/60 not-prose">Last updated: {today}</p>

        <p>
          This Privacy Policy explains how <strong>PhoneHub</strong> (&quot;we&quot;, &quot;us&quot;)
          handles information when you visit <strong>phonehub</strong> (the &quot;Site&quot;).
          By using the Site you agree to this policy.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Usage data</strong> — pages viewed, device/browser type, and
            approximate location, collected automatically via analytics.
          </li>
          <li>
            <strong>Cookies</strong> — small files stored in your browser (see below).
          </li>
          <li>
            We do <strong>not</strong> ask you to create an account and do not
            knowingly collect personal information from you directly.
          </li>
        </ul>

        <h2>Cookies &amp; similar technologies</h2>
        <p>
          We use cookies for basic site functionality (e.g. remembering phones you
          add to compare) and, where enabled, for analytics and advertising. You can
          control cookies through your browser settings and via our cookie banner.
        </p>

        <h2>Third-party services</h2>
        <ul>
          <li>
            <strong>Google AdSense / advertising partners</strong> may use cookies
            to serve ads based on your prior visits. You can opt out of personalized
            advertising via{" "}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Ads Settings
            </a>
            .
          </li>
          <li>
            <strong>Analytics providers</strong> help us understand traffic.
          </li>
          <li>
            <strong>Affiliate partners</strong> (e.g. Amazon Associates, Flipkart
            Affiliate) may set cookies when you click a &quot;Buy&quot; link. See our{" "}
            <Link href="/disclosure">Affiliate Disclosure</Link>.
          </li>
        </ul>

        <h2>Your choices &amp; rights</h2>
        <p>
          Depending on your location (e.g. GDPR in the EU, CCPA in California) you
          may have the right to access, correct or delete data held about you, and to
          object to certain processing. Contact us at{" "}
          <a href="mailto:contact@phonehub.com">
            <strong>contact@phonehub.com</strong>
          </a>{" "}
          to make a request.
        </p>

        <h2>Children</h2>
        <p>
          The Site is not directed at children under 13 and we do not knowingly
          collect their data.
        </p>

        <h2>Changes</h2>
        <p>
          We may update this policy; the &quot;last updated&quot; date reflects the latest
          version.
        </p>

        <h2>Contact</h2>
        <p>
          Questions? Reach us at{" "}
          <a href="mailto:contact@phonehub.com">
            <strong>contact@phonehub.com</strong>
          </a>{" "}
          or via the <Link href="/contact">Contact page</Link>.
        </p>
      </div>
    </main>
  );
}
