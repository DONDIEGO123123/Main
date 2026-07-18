import type { Review } from "@/lib/types";

export function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5 text-gold" aria-label={`${n} מתוך 5 כוכבים`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < n ? "" : "opacity-25"}>★</span>
      ))}
    </div>
  );
}

export default function ReviewCard({ review }: { review: Review }) {
  return (
    <figure className="glass p-6 hover:border-gold/30 transition-colors duration-500 h-full flex flex-col">
      <Stars n={review.rating} />
      <blockquote className="mt-4 text-smoke leading-relaxed flex-1">
        {review.content}
      </blockquote>
      <figcaption className="mt-5 font-semibold text-gold">— {review.author}</figcaption>
    </figure>
  );
}
