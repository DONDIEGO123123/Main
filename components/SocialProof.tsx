import ReviewCard from "@/components/ReviewCard";
import type { Review } from "@/lib/types";

/** Real social proof: average rating + count computed from approved reviews. */
export default function SocialProof({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const stars = Math.round(avg);

  return (
    <div>
      <div className="glass-gold p-6 text-center mb-8 max-w-md mx-auto">
        <div className="text-gold text-2xl tracking-widest">{"★".repeat(stars)}{"☆".repeat(5 - stars)}</div>
        <p className="font-display text-3xl font-black gold-text mt-2">{avg.toFixed(1)} / 5</p>
        <p className="text-smoke text-sm mt-1">מבוסס על {reviews.length} ביקורות אמיתיות</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reviews.slice(0, 6).map((r) => <ReviewCard key={r.id} review={r} />)}
      </div>
    </div>
  );
}
