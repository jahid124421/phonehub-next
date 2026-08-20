import 'dotenv/config'
import { PrismaClient } from '@/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import * as fs from 'fs'
import * as path from 'path'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const DATA_DIR = path.resolve(__dirname, '../data')

// ---------- helpers ----------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function extractYear(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const match = dateStr.match(/\b(\d{4})\b/)
  return match ? parseInt(match[1], 10) : null
}

async function batchProcess<T>(
  items: T[],
  batchSize: number,
  label: string,
  fn: (batch: T[]) => Promise<unknown>,
): Promise<void> {
  const total = items.length
  for (let i = 0; i < total; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    await fn(batch)
    const done = Math.min(i + batchSize, total)
    console.log(`  [${label}] ${done}/${total}`)
  }
}

// ---------- seeders ----------

async function seedCategories(): Promise<Map<string, number>> {
  console.log('\n📁 Seeding categories...')
  const defaults = [
    { slug: 'phone', name: 'Phones', icon: '📱' },
    { slug: 'laptop', name: 'Laptops', icon: '💻' },
    { slug: 'smartwatch', name: 'Smartwatches', icon: '⌚' },
    { slug: 'tablet', name: 'Tablets', icon: '📋' },
    { slug: 'tv', name: 'TVs', icon: '📺' },
    { slug: 'camera', name: 'Cameras', icon: '📷' },
    { slug: 'auto', name: 'Auto', icon: '🚗' },
  ]

  const map = new Map<string, number>()
  for (const cat of defaults) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon },
      create: cat,
    })
    map.set(cat.slug, created.id)
  }
  console.log(`  ✅ ${defaults.length} categories upserted`)
  return map
}

async function seedBrands(): Promise<void> {
  console.log('\n🏷️  Seeding brands...')
  const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'brands.json'), 'utf8')) as Array<{
    id: string
    name: string
    logo?: string
    color?: string
    category?: string
    sub_categories?: string[]
  }>

  await batchProcess(raw, 100, 'brands', async (batch) => {
    await Promise.all(
      batch.map((b) =>
        prisma.brand.upsert({
          where: { id: b.id },
          update: {
            name: b.name,
            logoUrl: b.logo ?? null,
            color: b.color?.slice(0, 7) ?? null,
            category: b.category ?? 'Other',
            subCategories: b.sub_categories ?? [],
          },
          create: {
            id: b.id,
            name: b.name,
            logoUrl: b.logo ?? null,
            color: b.color?.slice(0, 7) ?? null,
            category: b.category ?? 'Other',
            subCategories: b.sub_categories ?? [],
          },
        }),
      ),
    )
  })
  console.log(`  ✅ ${raw.length} brands done`)
}

async function seedProducts(categoryMap: Map<string, number>): Promise<void> {
  console.log('\n📦 Seeding products...')
  const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'products.json'), 'utf8')) as Array<{
    id: string
    brand: string
    name: string
    category?: string
    image?: string
    fallbackImg?: string
    releaseDate?: string
    basePrice?: number
    popularity?: number
    rating?: number
    reviewCount?: number
    review?: string
    quickSpecs?: Record<string, string>
    pros?: string[]
    cons?: string[]
  }>

  await batchProcess(raw, 100, 'products', async (batch) => {
    await Promise.all(
      batch.map((p) => {
        const categoryId = p.category ? categoryMap.get(p.category) ?? null : null
        const releaseYear = extractYear(p.releaseDate)

        return prisma.product.upsert({
          where: { id: p.id },
          update: {
            brandId: p.brand,
            name: p.name,
            slug: p.id,
            imageUrl: p.image ?? null,
            fallbackImg: p.fallbackImg ?? null,
            releaseDate: p.releaseDate ?? null,
            releaseYear,
            basePrice: p.basePrice ?? 0,
            popularity: p.popularity ?? 60,
            rating: p.rating ?? 4.0,
            reviewCount: p.reviewCount ?? 0,
            reviewText: p.review ?? null,
            pros: p.pros ?? [],
            cons: p.cons ?? [],
            quickSpecs: p.quickSpecs ?? {},
            categoryId,
          },
          create: {
            id: p.id,
            brandId: p.brand,
            name: p.name,
            slug: p.id,
            imageUrl: p.image ?? null,
            fallbackImg: p.fallbackImg ?? null,
            releaseDate: p.releaseDate ?? null,
            releaseYear,
            basePrice: p.basePrice ?? 0,
            popularity: p.popularity ?? 60,
            rating: p.rating ?? 4.0,
            reviewCount: p.reviewCount ?? 0,
            reviewText: p.review ?? null,
            pros: p.pros ?? [],
            cons: p.cons ?? [],
            quickSpecs: p.quickSpecs ?? {},
            categoryId,
          },
        })
      }),
    )
  })
  console.log(`  ✅ ${raw.length} products done`)
}

