import { Suspense } from "react";
import { getAllNews } from "@/lib/data";
import { SITE_URL } from "@/lib/config";
import NewsClient from "./NewsClient";
import CategoryStrip from "@/components/CategoryStrip";

export const metadata = {
  title: "News",
  description: "Latest tech news, buying guides and comparisons.",
  openGraph: {
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'PhoneHub News' }],
  },
};

export default function NewsPage() {
  const news = getAllNews();
  return (
    <>
      <Suspense fallback={<div className="cat-strip-outer"><div className="cat-strip">Loading categories…</div></div>}>
        <CategoryStrip />
      </Suspense>
      <NewsClient allNews={news} />
    </>
  );
}
