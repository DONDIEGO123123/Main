"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  src: string | null;
  video?: string | null;
  alt: string;
  className?: string;
};

/**
 * Product media: image or video.
 *
 * Tilt used to live here, but it now belongs to HolographicCard so the two
 * can't compete for the same transform. This component focuses on one job:
 * showing the right media and playing video only when it matters.
 */
export default function HoloMedia({ src, video, alt, className = "" }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !video) return;

    // desktop: hover drives playback
    if (!window.matchMedia("(hover: none)").matches) {
      if (hovered) v.play().catch(() => {});
      else { v.pause(); v.currentTime = 0; }
      return;
    }

    // mobile: play while the card is on screen
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.6 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [hovered, video]);

  return (
    <div
      className={`h-full w-full ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {video ? (
        <video
          ref={videoRef}
          src={video}
          poster={src ?? undefined}
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      ) : src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full grid place-items-center text-gold/20 text-5xl">✦</div>
      )}
    </div>
  );
}
