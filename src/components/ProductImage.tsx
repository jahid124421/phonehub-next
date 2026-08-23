"use client";

import { useState } from "react";

interface ProductImageProps {
  src: string;
  alt: string;
  fallback: string;
  className?: string;
  /** Above-the-fold images must not be lazy — lazy LCP delays first paint. */
  priority?: boolean;
}

export default function ProductImage({ src, alt, fallback, className, priority = false }: ProductImageProps) {
  // `src || fallback`: data files may carry an empty image string — skip the
  // guaranteed-broken request and render the fallback immediately.
  const [imgSrc, setImgSrc] = useState(src || fallback);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className ?? "w-full h-full object-contain p-4"}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      onError={() => {
        if (imgSrc !== fallback) setImgSrc(fallback);
      }}
    />
  );
}
