"use client";
import { useHolographic } from "@/lib/useHolographic";

/**
 * Reusable holographic shell.
 *
 * Wraps any card content and supplies the tilt, light, iridescence,
 * specular streak and parallax layers. Content is passed through
 * untouched, so every existing button, link and badge keeps working.
 *
 * `media` renders inside the 3D frame; `children` is the body below it.
 */
export default function HolographicCard({
  media,
  children,
  className = "",
}: {
  media: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, handlers } = useHolographic<HTMLElement>();

  return (
    <article
      ref={ref}
      {...handlers}
      className={`holo-card glass group overflow-hidden hover:border-gold/30 transition-colors duration-500 ${className}`}
    >
      <span className="holo-card__glow" aria-hidden />

      <div className="holo-card__media relative aspect-[3/4] overflow-hidden bg-panel">
        {/* the product image / video, given its own parallax depth */}
        <div className="holo-card__layer absolute inset-0">{media}</div>

        {/* light and material layers — decorative, never interactive */}
        <span className="holo-card__light" aria-hidden />
        <span className="holo-card__iri" aria-hidden />
        <span className="holo-card__spec" aria-hidden />
        <span className="holo-card__scan" aria-hidden />
      </div>

      <div className="holo-card__body">{children}</div>

      <span className="holo-card__edge" aria-hidden />
    </article>
  );
}
