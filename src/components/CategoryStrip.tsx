import Link from "next/link";

const CATEGORIES = [
  { emoji: "📱", label: "Phones", slug: "phone" },
  { emoji: "📋", label: "Tablets", slug: "tablet" },
  { emoji: "💻", label: "Laptops", slug: "laptop" },
  { emoji: "⌚", label: "Watches", slug: "smartwatch" },
  { emoji: "📺", label: "TVs", slug: "tv" },
  { emoji: "📷", label: "Cameras", slug: "camera" },
  { emoji: "🎧", label: "Audio", slug: "audio" },
  { emoji: "🎮", label: "Consoles", slug: "console" },
  { emoji: "🔌", label: "Appliances", slug: "appliance" },
  { emoji: "🚗", label: "Auto", slug: "auto" },
  { emoji: "🗂️", label: "All", slug: "all" },
];

export default function CategoryStrip() {
  return (
    <div className="cat-strip-outer">
      <div className="cat-strip">
        {CATEGORIES.map((cat) => (
          <Link key={cat.slug} href={`/search?cat=${cat.slug}`}>
            <span style={{ marginRight: 6 }}>{cat.emoji}</span>
            {cat.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
