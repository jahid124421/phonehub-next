import Link from "next/link";
import { Suspense } from "react";
import { getAllBrands, getAllProducts, type Brand } from "@/lib/data";
import { SITE_URL } from "@/lib/config";
import Breadcrumb from "@/components/Breadcrumb";
import CategoryStrip from "@/components/CategoryStrip";

export const metadata = {
  title: "Brands",
  description: "Browse phones by brand.",
  openGraph: {
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'PhoneHub Brands' }],
  },
};

const categoryOrder = [
  "Mobile",
  "Laptop",
  "Electronics",
  "Computers",
  "TVs",
  "Auto",
  "Other",
];

const CATEGORY_LABELS: Record<string, { singular: string; plural: string }> = {
  Mobile: { singular: "phone", plural: "phones" },
  Laptop: { singular: "laptop", plural: "laptops" },
  Electronics: { singular: "device", plural: "devices" },
  Computers: { singular: "device", plural: "devices" },
  TVs: { singular: "TV", plural: "TVs" },
  Auto: { singular: "vehicle", plural: "vehicles" },
  Other: { singular: "product", plural: "products" },
};

/** Filter function: does this product belong to the brand's category? */
function productMatchesCategory(productCat: string, brandCategory: string): boolean {
  switch (brandCategory) {
    case "Mobile":
      return ["phone", "tablet", "smartwatch"].includes(productCat);
    case "Laptop":
      return productCat === "laptop";
    case "Electronics":
      return productCat !== "auto" && productCat !== "phone";
    case "Computers":
      return productCat === "laptop";
    case "TVs":
      return productCat === "tv";
    case "Auto":
      return productCat === "auto";
    case "Other":
    default:
      return true; // catch-all: count all products
  }
}

function BrandTile({ brand, count }: { brand: Brand; count: number }) {
  const isAuto = brand.category === "Auto";
  const href = isAuto
    ? `/search?brand=${brand.id}&cat=auto`
    : `/search?brand=${brand.id}`;
  const labels = CATEGORY_LABELS[brand.category] || CATEGORY_LABELS.Other;
  const label = `${count} ${count === 1 ? labels.singular : labels.plural}`;
  const isEmojiLogo = brand.logo && (brand.logo.startsWith("📱") || brand.logo.length <= 4);

  return (
    <Link
      href={href}
      className="card card-compact bg-base-200 border border-base-300 hover:border-primary transition-all items-center text-center p-3 gap-2"
    >
      <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-white ring-1 ring-base-300 shrink-0">
        {!isEmojiLogo && brand.logo ? (
          <img
            src={brand.logo}
            alt={brand.name}
            className="w-10 h-10 object-contain"
            loading="lazy"
          />
        ) : (
          <span
            className="w-full h-full flex items-center justify-center text-xl font-bold text-white rounded-full"
            style={{ backgroundColor: brand.color || "#5b8cff" }}
          >
            {brand.name.charAt(0)}
          </span>
        )}
      </div>
      <div className="text-sm font-medium leading-tight">{brand.name}</div>
      <div className="text-sm text-base-content/60">{label}</div>
    </Link>
  );
}

export default function BrandsPage() {
  const brands = getAllBrands();
  const products = getAllProducts();

  // Group brands by category
  const brandsByCategory: Record<string, Brand[]> = {};
  brands.forEach((b) => {
    const cat = b.category || "Other";
    if (!brandsByCategory[cat]) brandsByCategory[cat] = [];
    brandsByCategory[cat].push(b);
  });

  return (
    <>
      <Suspense fallback={<div className="cat-strip-outer"><div className="cat-strip">Loading categories…</div></div>}>
        <CategoryStrip />
      </Suspense>
      <main className="container mx-auto px-4 py-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Brands" }]} />
        <h1 className="text-3xl font-bold mt-4 mb-6">All Brands</h1>

      <div className="flex flex-col gap-10">
        {categoryOrder.map((category) => {
          const catBrands = brandsByCategory[category];
          if (!catBrands || catBrands.length === 0) return null;

          return (
            <div key={category}>
              <h3 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-primary/40" style={{ color: "var(--text)" }}>
                {category}
              </h3>
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}
              >
                {catBrands.map((brand) => {
                  const count = products.filter((p) =>
                    p.brand === brand.id && productMatchesCategory(p.category, brand.category)
                  ).length;
                  return (
                    <BrandTile
                      key={brand.id}
                      brand={brand}
                      count={count}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
        </div>
      </main>
    </>
  );
}
