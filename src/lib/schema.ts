import { SITE_URL } from '@/lib/config';

export function productSchema(product: any): object {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image || product.fallbackImg,
    description:
      product.review?.substring(0, 300) ||
      `${product.name} by ${product.brand}. Check specs, ratings, and prices on PhoneHub.`,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    category: product.category,
    sku: product.id,
  };

  if (product.rating && product.rating > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount || 0,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (product.review) {
    schema.review = {
      '@type': 'Review',
      reviewBody: product.review,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: product.rating || 0,
        bestRating: 5,
      },
    };
  }

  if (product.basePrice && product.basePrice > 0) {
    schema.offers = {
      '@type': 'Offer',
      price: product.basePrice,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    };
  }

  return schema;
}

export function breadcrumbSchema(items: { name: string; url: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function websiteSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PhoneHub',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function brandSchema(brand: any): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Brand',
    name: brand.name,
    url: `${SITE_URL}/search?brand=${brand.id}`,
    image: brand.logo,
  };
}

export function organizationSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PhoneHub',
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    sameAs: [],
    description:
      'PhoneHub is a free product comparison platform helping users find, compare, and decide on phones, laptops, cars, and more.',
  };
}

export function articleSchema(article: any): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description || article.excerpt || '',
    image: article.image || '',
    datePublished: article.date || article.publishedAt || '',
    author: {
      '@type': 'Organization',
      name: 'PhoneHub',
    },
    publisher: {
      '@type': 'Organization',
      name: 'PhoneHub',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/favicon.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/news/${article.slug || article.id}`,
    },
  };
}

export function itemListSchema(name: string, items: any[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name || item.title,
      url: item.url || `${SITE_URL}/phone/${item.id}`,
    })),
  };
}
