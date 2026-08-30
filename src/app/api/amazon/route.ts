import { NextRequest, NextResponse } from "next/server";
import { getAmazonItem, searchAmazon, amazonSearchUrl } from "@/lib/amazon";

// GET /api/amazon?asin=B0...  → GetItems for one ASIN
// GET /api/amazon?q=iphone+17e  → SearchItems by keyword
// Always public-cache friendly; when creds missing returns { configured:false } + fallback link
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const asin = (url.searchParams.get("asin") || "").trim();
  const q = (url.searchParams.get("q") || url.searchParams.get("keyword") || "").trim();
  const headers = { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } as const;

  if (asin) {
    const item = await getAmazonItem(asin);
    if (!item) {
      return NextResponse.json({ configured: false, asin, url: `https://www.amazon.com/dp/${encodeURIComponent(asin)}`, item: null }, { headers });
    }
    return NextResponse.json({ configured: true, ...item }, { headers });
  }
  if (q) {
    const items = await searchAmazon(q, 5);
    if (!items.length) {
      return NextResponse.json({ configured: !!process.env.AMAZON_PARTNER_TAG, query: q, url: amazonSearchUrl(q), items: [] }, { headers });
    }
    return NextResponse.json({ configured: true, query: q, url: amazonSearchUrl(q), items }, { headers });
  }
  return NextResponse.json({ error: "Provide ?asin=ASIN or ?q=keyword" }, { status: 400 });
}
