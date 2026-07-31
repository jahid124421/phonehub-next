"use client";

import { useState } from "react";
import type { UserReview } from "@/lib/reviews";
import { addReview } from "@/lib/reviews";

const categories = [
  { key: "display", label: "Display" },
  { key: "camera", label: "Camera" },
  { key: "battery", label: "Battery" },
  { key: "performance", label: "Performance" },
  { key: "value", label: "Value" },
] as const;

type CategoryKey = (typeof categories)[number]["key"];

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none"
        >
          <svg
            className={`w-6 h-6 transition-colors ${
              star <= (hover || value)
                ? "text-warning fill-warning"
                : "text-base-content/20"
            }`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function ReviewForm({
  productId,
  onSuccess,
  onCancel,
}: {
  productId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [ratings, setRatings] = useState<Record<CategoryKey, number>>({
    display: 0,
    camera: 0,
    battery: 0,
    performance: 0,
    value: 0,
  });
  const [comment, setComment] = useState("");
  const [author, setAuthor] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setError("");

    // Validation: at least one rating required
    const hasRating = Object.values(ratings).some((r) => r > 0);
    if (!hasRating) {
      setError("Please rate at least one category");
      return;
    }

    // Calculate overall
    const ratedCategories = Object.entries(ratings).filter(([, v]) => v > 0);
    const overall =
      ratedCategories.reduce((sum, [, v]) => sum + v, 0) /
      ratedCategories.length;

    const review: UserReview = {
      productId,
      ratings,
      overall: Math.round(overall * 10) / 10,
      comment,
      date: new Date().toISOString(),
      author: author || "Anonymous",
    };

    addReview(review);
    setSubmitted(true);
    setTimeout(() => {
      onSuccess();
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="rounded-xl bg-success/10 border border-success/30 p-6 text-center">
        <div className="text-4xl mb-2">✓</div>
        <h3 className="text-lg font-semibold text-success mb-1">
          Review Submitted!
        </h3>
        <p className="text-sm text-base-content/60">
          Thank you for your feedback.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-base-200 border border-base-300 p-6 space-y-5">
      <h3 className="text-lg font-bold">Write a Review</h3>

      {/* Author name */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          Your Name (optional)
        </label>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Anonymous"
          className="input input-bordered w-full"
        />
      </div>

      {/* Star ratings */}
      <div className="space-y-3">
        <label className="block text-sm font-medium">
          Ratings <span className="text-error">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <span className="text-sm text-base-content/70">{label}</span>
              <StarRating
                value={ratings[key]}
                onChange={(v) => setRatings({ ...ratings, [key]: v })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          Your Review (optional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={4}
          className="textarea textarea-bordered w-full"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-error font-medium">{error}</div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handleSubmit} className="btn btn-primary">
          Submit Review
        </button>
        <button onClick={onCancel} className="btn btn-ghost">
          Cancel
        </button>
      </div>
    </div>
  );
}
