import Breadcrumb from "@/components/Breadcrumb";
import ContactForm from "./ContactForm";

export const metadata = {
  title: "Contact",
  description: "Get in touch with the PhoneHub team.",
};

export default function ContactPage() {
  return (
    <main className="container mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />

      <div className="max-w-2xl mx-auto mt-4">
        <h1 className="text-3xl font-bold mb-3">Get in Touch</h1>
        <p className="text-base-content/70">
          Questions, corrections, or advertising enquiries? We&apos;d love to hear from you.
          Send us a message below or email us directly at{" "}
          <a
            href="mailto:contact@phonehub.com"
            className="font-semibold text-primary hover:underline"
          >
            contact@phonehub.com
          </a>
          .
        </p>

        <ContactForm />

        <div className="mt-10 pt-6 border-t border-base-300">
          <h2 className="text-lg font-semibold mb-3">Other ways to reach us</h2>
          <ul className="space-y-2 text-base-content/70">
            <li>
              <strong>General enquiries:</strong>{" "}
              <a href="mailto:contact@phonehub.com" className="text-primary hover:underline">
                contact@phonehub.com
              </a>
            </li>
            <li>
              <strong>Advertising &amp; partnerships:</strong>{" "}
              <a href="mailto:contact@phonehub.com" className="text-primary hover:underline">
                contact@phonehub.com
              </a>
            </li>
            <li>
              <strong>Corrections &amp; feedback:</strong>{" "}
              <a href="mailto:contact@phonehub.com" className="text-primary hover:underline">
                contact@phonehub.com
              </a>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
