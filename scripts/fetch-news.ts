#!/usr/bin/env tsx
/**
 * fetch-news.ts — Fetches real tech news from RSS feeds, filters for quality,
 * deduplicates, and writes to src/data/news.json.
 *
 * Usage: npm run fetch:news
 */

import Parser from "rss-parser";
import * as fs from "fs";
import * as path from "path";

// ──────────────────────────────────────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────────────────────────────────────

const RSS_SOURCES: { name: string; url: string; slug: string }[] = [
  { name: "GSMArena",        url: "https://www.gsmarena.com/rss-news-reviews.php3", slug: "gsmarena" },
  { name: "Android Authority", url: "https://www.androidauthority.com/feed/",       slug: "androidauthority" },
  { name: "XDA Developers",  url: "https://www.xda-developers.com/feed/",           slug: "xda-developers" },
  { name: "TechRadar",       url: "https://www.techradar.com/rss",                  slug: "techradar" },
  { name: "The Verge",       url: "https://www.theverge.com/rss/index.xml",         slug: "theverge" },
  { name: "CNET",            url: "https://www.cnet.com/rss/news/",                 slug: "cnet" },
  { name: "Tom's Hardware",  url: "https://www.tomshardware.com/feeds/all",         slug: "tomshardware" },
  { name: "Ars Technica",    url: "https://feeds.arstechnica.com/arstechnica/index", slug: "arstechnica" },
  { name: "9to5Google",      url: "https://9to5google.com/feed/",                   slug: "9to5google" },
  { name: "9to5Mac",         url: "https://9to5mac.com/feed/",                      slug: "9to5mac" },
];

const TECH_KEYWORDS = [
  "phone", "laptop", "tablet", "monitor", "router", "smartphone", "android",
  "ios", "samsung", "apple", "google", "nvidia", "intel", "amd", "qualcomm",
  "camera", "tv", "tech", "gadget", "review", "benchmark", "launch", "release",
  "update", "spec", "price", "deal", "pixel", "iphone", "galaxy", "macbook",
  "thinkpad", "gpu", "cpu", "processor", "chip", "snapdragon", "ryzen", "core",
  "foldable", "wearable", "smartwatch", "earbuds", "headphones", "speaker",
  "ssd", "ram", "motherboard", "keyboard", "mouse", "display", "oled", "amoled",
  "lcd", "wi-fi", "wifi", "bluetooth", "5g", "6g", "modem", "charging",
  "battery", "usb-c", "thunderbolt", "pc", "mac", "windows", "linux",
  "software", "app", "os", "ai", "machine learning", "robot", "drone",
  "tesla", "microsoft", "amazon", "meta", "openai", "oneplus", "xiaomi",
  "huawei", "oppo", "vivo", "realme", "nothing phone", "motorola", "sony",
  "lg", "asus", "lenovo", "dell", "hp", "acer", "msi", "razer",
  "playstation", "xbox", "nintendo", "steam", "gaming", "vr", "ar",
  "tv", "television", "streaming", "roku", "fire tv", "homekit",
  "smart home", "iot", "raspberry pi", "arduino", "esp32",
];

const REJECT_KEYWORDS = [
  "politics", "election", "congress", "senate", "trump", "biden", "democrat",
  "republican", "impeach", "war", "military", "troops", "bomb", "missile",
  "crime", "murder", "arrest", "jail", "prison", "shooting",
  "sports", "nba", "nfl", "mlb", "soccer", "football", "tennis", "olympics",
  "movie", "film", "actor", "actress", "hollywood", "oscar",
  "music", "album", "singer", "band", "concert", "spotify",
  "celebrity", "kardashian", "royal family", "wedding", "divorce",
  "weather", "hurricane", "tornado", "earthquake", "flood",
  "food", "recipe", "cooking", "restaurant", "chef",
  "facebook down", "instagram down", "twitter down",
  "stock market", "wall street", "dow jones", "nasdaq", "s&p 500",
  "cryptocurrency crash", "bitcoin crash", "nft crash",
  "quordle", "wordle", "connections", "crossword", "puzzle hints",
  "zodiac", "horoscope", "astrology",
  "bentley", "rolls-royce", "toyota", "honda", "ford", "chevrolet",
  "car and driver", "motortrend", "automotive",
  "glucose monitor", "health", "medical", "diet", "weight loss",
  "tiktok ban", "social media ban",
];

