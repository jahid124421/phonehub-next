export interface UserReview {
  productId: string;
  ratings: {
    display: number;   // 1-5
    camera: number;
    battery: number;
    performance: number;
    value: number;
  };
  overall: number;     // average of above
  comment: string;
  date: string;
  author: string;
}

const STORAGE_KEY = 'phonehub_reviews';

export function getReviewsForProduct(productId: string): UserReview[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const allReviews: UserReview[] = JSON.parse(stored);
    return allReviews
      .filter(r => r.productId === productId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch {
    return [];
  }
}

export function addReview(review: UserReview): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allReviews: UserReview[] = stored ? JSON.parse(stored) : [];
    allReviews.push(review);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allReviews));
  } catch (e) {
    console.error('Failed to save review:', e);
  }
}

export function getAverageRatings(productId: string): {
  display: number;
  camera: number;
  battery: number;
  performance: number;
  value: number;
  overall: number;
} | null {
  const reviews = getReviewsForProduct(productId);
  if (reviews.length === 0) return null;

  const totals = {
    display: 0,
    camera: 0,
    battery: 0,
    performance: 0,
    value: 0,
    overall: 0,
  };

  reviews.forEach(r => {
    totals.display += r.ratings.display;
    totals.camera += r.ratings.camera;
    totals.battery += r.ratings.battery;
    totals.performance += r.ratings.performance;
    totals.value += r.ratings.value;
    totals.overall += r.overall;
  });

  const count = reviews.length;
  return {
    display: totals.display / count,
    camera: totals.camera / count,
    battery: totals.battery / count,
    performance: totals.performance / count,
    value: totals.value / count,
    overall: totals.overall / count,
  };
}
