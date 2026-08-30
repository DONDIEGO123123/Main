"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  src: string | null;
  video?: string | null;
  alt: string;
  className?: string;
};

/**
 * Product media with a subtle hologram treatment.
 * - Tilts toward the pointer on desktop, toward device orientation on mobile.
 * - Plays the video only while hovered (desktop) or while on screen (mobile).
 */
export default function HoloMedia({ src, video, alt, className = "" }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);

  // ---- tilt: pointer on desktop -------------------------------------
  const onMove = (e: React.MouseEvent) => {
    const el = wrapRef.current;
    if (!el || window.matchMedia("(hover: none)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateY(${px * 9}deg) rotateX(${-py * 9}deg)`;
  };

  const reset = () => {
    const el = wrapRef.current;
    if (el) el.style.transform = "";
  };

  // ---- tilt: device orientation on mobile ---------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(hover: none)").matches) return;

    let frame = 0;
    const onTilt = (e: DeviceOrientationEvent) => {
      const el = wrapRef.current;
      if (!el || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = Math.max(-6, Math.min(6, (e.gamma ?? 0) / 5));
        const x = Math.max(-6, Math.min(6, ((e.beta ?? 0) - 45) / 6));
        el.style.transform = `perspective(700px) rotateY(${y}deg) rotateX(${-x}deg)`;
      });
    };

    window.addEventListener("deviceorientation", onTilt);
    return () => {
      window.removeEventListener("deviceorientation", onTilt);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // ---- play video only when it matters ------------------------------
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !video) return;

    // desktop: hover drives playback
    if (!window.matchMedia("(hover: none)").matches) {
      if (active) v.play().catch(() => {});
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
  }, [active, video]);

  return (
    <div
      ref={wrapRef}
      className={`holo-card ${className}`}
      onMouseMove={onMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => { setActive(false); reset(); }}
    >
      <div className="holo-card__glow" />
      <div className="holo-card__media h-full w-full">
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
    </div>
  );
}