const MAX_AGE_DAYS = 7;
const MAX_ARTICLES  = 100;
const SIMILARITY_THRESHOLD = 0.80;

const OUTPUT_PATH = path.resolve(__dirname, "../src/data/news.json");

// ──────────────────────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────────────────────

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  dateLabel: string;
  tag: string;
  url: string;
  source: string;
  image: string;
}

interface ParsedArticle {
  title: string;
  excerpt: string;
  date: Date;
  url: string;
  source: string;
  image: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────

function stableId(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return "n" + String(Math.abs(hash));
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string): number {
  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  if (la === lb) return 1;
  const shorter = la.length < lb.length ? la : lb;
  const longer  = la.length >= lb.length ? la : lb;
  if (shorter.length === 0) return 1;
  // Dice coefficient on bigrams
  const bigramsA = new Map<string, number>();
  for (let i = 0; i < shorter.length - 1; i++) {
    const bg = shorter.slice(i, i + 2);
    bigramsA.set(bg, (bigramsA.get(bg) || 0) + 1);
  }
  let matches = 0;
  for (let i = 0; i < longer.length - 1; i++) {
    const bg = longer.slice(i, i + 2);
    const count = bigramsA.get(bg) || 0;
    if (count > 0) {
      bigramsA.set(bg, count - 1);
      matches++;
    }
  }
  return (2 * matches) / (shorter.length - 1 + longer.length - 1);
}

function isTechRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  return TECH_KEYWORDS.some((kw) => lower.includes(kw));
}

function shouldReject(text: string): boolean {
  const lower = text.toLowerCase();
  return REJECT_KEYWORDS.some((kw) => lower.includes(kw));
}

function inferTag(title: string, excerpt: string, source: string): string {
  const text = `${title} ${excerpt}`.toLowerCase();
  if (/phone|smartphone|iphone|galaxy|pixel|android|ios|mobile|cellphone/.test(text)) return "mobiles";
  if (/laptop|notebook|macbook|thinkpad|chromebook/.test(text)) return "laptops";
  if (/monitor|display|oled|lcd|ips/.test(text) && !/glucose/.test(text)) return "monitors";
  if (/router|wi-fi|wifi|mesh|network/.test(text)) return "routers";
  if (/tv|television|streaming|roku|fire tv/.test(text)) return "tvs";
  if (/car|ev |electric vehicle|tesla|toyota|ford|automotive/.test(text)) return "auto";
  if (/camera|photo|lens|dslr|mirrorless/.test(text)) return "cameras";
  if (/headphone|earbuds|speaker|audio|airpods/.test(text)) return "electronics";
  if (/gpu|cpu|processor|chip|motherboard|ram|ssd|pc build/.test(text)) return "electronics";
  if (/smart home|iot|smart lock|thermostat/.test(text)) return "electronics";
  if (/gaming|playstation|xbox|nintendo|steam/.test(text)) return "electronics";
  if (/wearable|smartwatch|watch|fitness tracker/.test(text)) return "electronics";
  return "tech";
}

function dateLabel(d: Date): string {
  const now  = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7)   return `${diff} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function extractImage(item: Parser.Item): string {
  // Try media:content, media:thumbnail, enclosure, then content-snippet img
  const anyItem = item as Record<string, unknown>;
  if (anyItem["media:content"] && typeof anyItem["media:content"] === "object") {
    const mc = anyItem["media:content"] as Record<string, unknown>;
    if (mc["$"] && typeof mc["$"] === "object") {
      const attrs = mc["$"] as Record<string, string>;
      if (attrs["url"]) return attrs["url"];
    }
  }
  if (anyItem["media:thumbnail"] && typeof anyItem["media:thumbnail"] === "object") {
    const mt = anyItem["media:thumbnail"] as Record<string, unknown>;
    if (mt["$"] && typeof mt["$"] === "object") {
      const attrs = mt["$"] as Record<string, string>;
      if (attrs["url"]) return attrs["url"];
    }
  }
  if (item.enclosure && item.enclosure.url) return item.enclosure.url;
  // Parse first <img> from content
  const content = item.contentSnippet || item.content || "";
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
  if (imgMatch) return imgMatch[1];
  // Fallback: picsum with seed from title
  const seed = Math.abs(Array.from(item.title || "").reduce((a, c) => a + c.charCodeAt(0), 0));
  return `https://picsum.photos/seed/${seed}/600/340`;
}

// ──────────────────────────────────────────────────────────────────────────────
// FETCH LOGIC
// ──────────────────────────────────────────────────────────────────────────────

