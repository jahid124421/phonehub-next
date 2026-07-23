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
    url: 'https://jahid124421.github.io/phonehub/',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://jahid124421.github.io/phonehub/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
}

export function brandSchema(brand: any): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Brand',
    name: brand.name,
    url: `https://jahid124421.github.io/phonehub/search?brand=${brand.id}`,
    image: brand.logo,
  };
}

export function organizationSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PhoneHub',
    url: 'https://jahid124421.github.io/phonehub/',
    logo: 'https://jahid124421.github.io/phonehub/favicon.svg',
    sameAs: [],
    description:
      'PhoneHub is a free product comparison platform helping users find, compare, and decide on phones, laptops, cars, and more.',
  };
}
