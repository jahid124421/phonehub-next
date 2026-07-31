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
  Monitor,
  Wifi,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";

export interface SubCat {
  label: string;
  slug: string;
}

export interface CatItem {
  icon: LucideIcon;
  label: string;
  slug: string;
  subs?: SubCat[];
}

export const CATEGORIES: CatItem[] = [
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
  {
    icon: Monitor,
    label: "Monitors",
    slug: "monitor",
    subs: [
      { label: "Gaming Monitors", slug: "gaming-monitors" },
      { label: "4K Monitors", slug: "4k-monitors" },
      { label: "Ultrawide", slug: "ultrawide-monitors" },
    ],
  },
  {
    icon: Wifi,
    label: "Routers",
    slug: "router",
    subs: [
      { label: "Wi-Fi 6", slug: "wifi-6" },
      { label: "Wi-Fi 7", slug: "wifi-7" },
      { label: "Mesh Systems", slug: "mesh-routers" },
    ],
  },
  { icon: LayoutGrid, label: "All", slug: "all" },
];

// Lookup helpers
export function getCategoryBySlug(slug: string): CatItem | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getCategoryLabel(slug: string): string {
  return getCategoryBySlug(slug)?.label ?? slug;
}

export function getCategoryIcon(slug: string): LucideIcon | undefined {
  return getCategoryBySlug(slug)?.icon;
}

export const ALL_CATEGORY_SLUGS: string[] = CATEGORIES.map((c) => c.slug);
