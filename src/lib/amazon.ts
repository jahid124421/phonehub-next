// server-only — Amazon Product Advertising API 5.0 (PA-API 5.0)
// Docs: https://webservices.amazon.com/paapi5/documentation/
// Required env (server only, never exposed to browser):
//   AMAZON_ACCESS_KEY  — AWS Access Key ID (IAM user with ProductAdvertisingAPI permission)
//   AMAZON_SECRET_KEY  — AWS Secret Access Key
//   AMAZON_PARTNER_TAG — Associates Store ID / AssociateTag, e.g. phonehub-20
// Optional:
//   AMAZON_HOST   — default webservices.amazon.com
//   AMAZON_REGION — default us-east-1
// If any required var is missing, every helper returns null/[] gracefully
// so the site stays zero-env and never throws at build time.

import crypto from "crypto";

const HOST = process.env.AMAZON_HOST || "webservices.amazon.com";
const REGION = process.env.AMAZON_REGION || "us-east-1";
const SERVICE = "ProductAdvertisingAPI";
const TARGET_GET = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems";
const TARGET_SEARCH = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems";

function hasCreds(): boolean {
  return Boolean(process.env.AMAZON_ACCESS_KEY && process.env.AMAZON_SECRET_KEY && process.env.AMAZON_PARTNER_TAG);
}

function amzDate(d = new Date()): { amz: string; date: string } {
  const iso = d.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  // iso = YYYYMMDDTHHMMSSZ
  return { amz: iso, date: iso.slice(0, 8) };
}
function sha256Hex(s: string): string {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}
function hmac(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

function signHeaders(payload: string, target: string): Record<string, string> {
  const { amz, date } = amzDate();
  const access = process.env.AMAZON_ACCESS_KEY!;
  const secret = process.env.AMAZON_SECRET_KEY!;
  const host = HOST;
  const payloadHash = sha256Hex(payload);
  const canonicalHeaders = `content-encoding:amz-1.0\nhost:${host}\nx-amz-date:${amz}\nx-amz-target:${target}\n`;
  const signedHeaders = "content-encoding;host;x-amz-date;x-amz-target";
  // canonical request needs content-type header? PA-API docs include it optionally.
  // We keep the minimal set above and payloadHash; content-type is not signed.
  const canonicalRequest = [
    "POST",
    target.includes("GetItems") ? "/paapi5/getitems" : "/paapi5/searchitems",
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${date}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amz, credentialScope, sha256Hex(canonicalRequest)].join("\n");

  const kDate = hmac("AWS4" + secret, date);
  const kRegion = hmac(kDate, REGION);
  const kService = hmac(kRegion, SERVICE);
  const kSigning = hmac(kService, "aws4_request");
  const signature = hmac(kSigning, stringToSign).toString("hex");

  const auth = `AWS4-HMAC-SHA256 Credential=${access}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return {
    host,
    "x-amz-date": amz,
    "x-amz-target": target,
    "content-encoding": "amz-1.0",
    "content-type": "application/json; charset=utf-8",
    Authorization: auth,
  };
}

export type AmazonItem = {
  asin: string;
  title: string;
  image: string | null; // Large image URL
  price: { amount: number; currency: string; display: string } | null;
  url: string; // amazon detail page with tag
};

function partnerTag(): string {
  return process.env.AMAZON_PARTNER_TAG || "";
}

function detailUrl(asin: string): string {
  const tag = partnerTag();
  return tag ? `https://www.amazon.com/dp/${asin}?tag=${encodeURIComponent(tag)}` : `https://www.amazon.com/dp/${asin}`;
}
export function amazonSearchUrl(query: string): string {
  const tag = partnerTag();
  const q = encodeURIComponent(query);
  return tag ? `https://www.amazon.com/s?k=${q}&tag=${encodeURIComponent(tag)}` : `https://www.amazon.com/s?k=${q}`;
}

function parsePrice(offer: any): AmazonItem["price"] {
  try {
    const listing = offer?.Offers?.Listings?.[0] || offer?.Listing || null;
    const p = listing?.Price || offer?.Price || null;
    if (!p?.Amount || !p?.Currency) return null;
    return { amount: Number(p.Amount), currency: String(p.Currency), display: String(p.DisplayAmount || `$${p.Amount}`) };
  } catch { return null; }
}
function parseItem(raw: any): AmazonItem | null {
  try {
    const asin: string = raw?.ASIN || raw?.asin || "";
    if (!asin) return null;
    const title: string = raw?.ItemInfo?.Title?.DisplayValue || raw?.title || asin;
    const img: string | null =
      raw?.Images?.Primary?.Large?.URL ||
      raw?.Images?.Primary?.Medium?.URL ||
      raw?.Images?.Primary?.Small?.URL ||
      null;
    const price = parsePrice(raw) || null;
    return { asin, title, image: img, price, url: detailUrl(asin) };
  } catch { return null; }
}

async function paapiFetch(path: string, target: string, body: Record<string, unknown>): Promise<any> {
  if (!hasCreds()) return null;
  const payload = JSON.stringify(body);
  const headers = signHeaders(payload, target);
  const url = `https://${HOST}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: payload,
    // PA-API is server-only; short timeout
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.warn(`[amazon] PA-API ${target} ${res.status}: ${txt.slice(0, 400)}`);
    return null;
  }
  return res.json().catch(() => null);
}

export async function getAmazonItem(asin: string): Promise<AmazonItem | null> {
  if (!asin || !hasCreds()) return null;
  const data = await paapiFetch("/paapi5/getitems", TARGET_GET, {
    PartnerTag: partnerTag(),
    PartnerType: "Associates",
    Marketplace: "www.amazon.com",
    ItemIds: [asin],
    ItemIdType: "ASIN",
    Resources: [
      "Images.Primary.Large",
      "Images.Primary.Medium",
      "ItemInfo.Title",
      "Offers.Listings.Price",
    ],
  });
  const raw = data?.ItemsResult?.Items?.[0] || data?.Items?.[0] || null;
  return raw ? parseItem(raw) : null;
}

export async function searchAmazon(keyword: string, count = 1): Promise<AmazonItem[]> {
  if (!keyword || !hasCreds()) return [];
  const data = await paapiFetch("/paapi5/searchitems", TARGET_SEARCH, {
    PartnerTag: partnerTag(),
    PartnerType: "Associates",
    Marketplace: "www.amazon.com",
    Keywords: keyword,
    SearchIndex: "All",
    ItemCount: Math.min(Math.max(count, 1), 10),
    Resources: [
      "Images.Primary.Large",
      "Images.Primary.Medium",
      "ItemInfo.Title",
      "Offers.Listings.Price",
    ],
  });
  const items: any[] = data?.SearchResult?.Items || data?.Items || [];
  return items.map(parseItem).filter(Boolean) as AmazonItem[];
}

// Whether live Amazon is configured (for UI badges / price honesty)
export function amazonConfigured(): boolean {
  return hasCreds();
}
