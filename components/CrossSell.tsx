"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/lib/useCart";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

/** "Goes well with your picks" — same categories as what's already in the cart. */
export default function CrossSell() {
  const { items, add } = useCart();
  const [picks, setPicks] = useState<Product[]>([]);

  useEffect(() => {
    if (items.length === 0) { setPicks([]); return; }
    const inCart = items.map((i) => i.product_id);
    const s = createClient();
    (async () => {
      const { data: cartProducts } = await s.from("products")
        .select("category_id").in("id", inCart);
      const cats = [...new Set(((cartProducts ?? []) as { category_id: string | null }[])
        .map((c) => c.category_id).filter(Boolean))] as string[];
      if (cats.length === 0) { setPicks([]); return; }
      const { data } = await s.from("products").select("*")
        .in("category_id", cats).eq("is_active", true)
        .not("id", "in", `(${inCart.join(",")})`).limit(3);
      setPicks((data as Product[]) ?? []);
    })();
  }, [items.map((i) => i.product_id).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  if (picks.length === 0) return null;

  return (
    <div className="border-t border-white/10 p-5">
      <p className="text-sm font-semibold mb-3">משתלב מצוין עם מה שבחרת</p>
      <div className="space-y-2">
        {picks.map((p) => (
          <div key={p.id} className="flex gap-3 items-center glass p-2.5">
            <div className="h-12 w-12 rounded-lg overflow-hidden bg-black/30 shrink-0">
              {p.image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
              ) : <div className="h-full w-full grid place-items-center text-gold/30">✦</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{p.name}</p>
              <p className="text-gold text-sm">{formatPrice(p.price)}</p>
            </div>
            <button onClick={() => add(p)} className="btn-ghost px-3 py-1.5 text-xs shrink-0">הוסף</button>
          </div>
        ))}
      </div>
    </div>
  );
}
