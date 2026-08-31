"use client";
import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";

/** A titled row of products. Renders nothing when there's no real data behind it. */
export default function ProductRail({
  title, subtitle, load, badge,
}: {
  title: string;
  subtitle?: string;
  load: () => Promise<Product[]>;
  badge?: (i: number) => string | null;
}) {
  const [items, setItems] = useState<Product[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    load().then((r) => { setItems(r); setReady(true); }).catch(() => setReady(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready || items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 mt-20">
      <div className="mb-6">
        <h2 className="font-display text-2xl md:text-3xl font-bold">{title}</h2>
        {subtitle && <p className="text-smoke text-sm mt-1">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.slice(0, 4).map((p, i) => (
          <div key={p.id} className="relative">
            {badge?.(i) && (
              <span className="absolute -top-2 right-2 z-30 glass-gold text-gold text-xs px-3 py-1 rounded-full">
                {badge(i)}
              </span>
            )}
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
