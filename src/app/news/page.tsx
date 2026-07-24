import { Suspense } from "react";
import { getAllNews } from "@/lib/data";
import NewsClient from "./NewsClient";
import CategoryStrip from "@/components/CategoryStrip";

export const metadata = {
  title: "News",
  description: "Latest tech news, buying guides and comparisons.",
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
