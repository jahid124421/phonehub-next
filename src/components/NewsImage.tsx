"use client";

import { useState } from "react";

export const NEWS_PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" fill="none"><rect width="800" height="450" fill="#1a1a2e"/><text x="400" y="225" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="24" fill="#4a4a6a">No Image</text></svg>`
)}`;

interface NewsImageProps {
  src: string;
  alt: string;
  className?: string;
}

/** News thumbnail that falls back to a placeholder if the remote image 404s. */
export default function NewsImage({ src, alt, className }: NewsImageProps) {
  const [imgSrc, setImgSrc] = useState(src || NEWS_PLACEHOLDER);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      className={className ?? "w-full h-full object-cover"}
      loading="lazy"
      onError={() => {
        if (imgSrc !== NEWS_PLACEHOLDER) setImgSrc(NEWS_PLACEHOLDER);
      }}
    />
  );
}
