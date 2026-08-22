"use client";

import { useState } from "react";

export const NEWS_PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" fill="none"><rect width="800" height="450" fill="#151d32"/><circle cx="400" cy="195" r="44" fill="#243050"/><text x="400" y="210" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="40">📰</text><text x="400" y="280" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="22" font-weight="600" fill="#9aa2b1">PhoneHub News</text></svg>`
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
