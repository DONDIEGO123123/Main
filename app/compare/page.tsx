"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCompare, compareRows } from "@/lib/compare";
import { useCart } from "@/lib/useCart";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function ComparePage() {
  const { ids, remove, clear } = useCompare();
  const { add } = useCart();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (ids.length === 0) { setProducts([]); return; }
    createClient().from("products").select("*").in("id", ids)
      .then(({ data }) => {
        const byId = new Map(((data ?? []) as Product[]).map((p) => [p.id, p]));
        setProducts(ids.map((id) => byId.get(id)).filter(Boolean) as Product[]);
      });
  }, [ids.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  if (products.length === 0) {
    return (
      <main className="container mx-auto px-4 py-20 max-w-lg text-center">
        <p className="text-5xl mb-4">⚖️</p>
        <h1 className="font-display text-2xl font-bold gold-text">השוואת מוצרים</h1>
        <p className="text-smoke mt-3">בחרו מוצרים להשוואה מתוך הקטלוג</p>
        <Link href="/products" className="btn-gold inline-block mt-6 px-8 py-3">לקטלוג ←</Link>
      </main>
    );
  }

  const rows = compareRows(products);

  return (
    <main className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-display text-2xl font-bold gold-text flex-1">⚖️ השוואת מוצרים</h1>
        <button onClick={clear} className="text-smoke text-sm hover:text-gold transition">ניקוי</button>
      </div>

      {/* horizontal scroll keeps this usable on a phone */}
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr>
              <th className="w-24" />
              {products.map((p) => (
                <th key={p.id} className="p-2 align-top">
                  <div className="glass p-3 relative">
                    <button onClick={() => remove(p.id)} aria-label="הסרה"
                      className="absolute top-1 left-1 text-smoke text-lg leading-none">×</button>
                    <div className="aspect-square rounded-lg overflow-hidden bg-black/30 mb-2">
                      {p.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                      ) : <div className="h-full w-full grid place-items-center text-gold/30">✦</div>}
                    </div>
                    <Link href={`/products/${p.id}`} className="text-sm font-semibold block truncate hover:text-gold">
                      {p.name}
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-white/5">
                <td className="p-2 text-smoke text-sm align-middle">{r.label}</td>
                {products.map((p) => {
                  const v = r.get(p);
                  return (
                    <td key={p.id} className="p-2 text-center text-sm">
                      {v === null || v === undefined ? "—"
                        : typeof v === "number" && r.label.includes("מחיר") ? formatPrice(v)
                        : String(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="border-t border-white/5">
              <td />
              {products.map((p) => (
                <td key={p.id} className="p-2">
                  <button onClick={() => add(p)} disabled={p.stock === 0}
                    className="btn-gold w-full py-2 text-sm disabled:opacity-40">
                    {p.stock === 0 ? "אזל" : "לעגלה"}
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
