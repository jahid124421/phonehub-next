import { getAllNews } from "@/lib/data";
import NewsClient from "./NewsClient";

export const metadata = {
  title: "News",
  description: "Latest tech news, buying guides and comparisons.",
};

export default function NewsPage() {
  const news = getAllNews();
  return <NewsClient allNews={news} />;
}
