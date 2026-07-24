"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Smartphone,
  Tablet,
  Laptop,
  Watch,
  Tv,
  Camera,
  Headphones,
  Gamepad2,
  Plug,
  Car,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";

interface SubCat {
  label: string;
  href: string;
}

interface CatItem {
  icon: LucideIcon;
  label: string;
  slug: string;
  subs?: SubCat[];
}

const CATEGORIES: CatItem[] = [
  {
    icon: Smartphone,
    label: "Phones",
    slug: "phone",
    subs: [
      { label: "Android", href: "/search?cat=phone&q=android" },
      { label: "iPhones", href: "/search?brand=apple&cat=phone" },
      { label: "Budget", href: "/search?cat=phone&sort=price_asc" },
      { label: "Flagship", href: "/search?cat=phone&sort=rating" },
    ],
  },
  { icon: Tablet, label: "Tablets", slug: "tablet" },
  {
    icon: Laptop,
    label: "Laptops",
    slug: "laptop",
    subs: [
      { label: "Gaming", href: "/search?cat=laptop&q=gaming" },
      { label: "Ultrabooks", href: "/search?cat=laptop&q=ultrabook" },
      { label: "Budget", href: "/search?cat=laptop&sort=price_asc" },
      { label: "Business", href: "/search?cat=laptop&q=business" },
    ],
  },
  { icon: Watch, label: "Watches", slug: "smartwatch" },
  {
    icon: Tv,
    label: "TVs",
    slug: "tv",
    subs: [
      { label: "Smart TVs", href: "/search?cat=tv&q=smart" },
      { label: "OLED", href: "/search?cat=tv&q=oled" },
      { label: "4K", href: "/search?cat=tv&q=4k" },
      { label: "Budget", href: "/search?cat=tv&sort=price_asc" },
    ],
  },
  { icon: Camera, label: "Cameras", slug: "camera" },
  { icon: Headphones, label: "Audio", slug: "audio" },
  { icon: Gamepad2, label: "Consoles", slug: "console" },
  {
    icon: Plug,
    label: "Appliances",
    slug: "appliance",
    subs: [
      { label: "Home", href: "/search?cat=appliance&q=home" },
      { label: "Kitchen", href: "/search?cat=appliance&q=kitchen" },
      { label: "Personal", href: "/search?cat=appliance&q=personal" },
    ],
  },
  {
    icon: Car,
    label: "Auto",
    slug: "auto",
    subs: [
      { label: "Cars", href: "/search?cat=auto&q=car" },
      { label: "Bikes", href: "/search?cat=auto&q=bike" },
      { label: "Scooters", href: "/search?cat=auto&q=scooter" },
      { label: "EVs", href: "/search?cat=auto&q=electric" },
    ],
  },
  { icon: LayoutGrid, label: "All", slug: "all" },
];

export default function CategoryStrip() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="cat-strip-outer relative">
      <div className="cat-strip">
        {CATEGORIES.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.slug}
              className="relative"
              onMouseEnter={() => cat.subs && setOpenIdx(idx)}
              onMouseLeave={() => setOpenIdx(null)}
            >
              <Link
                href={cat.slug === "all" ? "/search" : `/search?cat=${cat.slug}`}
                className="cat-strip-link"
              >
                <Icon size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
                {cat.label}
                {cat.subs && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginLeft: 4, opacity: 0.5 }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
              </Link>

              {/* Dropdown */}
              {cat.subs && openIdx === idx && (
                <div
                  className="cat-dropdown"
                  onMouseEnter={() => setOpenIdx(idx)}
                  onMouseLeave={() => setOpenIdx(null)}
                >
                  {cat.subs.map((sub) => (
                    <Link key={sub.label} href={sub.href} className="cat-dropdown-item">
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
