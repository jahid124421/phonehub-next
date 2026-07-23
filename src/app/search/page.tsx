import type { Metadata } from "next";
import { getAllProducts, getAllBrands } from "@/lib/data";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "Search",
  description: "Browse and filter all products by brand, price and rating.",
};

export default function SearchPage() {
  const products = getAllProducts();
  const brands = getAllBrands();
  return <SearchClient initialProducts={products} initialBrands={brands} />;
}
