"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import type { Product, Order } from "@/lib/types";

type Row = { name: string; count: number };

export default function AdminInsights() {
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState({
    visits: 0, orders: 0, revenue: 0, members: 0, conversion: 0, avgOrder: 0,
  });
  const [period, setPeriod] = useState({ curR: 0, curN: 0, prevR: 0, prevN: 0 });
  const [topViewed, setTopViewed] = useState<Row[]>([]);
  const [topSold, setTopSold] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      const s = createClient();
      const [visitsQ, ordersQ, membersQ, viewsQ, productsQ] = await Promise.all([
        s.from("site_visits").select("id", { count: "exact", head: true }),
        s.from("orders").select("*").neq("status", "cancelled").limit(1000),
        s.from("members").select("id", { count: "exact", head: true }),
        s.from("product_views").select("product_id").limit(2000),
        s.from("products").select("id,name"),
      ]);

      const orders = (ordersQ.data as Order[]) ?? [];
      const visits = visitsQ.count ?? 0;
      const revenue = orders.reduce((n, o) => n + Number(o.total), 0);

      setKpi({
        visits,
        orders: orders.length,
        revenue,
        members: membersQ.count ?? 0,
        conversion: visits > 0 ? Math.round((orders.length / visits) * 1000) / 10 : 0,
        avgOrder: orders.length > 0 ? Math.round(revenue / orders.length) : 0,
      });

      // this month vs the previous one
      const now = new Date();
      const startThis = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      let curR = 0, curN = 0, prevR = 0, prevN = 0;
      orders.forEach((o) => {
        const ts = new Date(o.created_at).getTime();
        if (ts >= startThis) { curR += Number(o.total); curN += 1; }
        else if (ts >= startPrev) { prevR += Number(o.total); prevN += 1; }
      });
      setPeriod({ curR, curN, prevR, prevN });

      const names = new Map(((productsQ.data ?? []) as Product[]).map((p) => [p.id, p.name]));

      const vc = new Map<string, number>();
      ((viewsQ.data ?? []) as { product_id: string }[])
        .forEach((v) => vc.set(v.product_id, (vc.get(v.product_id) ?? 0) + 1));
      setTopViewed([...vc.entries()]
        .map(([id, count]) => ({ name: names.get(id) ?? "—", count }))
        .sort((a, b) => b.count - a.count).slice(0, 6));

      const sc = new Map<string, number>();
      orders.forEach((o) => (o.items ?? []).forEach((i) =>
        sc.set(i.product_id, (sc.get(i.product_id) ?? 0) + i.qty)));
      setTopSold([...sc.entries()]
        .map(([id, count]) => ({ name: names.get(id) ?? "—", count }))
        .sort((a, b) => b.count - a.count).slice(0, 6));

      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="skeleton h-64 rounded-2xl" />;

  const cards = [
    { v: kpi.visits.toLocaleString("he-IL"), l: "כניסות לאתר" },
    { v: kpi.orders.toLocaleString("he-IL"), l: "הזמנות" },
    { v: formatPrice(kpi.revenue), l: "סה״כ מכירות" },
    { v: kpi.members.toLocaleString("he-IL"), l: "חברי קהילה" },
    { v: `${kpi.conversion}%`, l: "שיעור המרה" },
    { v: formatPrice(kpi.avgOrder), l: "הזמנה ממוצעת" },
  ];

  const Bars = ({ title, rows, empty }: { title: string; rows: Row[]; empty: string }) => {
    const max = Math.max(1, ...rows.map((r) => r.count));
    return (
      <div className="glass p-5">
        <h2 className="font-semibold mb-4">{title}</h2>
        {rows.length === 0 ? (
          <p className="text-smoke text-sm">{empty}</p>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="truncate">{r.name}</span>
                  <span className="text-gold tabular-nums shrink-0">{r.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gold" style={{ width: `${(r.count / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">נתונים ותובנות</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.l} className="glass p-5 text-center">
            <p className="font-display text-2xl font-black text-gold tabular-nums">{c.v}</p>
            <p className="text-smoke text-sm mt-1">{c.l}</p>
          </div>
        ))}
      </div>

      <div className="glass p-5">
        <h2 className="font-semibold mb-4">📅 החודש מול הקודם</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { l: "מכירות", cur: period.curR, prev: period.prevR, money: true },
            { l: "הזמנות", cur: period.curN, prev: period.prevN, money: false },
          ].map((m) => {
            const diff = m.prev > 0 ? Math.round(((m.cur - m.prev) / m.prev) * 100) : null;
            return (
              <div key={m.l} className="text-center">
                <p className="text-smoke text-sm">{m.l}</p>
                <p className="font-display text-2xl font-black gold-text tabular-nums mt-1">
                  {m.money ? formatPrice(m.cur) : m.cur}
                </p>
                <p className="text-smoke text-xs mt-1">
                  קודם: {m.money ? formatPrice(m.prev) : m.prev}
                </p>
                {diff !== null && (
                  <p className={`text-sm mt-1 ${diff >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {diff >= 0 ? "▲" : "▼"} {Math.abs(diff)}%
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Bars title="👀 המוצרים הנצפים ביותר" rows={topViewed} empty="עדיין אין צפיות" />
        <Bars title="🔥 המוצרים הנמכרים ביותר" rows={topSold} empty="עדיין אין מכירות" />
      </div>
    </div>
  );
}
