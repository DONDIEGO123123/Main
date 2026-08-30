"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { healthScore, segmentOf, healthBadge, SEGMENT_LABELS, type Segment } from "@/lib/crm";
import { waLink } from "@/lib/status-msg";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/lib/types";

type Row = {
  id: string; name: string; phone: string; level: string;
  orders: number; spend: number; days: number | null;
  health: number; segment: Segment;
};

/** Auto-updating customer segments (#40). Recomputed from live data on load. */
export default function AdminSegments() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [seg, setSeg] = useState<Segment | "all">("all");

  useEffect(() => {
    (async () => {
      const s = createClient();
      const [mQ, oQ, rQ, refQ] = await Promise.all([
        s.from("members").select("*").limit(1000),
        s.from("orders").select("customer_phone,total,created_at,status").neq("status", "cancelled").limit(3000),
        s.from("reviews").select("phone").limit(2000),
        s.from("members").select("referred_by").not("referred_by", "is", null).limit(2000),
      ]);

      const byPhone = new Map<string, { n: number; sum: number; last: string }>();
      ((oQ.data ?? []) as Order[]).forEach((o) => {
        const cur = byPhone.get(o.customer_phone) ?? { n: 0, sum: 0, last: o.created_at };
        cur.n += 1; cur.sum += Number(o.total);
        if (o.created_at > cur.last) cur.last = o.created_at;
        byPhone.set(o.customer_phone, cur);
      });

      const reviewCount = new Map<string, number>();
      ((rQ.data ?? []) as { phone: string | null }[]).forEach((r) => {
        if (r.phone) reviewCount.set(r.phone, (reviewCount.get(r.phone) ?? 0) + 1);
      });

      const refCount = new Map<string, number>();
      ((refQ.data ?? []) as { referred_by: string }[]).forEach((r) => {
        refCount.set(r.referred_by, (refCount.get(r.referred_by) ?? 0) + 1);
      });

      type M = {
        id: string; display_name: string; phone: string; level: string;
        points: number; streak_days: number; referral_code: string; created_at: string;
      };

      setRows(((mQ.data ?? []) as M[]).map((m) => {
        const st = byPhone.get(m.phone);
        const days = st ? Math.floor((Date.now() - new Date(st.last).getTime()) / 864e5) : null;
        const orders = st?.n ?? 0;
        const spend = st?.sum ?? 0;

        return {
          id: m.id, name: m.display_name, phone: m.phone, level: m.level,
          orders, spend, days,
          health: healthScore({
            orders, spend, daysSinceOrder: days,
            reviews: reviewCount.get(m.phone) ?? 0,
            referrals: refCount.get(m.referral_code) ?? 0,
            points: m.points ?? 0, streak: m.streak_days ?? 0,
          }),
          segment: segmentOf({ orders, daysSinceOrder: days, level: m.level, createdAt: m.created_at }),
        };
      }).sort((a, b) => b.health - a.health));

      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />;

  const counts = (Object.keys(SEGMENT_LABELS) as Segment[])
    .map((k) => ({ key: k, ...SEGMENT_LABELS[k], count: rows.filter((r) => r.segment === k).length }));

  const shown = seg === "all" ? rows : rows.filter((r) => r.segment === seg);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">סגמנטים וציון לקוח</h1>
      <p className="text-smoke text-sm">
        הקבוצות מחושבות מחדש מהנתונים בכל טעינה — אין צורך לתחזק אותן.
      </p>

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {counts.map((c) => (
          <button key={c.key} onClick={() => setSeg(seg === c.key ? "all" : c.key)}
            className={`glass p-4 text-center transition ${seg === c.key ? "border-gold/50" : ""}`}>
            <p className="font-display text-xl font-black text-gold tabular-nums">{c.count}</p>
            <p className="text-smoke text-xs mt-1">{c.label}</p>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="glass p-12 text-center text-smoke">אין לקוחות בקבוצה זו</div>
      ) : (
        <div className="space-y-2">
          {shown.map((r) => {
            const b = healthBadge(r.health);
            const s = SEGMENT_LABELS[r.segment];
            return (
              <div key={r.id} className="glass p-4 flex items-center gap-3">
                <span className="text-lg shrink-0">{b.icon}</span>
                <div className="flex-1 min-w-0">
                  <a href={`/admin/customers/${r.id}`} className="font-semibold text-sm truncate hover:text-gold transition block">
                    {r.name}
                  </a>
                  <p className="text-smoke text-xs mt-0.5">
                    {r.orders} הזמנות · {formatPrice(r.spend)}
                    {r.days !== null && ` · לפני ${r.days} ימים`}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] border shrink-0 ${s.cls}`}>{s.label}</span>
                <span className="text-gold font-bold tabular-nums shrink-0 w-8 text-left">{r.health}</span>
                <a href={waLink(r.phone, `היי ${r.name}!`)} target="_blank" rel="noopener noreferrer"
                  className="btn-ghost px-3 py-1.5 text-xs shrink-0">פנייה</a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
