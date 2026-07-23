import Breadcrumb from "@/components/Breadcrumb";

export const metadata = {
  title: "Terms of Use",
  description: "Terms and conditions for using PhoneHub.",
};

export default function TermsPage() {
  return (
    <main className="container mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Terms of Use" }]} />

      <div className="max-w-3xl mx-auto prose prose-invert mt-4">
        <h1>Terms of Use</h1>

        <p>
          By accessing <strong>PhoneHub</strong> (&quot;the Site&quot;) you agree to these terms.
        </p>

        <h2>Information accuracy</h2>
        <p>
          We work to keep specifications and prices accurate, but provide the Site
          &quot;as is&quot; without warranties. Specifications may contain errors and prices
          change constantly — verify details on the manufacturer or retailer site
          before purchasing.
        </p>

        <h2>External links</h2>
        <p>
          The Site links to third-party stores and sources. We are not responsible
          for their content, prices, availability, or policies.
        </p>

        <h2>Intellectual property</h2>
        <p>
          Site design, original written reviews and layout are owned by PhoneHub.
          Brand names, logos and product images are the property of their respective
          owners and are used for identification only.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          We are not liable for any loss arising from use of the Site, including
          purchasing decisions based on information shown here.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these terms at any time. Continued use means you accept the
          updated terms.
        </p>
      </div>
    </main>
  );
}
