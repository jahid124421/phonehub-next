import { type NewsItem } from "@/lib/data";

const placeholderImage = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" fill="none"><rect width="800" height="450" fill="#1a1a2e"/><text x="400" y="225" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="24" fill="#4a4a6a">No Image</text></svg>`)}`;

export default function NewsCard({ news }: { news: NewsItem }) {
  const imageSrc = news.image || placeholderImage;

  return (
    <a
      href={news.url}
      target="_blank"
      rel="noopener nofollow"
      className="card bg-base-200 border border-base-300 hover:border-primary transition-all hover:-translate-y-1 duration-200"
    >
      {/* Hero image area */}
      <figure className="relative aspect-video overflow-hidden bg-base-300">
        <img
          src={imageSrc}
          alt={news.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Tag overlay badge */}
        {news.tag && (
          <span className="absolute top-2 left-2 badge badge-sm badge-primary">
            {news.tag}
          </span>
        )}
      </figure>

      {/* Card body */}
      <div className="card-body p-4 gap-2">
        <h3 className="text-base font-semibold line-clamp-2 leading-snug">{news.title}</h3>
        <p className="text-sm text-base-content/60 line-clamp-3">{news.excerpt}</p>
        <div className="flex items-center justify-between mt-2 text-xs text-base-content/50">
          <span className="font-medium">{news.source}</span>
          <time dateTime={news.date}>{news.dateLabel}</time>
        </div>
      </div>
    </a>
  );
}
