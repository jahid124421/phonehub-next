"use client";

import { useState } from "react";

interface ProductImageProps {
  src: string;
  alt: string;
  fallback: string;
  className?: string;
}

export default function ProductImage({ src, alt, fallback, className }: ProductImageProps) {
  // `src || fallback`: data files may carry an empty image string — skip the
  // guaranteed-broken request and render the fallback immediately.
  const [imgSrc, setImgSrc] = useState(src || fallback);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className ?? "w-full h-full object-contain p-4"}
      loading="lazy"
      onError={() => {
        if (imgSrc !== fallback) setImgSrc(fallback);
      }}
    />
  );
}
