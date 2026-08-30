"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Photo = { id: string; image_url: string; caption: string };

/** "Our customers" strip — only shows approved, real photos. */
export default function CustomerGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    createClient().from("customer_photos").select("id,image_url,caption")
      .eq("is_approved", true).order("sort_order").limit(8)
      .then(({ data }) => setPhotos((data as Photo[]) ?? []));
  }, []);

  if (photos.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 mt-20">
      <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">📸 הלקוחות שלנו</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {photos.map((p) => (
          <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden glass">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image_url} alt={p.caption || ""} loading="lazy"
              className="h-full w-full object-cover" />
            {p.caption && (
              <p className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-xs p-2 truncate">
                {p.caption}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
