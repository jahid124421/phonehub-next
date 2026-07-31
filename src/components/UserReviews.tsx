"use client";

import { useState, useEffect } from "react";
import type { UserReview } from "@/lib/reviews";
import { getReviewsForProduct, getAverageRatings } from "@/lib/reviews";
import ReviewForm from "./ReviewForm";

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const stars = [];
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  const sizeClass = size === "md" ? "w-5 h-5" : "w-4 h-4";

  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(
        <svg key={i} className={`${sizeClass} text-warning fill-warning`} viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    } else if (i === full && hasHalf) {
      stars.push(
        <svg key={i} className={`${sizeClass} text-warning`} viewBox="0 0 24 24">
          <defs>
            <linearGradient id={`half-star-${i}`}>
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            fill={`url(#half-star-${i})`}
            stroke="currentColor"
            strokeWidth={1}
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        </svg>
      );
    } else {
      stars.push(
        <svg key={i} className={`${sizeClass} text-base-content/20`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    }
  }
  return <div className="flex">{stars}</div>;
}

function RatingBar({ label, value }: { label: string; value: number }) {
  const percentage = (value / 5) * 100;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="min-w-[90px] text-base-content/70">{label}</span>
      <div className="flex-1 bg-base-300 rounded-full h-2">
        <div
          className="h-full rounded-full bg-warning transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="min-w-[32px] text-right font-semibold">{value.toFixed(1)}</span>
    </div>
  );
}

export default function UserReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [averages, setAverages] = useState<ReturnType<typeof getAverageRatings>>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setReviews(getReviewsForProduct(productId));
    setAverages(getAverageRatings(productId));
  }, [productId]);

  const handleReviewSuccess = () => {
    setShowForm(false);
    setReviews(getReviewsForProduct(productId));
    setAverages(getAverageRatings(productId));
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">User Reviews</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
            Write a Review
          </button>
        )}
      </div>

      {showForm && (
        <ReviewForm
          productId={productId}
          onSuccess={handleReviewSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {averages && (
        <div className="rounded-xl bg-base-200 border border-base-300 p-5 space-y-3">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl font-bold text-warning">{averages.overall.toFixed(1)}</div>
            <div>
              <StarDisplay rating={averages.overall} size="md" />
              <div className="text-sm text-base-content/60 mt-1">
                Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <RatingBar label="Display" value={averages.display} />
            <RatingBar label="Camera" value={averages.camera} />
            <RatingBar label="Battery" value={averages.battery} />
            <RatingBar label="Performance" value={averages.performance} />
            <RatingBar label="Value" value={averages.value} />
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-12 text-base-content/50">
          <div className="text-4xl mb-3">📝</div>
          <p className="font-medium">No reviews yet — be the first!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, idx) => (
            <div key={idx} className="rounded-xl bg-base-200 border border-base-300 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold">{review.author}</div>
                  <div className="text-xs text-base-content/50">
                    {new Date(review.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <StarDisplay rating={review.overall} />
                    <span className="font-bold text-lg">{review.overall.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-base-content/60">Display:</span>
                  <StarDisplay rating={review.ratings.display} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base-content/60">Camera:</span>
                  <StarDisplay rating={review.ratings.camera} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base-content/60">Battery:</span>
                  <StarDisplay rating={review.ratings.battery} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base-content/60">Perf:</span>
                  <StarDisplay rating={review.ratings.performance} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base-content/60">Value:</span>
                  <StarDisplay rating={review.ratings.value} />
                </div>
              </div>

              {review.comment && (
                <p className="text-sm text-base-content/80 leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
