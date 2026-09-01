"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

/** Horizontal strip of products this visitor looked at recently. */
export default function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    let ids: string[] = [];
    try { ids = JSON.parse(localStorage.getItem("luxe-recent") ?? "[]"); } catch { /* empty */ }
    const list = ids.filter((id) => id !== excludeId).slice(0, 8);
    if (list.length === 0) return;

    createClient().from("products").select("*").in("id", list).eq("is_active", true)
      .then(({ data }) => {
        const byId = new Map(((data ?? []) as Product[]).map((p) => [p.id, p]));
        setItems(list.map((id) => byId.get(id)).filter(Boolean) as Product[]);
      });
  }, [excludeId]);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 mt-16">
      <h2 className="font-display text-xl font-bold mb-4">👁 נצפו לאחרונה</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`}
            className="shrink-0 w-32 glass overflow-hidden hover:border-gold/40 transition-colors duration-base ease-luxe">
            <div className="aspect-square bg-black/30">
              {p.image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
              ) : <div className="h-full w-full grid place-items-center text-gold/30">✦</div>}
            </div>
            <div className="p-2">
              <p className="text-xs truncate">{p.name}</p>
              <p className="text-gold text-xs mt-0.5">{formatPrice(p.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
