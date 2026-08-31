import ReviewCard, { Stars } from "@/components/ReviewCard";
import type { Review } from "@/lib/types";

/** Real social proof: average rating and count, computed from approved reviews. */
export default function SocialProof({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  return (
    <div>
      {/* the score reads as one line, not a boxed badge */}
      <div className="flex flex-col items-center gap-3 mb-12">
        <Stars n={Math.round(avg)} size="lg" />
        <p className="font-display text-5xl font-black metal-text tabular-nums leading-none">
          {avg.toFixed(1)}
        </p>
        <p className="text-smoke text-sm">
          מתוך 5, לפי {reviews.length} ביקורות
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reviews.slice(0, 6).map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>
    </div>
  );
}
