import Link from "next/link";

export const metadata = { title: "Page not found · PhoneHub" };

export default function NotFound() {
  return (
    <main className="hero min-h-[60vh]">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-7xl font-bold mb-2">404</h1>
          <p className="text-lg text-base-content/70 mb-6">
            That page doesn&apos;t exist. Let&apos;s get you back on track.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn btn-primary">
              Go Home
            </Link>
            <Link href="/search" className="btn btn-ghost">
              Browse Devices
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
