import type { Review } from "@/lib/types";

export function Stars({ n, size = "base" }: { n: number; size?: "base" | "lg" }) {
  return (
    <div
      className={`flex gap-1 text-gold ${size === "lg" ? "text-xl" : "text-sm"}`}
      aria-label={`${n} מתוך 5 כוכבים`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < n ? "" : "text-white/15"} aria-hidden>★</span>
      ))}
    </div>
  );
}

/**
 * Review card.
 *
 * The quote is the content, so it gets the type weight; the stars and the
 * name sit quietly around it. A large opening quote mark anchors the block
 * without needing a border or a heavier surface.
 */
export default function ReviewCard({ review }: { review: Review }) {
  const date = review.created_at
    ? new Date(review.created_at).toLocaleDateString("he-IL", { month: "long", year: "numeric" })
    : null;

  return (
    <figure className="glass-thin relative p-7 h-full flex flex-col transition-colors duration-slow ease-luxe hover:border-gold/25">
      <span
        aria-hidden
        className="absolute top-4 left-6 font-display text-6xl leading-none text-gold/12 select-none"
      >
        &rdquo;
      </span>

      <Stars n={review.rating} />

      <blockquote className="mt-5 flex-1 text-[15px] leading-loose text-white/80">
        {review.content}
      </blockquote>

      <figcaption className="mt-6 flex items-baseline gap-2 text-sm">
        <span className="font-medium">{review.author}</span>
        {date && <span className="text-smoke-dim text-xs">· {date}</span>}
      </figcaption>
    </figure>
  );
}
