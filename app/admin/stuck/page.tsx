"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import type { Product, Order } from "@/lib/types";

type Row = { p: Product; views: number; sold: number };

/** Products getting attention but no sales — worth a price or photo review. */
export default function AdminStuck() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const s = createClient();
      const [pQ, vQ, oQ] = await Promise.all([
        s.from("products").select("*").eq("is_active", true),
        s.from("product_views").select("product_id").limit(5000),
        s.from("orders").select("items,status").neq("status", "cancelled").limit(1000),
      ]);

      const views = new Map<string, number>();
      ((vQ.data ?? []) as { product_id: string }[])
        .forEach((v) => views.set(v.product_id, (views.get(v.product_id) ?? 0) + 1));

      const sold = new Map<string, number>();
      ((oQ.data ?? []) as Order[]).forEach((o) =>
        (o.items ?? []).forEach((i) => sold.set(i.product_id, (sold.get(i.product_id) ?? 0) + i.qty)));

      const list = ((pQ.data ?? []) as Product[])
        .map((p) => ({ p, views: views.get(p.id) ?? 0, sold: sold.get(p.id) ?? 0 }))
        .filter((r) => r.views >= 5 && r.sold === 0)
        .sort((a, b) => b.views - a.views);

      setRows(list);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">מוצרים תקועים</h1>
      <p className="text-smoke text-sm">
        מוצרים עם 5 צפיות ומעלה שעדיין לא נמכרו. שווה לבדוק מחיר, תמונה או תיאור.
      </p>

      {rows.length === 0 ? (
        <div className="glass p-12 text-center text-smoke">
          אין מוצרים תקועים — או שעדיין אין מספיק נתונים
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.p.id} className="glass p-4 flex items-center gap-3">
              <div className="h-14 w-14 rounded-lg overflow-hidden bg-black/30 shrink-0">
                {r.p.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={r.p.image_url} alt={r.p.name} className="h-full w-full object-cover" />
                ) : <div className="h-full w-full grid place-items-center text-gold/30">✦</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{r.p.name}</p>
                <p className="text-smoke text-xs mt-0.5">
                  {r.views} צפיות · 0 מכירות · {formatPrice(r.p.price)}
                </p>
              </div>
              <a href={`/products/${r.p.id}`} target="_blank" rel="noopener noreferrer"
                className="btn-ghost px-4 py-2 text-sm shrink-0">צפייה</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
