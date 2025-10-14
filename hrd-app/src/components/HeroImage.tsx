"use client";

import { useState } from "react";

type Props = {
  alt?: string;
  className?: string;
  srcs?: string[]; // fallback order
};

export default function HeroImage({ alt = "", className = "", srcs }: Props) {
  const fallbacks = srcs && srcs.length ? srcs : [
    "/images/hrd-hero.jpeg/hrd-hero.jpg",
    "/images/hrd-hero.jpg",
    "/images/hrd-hero.jpeg",
    "/images/hrd-hero.png",
    "/images/hrd-hero.webp",
  ];
  const [i, setI] = useState(0);
  const src = fallbacks[Math.min(i, fallbacks.length - 1)];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      className={className}
      src={src}
      onError={() => setI((prev) => (prev < fallbacks.length - 1 ? prev + 1 : prev))}
    />
  );
}
