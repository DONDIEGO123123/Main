"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import type { Product, Order } from "@/lib/types";

type P = Product & { cost_price?: number; supplier?: string; low_stock_at?: number };

export default function AdminProfit() {
  const [products, setProducts] = useState<P[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    const s = createClient();
    Promise.all([
      s.from("products").select("*").order("name"),
      s.from("orders").select("*").neq("status", "cancelled").limit(1000),
    ]).then(([p, o]) => {
      setProducts((p.data as P[]) ?? []);
      setOrders((o.data as Order[]) ?? []);
      setLoading(false);
    });
  }, []);

  const save = async (p: P) => {
    await createClient().from("products").update({
      cost_price: p.cost_price ?? 0,
      supplier: p.supplier ?? "",
      low_stock_at: p.low_stock_at ?? 3,
    }).eq("id", p.id);
    setSaved(p.id);
    setTimeout(() => setSaved(""), 1500);
  };

  if (loading) return <div className="skeleton h-64 rounded-2xl" />;

  const costs = new Map(products.map((p) => [p.id, Number(p.cost_price ?? 0)]));
  let revenue = 0, cost = 0;
  orders.forEach((o) => {
    revenue += Number(o.total);
    (o.items ?? []).forEach((i) => { cost += (costs.get(i.product_id) ?? 0) * i.qty; });
  });
  const profit = revenue - cost;
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
  const lowStock = products.filter((p) => p.stock !== null && p.stock <= (p.low_stock_at ?? 3));

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">רווחיות ומלאי</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass p-5 text-center">
          <p className="font-display text-xl font-black text-gold">{formatPrice(revenue)}</p>
          <p className="text-smoke text-sm mt-1">הכנסות</p>
        </div>
        <div className="glass p-5 text-center">
          <p className="font-display text-xl font-black text-gold">{formatPrice(cost)}</p>
          <p className="text-smoke text-sm mt-1">עלות סחורה</p>
        </div>
        <div className="glass-gold p-5 text-center">
          <p className="font-display text-xl font-black gold-text">{formatPrice(profit)}</p>
          <p className="text-smoke text-sm mt-1">רווח גולמי</p>
        </div>
        <div className="glass p-5 text-center">
          <p className="font-display text-xl font-black text-gold">{margin}%</p>
          <p className="text-smoke text-sm mt-1">שיעור רווח</p>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="glass-gold p-5">
          <h2 className="font-semibold mb-3">⚠️ מלאי נמוך</h2>
          <div className="space-y-1.5">
            {lowStock.map((p) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span className="truncate">{p.name}</span>
                <span className={p.stock === 0 ? "text-red-400" : "text-gold"}>
                  {p.stock === 0 ? "אזל" : `${p.stock} נותרו`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-semibold">עלות וספק לכל מוצר</h2>
        <p className="text-smoke text-sm">הזן מחיר עלות כדי לראות רווח אמיתי.</p>
        {products.map((p, i) => {
          const c = Number(p.cost_price ?? 0);
          const unitProfit = p.price - c;
          return (
            <div key={p.id} className="glass p-4 space-y-3">
              <div className="flex items-center gap-3">
                <p className="font-semibold text-sm flex-1 truncate">{p.name}</p>
                <span className="text-smoke text-sm shrink-0">מחיר: {formatPrice(p.price)}</span>
                {c > 0 && (
                  <span className={`text-sm shrink-0 ${unitProfit > 0 ? "text-gold" : "text-red-400"}`}>
                    רווח: {formatPrice(unitProfit)}
                  </span>
                )}
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-smoke block mb-1">מחיר עלות ₪</label>
                  <input className="input" type="number" value={p.cost_price ?? 0}
                    onChange={(e) => setProducts(products.map((x, j) => j === i ? { ...x, cost_price: +e.target.value } : x))} />
                </div>
                <div>
                  <label className="text-xs text-smoke block mb-1">ספק</label>
                  <input className="input" value={p.supplier ?? ""}
                    onChange={(e) => setProducts(products.map((x, j) => j === i ? { ...x, supplier: e.target.value } : x))} />
                </div>
                <div>
                  <label className="text-xs text-smoke block mb-1">התראה במלאי</label>
                  <input className="input" type="number" value={p.low_stock_at ?? 3}
                    onChange={(e) => setProducts(products.map((x, j) => j === i ? { ...x, low_stock_at: +e.target.value } : x))} />
                </div>
              </div>
              <button onClick={() => save(p)} className="btn-gold px-5 py-2 text-sm">
                {saved === p.id ? "✓ נשמר" : "שמירה"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
