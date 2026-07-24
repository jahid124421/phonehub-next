"use client";

import Link from "next/link";
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
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

interface SubCat {
  label: string;
  slug: string;
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
      { label: "Android Phones", slug: "android-phones" },
      { label: "iPhones", slug: "iphones" },
      { label: "Budget Phones", slug: "budget-phones" },
      { label: "Flagship Phones", slug: "flagship-phones" },
    ],
  },
  {
    icon: Laptop,
    label: "Laptops",
    slug: "laptop",
    subs: [
      { label: "Gaming Laptops", slug: "gaming-laptops" },
      { label: "Ultrabooks", slug: "ultrabooks" },
      { label: "Budget Laptops", slug: "budget-laptops" },
      { label: "Business Laptops", slug: "business-laptops" },
    ],
  },
  {
    icon: Tablet,
    label: "Tablets",
    slug: "tablet",
    subs: [
      { label: "Android Tablets", slug: "android-tablets" },
      { label: "iPads", slug: "ipads" },
    ],
  },
  {
    icon: Watch,
    label: "Watches",
    slug: "smartwatch",
    subs: [
      { label: "Android Watches", slug: "android-watches" },
      { label: "Apple Watches", slug: "apple-watches" },
    ],
  },
  {
    icon: Tv,
    label: "TVs",
    slug: "tv",
    subs: [
      { label: "Smart TVs", slug: "smart-tvs" },
      { label: "OLED TVs", slug: "oled-tvs" },
      { label: "4K TVs", slug: "4k-tvs" },
    ],
  },
  {
    icon: Camera,
    label: "Cameras",
    slug: "camera",
    subs: [
      { label: "DSLR", slug: "dslr" },
      { label: "Mirrorless", slug: "mirrorless" },
      { label: "Action Cameras", slug: "action-cameras" },
    ],
  },
  { icon: Headphones, label: "Audio", slug: "audio" },
  { icon: Gamepad2, label: "Consoles", slug: "console" },
  {
    icon: Plug,
    label: "Appliances",
    slug: "appliance",
    subs: [
      { label: "Home", slug: "home" },
      { label: "Kitchen", slug: "kitchen" },
      { label: "Personal", slug: "personal" },
    ],
  },
  {
    icon: Car,
    label: "Auto",
    slug: "auto",
    subs: [
      { label: "Cars", slug: "cars" },
      { label: "Bikes", slug: "bikes" },
      { label: "Scooters", slug: "scooters" },
      { label: "Electric Vehicles", slug: "electric-vehicles" },
    ],
  },
  { icon: LayoutGrid, label: "All", slug: "all" },
];

export default function CategoryStrip() {
  return (
    <div className="cat-strip-outer relative">
      <div className="cat-strip">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.slug}
              className="relative group"
            >
              <Link
                href={cat.slug === "all" ? "/search" : `/search?cat=${cat.slug}`}
                className="cat-strip-link"
              >
                <Icon size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
                {cat.label}
                {cat.subs && (
                  <ChevronDown
                    size={12}
                    className="ml-1 opacity-50 transition-transform duration-200 group-hover:rotate-180"
                  />
                )}
              </Link>

              {/* Dropdown – CSS-only via group-hover */}
              {cat.subs && (
                <div className="absolute top-full left-0 z-50 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200">
                  <div className="cat-dropdown">
                    {cat.subs.map((sub) => (
                      <Link
                        key={sub.slug}
                        href={`/search?category=${cat.slug}&sub=${sub.slug}`}
                        className="cat-dropdown-item"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
