"use client";

import { useState } from "react";

interface ProductImageProps {
  src: string;
  alt: string;
  fallback: string;
}

export default function ProductImage({ src, alt, fallback }: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className="w-full h-full object-contain p-4"
      onError={() => {
        if (imgSrc !== fallback) setImgSrc(fallback);
      }}
    />
  );
}
