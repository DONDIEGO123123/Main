"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/lib/useCart";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

/** Last-moment add-on: the cheapest item the customer hasn't already picked. */
export default function CheckoutUpsell() {
  const { items, add } = useCart();
  const [pick, setPick] = useState<Product | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (items.length === 0) { setPick(null); return; }
    const inCart = items.map((i) => i.product_id);
    createClient().from("products").select("*")
      .eq("is_active", true).gt("stock", 0)
      .not("id", "in", `(${inCart.join(",")})`)
      .order("price", { ascending: true }).limit(1)
      .then(({ data }) => setPick(((data ?? []) as Product[])[0] ?? null));
  }, [items.map((i) => i.product_id).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!pick || added) return null;

  return (
    <div className="glass p-4 flex items-center gap-3">
      <div className="h-14 w-14 rounded-lg overflow-hidden bg-black/30 shrink-0">
        {pick.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={pick.image_url} alt={pick.name} className="h-full w-full object-cover" />
        ) : <div className="h-full w-full grid place-items-center text-gold/30">✦</div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-smoke">להוסיף להזמנה?</p>
        <p className="text-sm font-semibold truncate">{pick.name}</p>
        <p className="text-gold text-sm">{formatPrice(pick.price)}</p>
      </div>
      <button onClick={() => { add(pick); setAdded(true); }}
        className="btn-gold px-4 py-2 text-sm shrink-0">
        הוספה
      </button>
    </div>
  );
}
