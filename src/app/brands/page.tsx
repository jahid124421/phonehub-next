import Link from "next/link";
import { getAllBrands, getAllProducts, type Brand } from "@/lib/data";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata = {
  title: "Brands",
  description: "Browse phones by brand.",
};

const categoryOrder = [
  "Mobiles",
  "Laptops",
  "Electronics",
  "Computers",
  "TVs",
  "Auto",
  "Other",
];

function BrandTile({ brand, count, isAuto }: { brand: Brand; count: number; isAuto: boolean }) {
  const href = isAuto
    ? `/search?brand=${brand.id}&cat=auto`
    : `/search?brand=${brand.id}`;
  const label = isAuto ? `${count} vehicles` : `${count} phones`;
  const isEmojiLogo = brand.logo && (brand.logo.startsWith("📱") || brand.logo.length <= 4);

  return (
    <Link
      href={href}
      className="card card-compact bg-base-200 border border-base-300 hover:border-primary transition-all items-center text-center p-3 gap-2"
    >
      <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-base-300 shrink-0">
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
      <div className="text-xs text-base-content/60">{label}</div>
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
    <main className="container mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Brands" }]} />
      <h1 className="text-3xl font-bold mt-4 mb-6">All Brands</h1>

      <div className="flex flex-col gap-10">
        {categoryOrder.map((category) => {
          const catBrands = brandsByCategory[category];
          if (!catBrands || catBrands.length === 0) return null;

          return (
            <div key={category}>
              <h3 className="text-xl font-semibold mb-4">{category}</h3>
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}
              >
                {catBrands.map((brand) => {
                  const isAuto = brand.category === "Auto";
                  const count = products.filter((p) => {
                    if (isAuto) return p.brand === brand.id && p.category === "auto";
                    return p.brand === brand.id && p.category !== "auto";
                  }).length;
                  return (
                    <BrandTile
                      key={brand.id}
                      brand={brand}
                      count={count}
                      isAuto={isAuto}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