async function seedSpecs(): Promise<void> {
  console.log('\n🔧 Seeding product specs...')
  const raw = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'specs.json'), 'utf8'),
  ) as Record<string, Record<string, Record<string, string>>>

  // Map JSON section keys → Prisma column names
  const sectionMap: Record<string, string> = {
    Network: 'network',
    Launch: 'launch',
    Body: 'body',
    Display: 'display',
    Platform: 'platform',
    Memory: 'memory',
    'Main Camera': 'mainCamera',
    'Selfie camera': 'selfieCamera',
    'Selfie Camera': 'selfieCamera',
    Sound: 'sound',
    Comms: 'comms',
    Features: 'features',
    Battery: 'battery',
    Misc: 'misc',
  }

  const entries = Object.entries(raw)

  // First verify which products exist in DB so we don't orphan specs
  const productIds = new Set(
    (await prisma.product.findMany({ select: { id: true } })).map((p: { id: string }) => p.id),
  )

  const validEntries = entries.filter(([productId]) => productIds.has(productId))
  console.log(`  Found ${validEntries.length} specs matching existing products (skipped ${entries.length - validEntries.length})`)

  await batchProcess(validEntries, 100, 'specs', async (batch) => {
    await Promise.all(
      batch.map(([productId, sections]) => {
        const data: Record<string, unknown> = {}
        for (const [key, prismaCol] of Object.entries(sectionMap)) {
          data[prismaCol] = sections[key] ?? {}
        }

        return prisma.productSpec.upsert({
          where: { productId },
          update: data,
          create: { productId, ...data },
        })
      }),
    )
  })
  console.log(`  ✅ ${validEntries.length} specs done`)
}

async function seedStores(): Promise<void> {
  console.log('\n🏪 Seeding stores...')
  const raw = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'stores.json'), 'utf8'),
  ) as string[]

  for (const name of raw) {
    const slug = slugify(name)
    await prisma.store.upsert({
      where: { name },
      update: { slug },
      create: { name, slug },
    })
  }
  console.log(`  ✅ ${raw.length} stores upserted`)
}

async function seedNews(): Promise<void> {
  console.log('\n📰 Seeding news...')
  const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'news.json'), 'utf8')) as Array<{
    id: string
    title: string
    excerpt?: string
    date?: string
    dateLabel?: string
    tag?: string
    url: string
    source?: string
    image?: string
  }>

  await batchProcess(raw, 100, 'news', async (batch) => {
    await Promise.all(
      batch.map((n) => {
        const publishedDate = n.date ? new Date(n.date) : null
        return prisma.news.upsert({
          where: { id: n.id },
          update: {
            title: n.title,
            excerpt: n.excerpt ?? null,
            url: n.url,
            source: n.source ?? null,
            tag: n.tag ?? 'tech',
            imageUrl: n.image ?? null,
            publishedDate,
            dateLabel: n.dateLabel ?? null,
          },
          create: {
            id: n.id,
            title: n.title,
            excerpt: n.excerpt ?? null,
            url: n.url,
            source: n.source ?? null,
            tag: n.tag ?? 'tech',
            imageUrl: n.image ?? null,
            publishedDate,
            dateLabel: n.dateLabel ?? null,
          },
        })
      }),
    )
  })
  console.log(`  ✅ ${raw.length} news articles done`)
}

// ---------- main ----------

async function main(): Promise<void> {
  console.log('🚀 PhoneHub Next – Data Seed')
  console.log(`   DATA_DIR: ${DATA_DIR}`)

  // 1. Categories first (products reference them)
  const categoryMap = await seedCategories()

  // 2. Brands (products reference them)
  await seedBrands()

  // 3. Products
  await seedProducts(categoryMap)

  // 4. Specs
  await seedSpecs()

  // 5. Stores
  await seedStores()

  // 6. News
  await seedNews()

  // Summary counts
  const [brandCount, categoryCount, productCount, specCount, storeCount, newsCount] =
    await Promise.all([
      prisma.brand.count(),
      prisma.category.count(),
      prisma.product.count(),
      prisma.productSpec.count(),
      prisma.store.count(),
      prisma.news.count(),
    ])

  console.log('\n✅ Seed complete!')
  console.log(`   Brands:     ${brandCount}`)
  console.log(`   Categories: ${categoryCount}`)
  console.log(`   Products:   ${productCount}`)
  console.log(`   Specs:      ${specCount}`)
  console.log(`   Stores:     ${storeCount}`)
  console.log(`   News:       ${newsCount}`)
}

main()
  .catch((e) => {
    console.error('\n❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
