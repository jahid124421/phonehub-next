import { MetadataRoute } from 'next'
import { getAllProducts } from '@/lib/data'
import { SITE_URL } from '@/lib/config'
import { ALL_CATEGORY_SLUGS } from '@/lib/categories'
import { getAllBestPages } from '@/lib/best-pages'
import { getStaticVsSlugs } from '@/app/vs/[slug]/page'

const BASE_URL = SITE_URL

export default function sitemap(): MetadataRoute.Sitemap {
  const products = getAllProducts()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/brands`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/news`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/compare`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/ai-finder`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/advanced-finder`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/upcoming`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/deals`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/guides`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/developers`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/benchmarks`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/tools`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.1 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.1 },
    { url: `${BASE_URL}/disclosure`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.1 },
  ]

  // Category pages
  const categories = ALL_CATEGORY_SLUGS
  const categoryRoutes: MetadataRoute.Sitemap = categories.map(cat => ({
    url: `${BASE_URL}/search?cat=${cat}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  // Best-of landing pages
  const bestRoutes: MetadataRoute.Sitemap = getAllBestPages().map(d => ({
    url: `${BASE_URL}/best/${d.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Head-to-head comparison pages (statically generated pairs)
  const vsRoutes: MetadataRoute.Sitemap = getStaticVsSlugs().map(slug => ({
    url: `${BASE_URL}/vs/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Product pages
  const productRoutes: MetadataRoute.Sitemap = products.map(p => ({
    url: `${BASE_URL}/phone/${p.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...categoryRoutes, ...bestRoutes, ...vsRoutes, ...productRoutes]
}