async function fetchFeed(source: typeof RSS_SOURCES[0]): Promise<ParsedArticle[]> {
  const parser = new Parser({
    timeout: 15_000,
    headers: {
      "User-Agent": "PhoneHub-NewsBot/1.0 (+https://phonehub.vercel.app)",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
  });

  try {
    console.log(`  ⏳ Fetching ${source.name}...`);
    const feed = await parser.parseURL(source.url);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - MAX_AGE_DAYS);

    const articles: ParsedArticle[] = [];
    for (const item of feed.items) {
      if (!item.title) continue;
      const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
      if (isNaN(pubDate.getTime()) || pubDate < cutoff) continue;

      const excerpt = stripHtml(
        item.contentSnippet?.slice(0, 300) || item.content?.slice(0, 300) || item.title
      );
      const combinedText = `${item.title} ${excerpt}`;

      if (!isTechRelevant(combinedText)) continue;
      if (shouldReject(combinedText)) continue;

      articles.push({
        title:   stripHtml(item.title),
        excerpt: excerpt.slice(0, 200),
        date:    pubDate,
        url:     item.link || "",
        source:  source.name,
        image:   extractImage(item),
      });
    }

    console.log(`  ✅ ${source.name}: ${articles.length} relevant articles`);
    return articles;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ❌ ${source.name} failed: ${msg}`);
    return [];
  }
}

function deduplicate(articles: ParsedArticle[]): ParsedArticle[] {
  const seen: string[] = [];
  const result: ParsedArticle[] = [];

  for (const article of articles) {
    const isDupe = seen.some(
      (t) => similarity(t, article.title) >= SIMILARITY_THRESHOLD
    );
    if (!isDupe) {
      seen.push(article.title);
      result.push(article);
    }
  }

  return result;
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("📡 PhoneHub News Fetcher");
  console.log(`   Sources: ${RSS_SOURCES.length} | Max age: ${MAX_AGE_DAYS} days | Max articles: ${MAX_ARTICLES}`);
  console.log("");

  // Load existing news to merge (keep recent articles from previous runs)
  let existing: NewsArticle[] = [];
  try {
    existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf-8"));
    console.log(`📖 Loaded ${existing.length} existing articles from news.json`);
  } catch {
    console.log("📖 No existing news.json found — starting fresh");
  }

  // Fetch all feeds concurrently
  const fetchResults = await Promise.all(RSS_SOURCES.map(fetchFeed));
  const allNewArticles = fetchResults.flat();

  console.log("");
  console.log(`📊 Raw total: ${allNewArticles.length} articles from RSS feeds`);

  // Sort newest first, deduplicate, cap at MAX_ARTICLES
  allNewArticles.sort((a, b) => b.date.getTime() - a.date.getTime());
  const unique = deduplicate(allNewArticles);
  const capped = unique.slice(0, MAX_ARTICLES);

  console.log(`📊 After deduplication: ${unique.length} unique articles`);
  console.log(`📊 Final count (capped): ${capped.length} articles`);

  // Build output
  const output: NewsArticle[] = capped.map((a) => ({
    id:        stableId(a.url || a.title),
    title:     a.title,
    excerpt:   a.excerpt,
    date:      formatDate(a.date),
    dateLabel: dateLabel(a.date),
    tag:       inferTag(a.title, a.excerpt, a.source),
    url:       a.url,
    source:    a.source,
    image:     a.image,
  }));

  // Write output
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf-8");
  console.log("");
  console.log(`✅ Wrote ${output.length} articles to ${OUTPUT_PATH}`);
  console.log("");

  // Summary by source
  const bySource = new Map<string, number>();
  output.forEach((a) => bySource.set(a.source, (bySource.get(a.source) || 0) + 1));
  console.log("📋 Articles by source:");
  Array.from(bySource.entries()).sort((a, b) => b[1] - a[1]).forEach(([src, cnt]) => {
    console.log(`   ${src}: ${cnt}`);
  });

  // Summary by tag
  const byTag = new Map<string, number>();
  output.forEach((a) => byTag.set(a.tag, (byTag.get(a.tag) || 0) + 1));
  console.log("");
  console.log("🏷️  Articles by tag:");
  Array.from(byTag.entries()).sort((a, b) => b[1] - a[1]).forEach(([tag, cnt]) => {
    console.log(`   ${tag}: ${cnt}`);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
