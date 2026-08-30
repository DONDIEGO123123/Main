"use client";
import { useSiteSettings } from "@/lib/site";

/** Optional hero video, set from admin. Falls back to nothing when unset. */
export default function HeroVideo() {
  const site = useSiteSettings() as { hero_video?: string; hero_video_title?: string };
  if (!site.hero_video) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 mt-20">
      <div className="relative rounded-2xl overflow-hidden glass aspect-video">
        <video
          src={site.hero_video}
          className="h-full w-full object-cover"
          autoPlay muted loop playsInline preload="metadata"
        />
        {site.hero_video_title && (
          <div className="absolute inset-0 grid place-items-center bg-black/35">
            <h2 className="font-display text-2xl md:text-4xl font-bold gold-text text-center px-6">
              {site.hero_video_title}
            </h2>
          </div>
        )}
      </div>
    </section>
  );
}
