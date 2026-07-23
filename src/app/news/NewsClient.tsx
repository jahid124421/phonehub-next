"use client";

import { useState } from "react";
import { type NewsItem } from "@/lib/data";
import Breadcrumb from "@/components/Breadcrumb";
import NewsCard from "@/components/NewsCard";


export default function NewsClient({ allNews }: { allNews: NewsItem[] }) {
  // Derive available tags from data, keeping "All" first
  const dataTags = Array.from(new Set(allNews.map((n) => n.tag).filter(Boolean)));
  const tags = ["All", ...dataTags.filter((t) => t !== "All")];
  const [activeTag, setActiveTag] = useState("All");

  const filtered = activeTag === "All"
    ? allNews
    : allNews.filter((n) => n.tag === activeTag);

  return (
    <main className="container mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "News" }]} />
      <h1 className="text-3xl font-bold mt-4 mb-1">Latest tech news</h1>
      <p className="text-base-content/60 mb-5">
        Fresh phone, laptop &amp; gadget news, refreshed daily from across the web.
      </p>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tags.map((tag) => (
          <button
            key={tag}
            className={
              tag === activeTag
                ? "btn btn-sm btn-primary"
                : "btn btn-sm btn-outline"
            }
            onClick={() => setActiveTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* News grid */}
      {filtered.length > 0 ? (
        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}
        >
          {filtered.map((item) => (
            <NewsCard key={item.id} news={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-base-content/60">
          No news in this category yet.
        </div>
      )}
    </main>
  );
}
