const categoryMap: Record<string, string> = {
  phone: 'Phones',
  laptop: 'Laptops',
  smartwatch: 'Watches',
  tablet: 'Tablets',
  tv: 'TVs',
  camera: 'Cameras',
  auto: 'Cars',
};

const categoryIcons: Record<string, string> = {
  phone: '📱',
  laptop: '💻',
  smartwatch: '⌚',
  tablet: '📱',
  tv: '📺',
  camera: '📷',
  auto: '🚗',
  audio: '🎧',
  gaming: '🎮',
};

export function formatPrice(price: number): string {
  if (!price || price === 0) return 'Check price';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatRating(rating: number): string {
  if (!rating) return '0';
  return rating.toFixed(1);
}

export function formatCount(count: number): string {
  if (!count) return '0';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export function formatDate(date: string): string {
  if (!date) return '';
  // Handle "Released 2026, March 11" format
  const releasedMatch = date.match(/Released\s+(\d{4}),?\s+(\w+)(?:\s+\d+)?/);
  if (releasedMatch) {
    return `${releasedMatch[2]} ${releasedMatch[1]}`;
  }
  // Handle ISO date "2025-10-01"
  const isoMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  return date;
}

export function getCategoryLabel(cat: string): string {
  return categoryMap[cat] || cat;
}

export function getCategoryIcon(cat: string): string {
  return categoryIcons[cat] || '📦';
}

export function formatNewsDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
