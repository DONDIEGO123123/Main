"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { customer360, healthBadge, SEGMENT_LABELS, type CustomerProfile } from "@/lib/crm";
import { describeEvent } from "@/lib/events";
import { timeAgo } from "@/lib/notifications";
import { waLink } from "@/lib/status-msg";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ev = { id: number; name: string; metadata: Record<string, unknown>; created_at: string };
type Ledger = { id: number; delta: number; reason: string; created_at: string };

/** Customer 360 (#38) with an activity timeline (#39). */
export default function Customer360Page() {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const profile = await customer360(id);
      setP(profile);
      if (profile) {
        const s = createClient();
        const [oQ, eQ, lQ] = await Promise.all([
          s.from("orders").select("*").eq("customer_phone", profile.phone)
            .order("created_at", { ascending: false }).limit(20),
          s.from("events").select("id,name,metadata,created_at").eq("member_id", id)
            .order("created_at", { ascending: false }).limit(40),
          s.from("points_ledger").select("id,delta,reason,created_at").eq("member_id", id)
            .order("created_at", { ascending: false }).limit(20),
        ]);
        setOrders((oQ.data as Order[]) ?? []);
        setEvents((eQ.data as Ev[]) ?? []);
        setLedger((lQ.data as Ledger[]) ?? []);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="skeleton h-64 rounded-2xl" />;
  if (!p) return <div className="glass p-12 text-center text-smoke">הלקוח לא נמצא</div>;

  const badge = healthBadge(p.health);
  const seg = SEGMENT_LABELS[p.segment];

  const kpis = [
    { v: p.orders, l: "הזמנות" },
    { v: formatPrice(p.spend), l: "סה״כ רכישות" },
    { v: formatPrice(p.aov), l: "הזמנה ממוצעת" },
    { v: p.points, l: "נקודות" },
    { v: p.reviews, l: "ביקורות" },
    { v: p.referrals, l: "הפניות" },
  ];

  return (
    <div className="space-y-6">
      <a href="/admin/members" className="text-smoke text-sm hover:text-gold transition-colors duration-base ease-luxe">← לרשימת החברים</a>

      {/* Header */}
      <div className="glass-gold p-6">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-bold">{p.display_name}</h1>
            <p className="text-smoke text-sm mt-1" dir="ltr">{p.phone}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`px-3 py-1 rounded-full text-xs border ${seg.cls}`}>{seg.label}</span>
              <span className="px-3 py-1 rounded-full text-xs border border-gold/40 bg-gold/15 text-gold">
                {p.level}
              </span>
              <span className="px-3 py-1 rounded-full text-xs border border-white/15 text-smoke">
                מוניטין {p.reputation} · {p.rep_level}
              </span>
            </div>
          </div>
          <div className="text-center shrink-0">
            <p className="text-3xl">{badge.icon}</p>
            <p className="font-display text-2xl font-black gold-text tabular-nums">{p.health}</p>
            <p className="text-smoke text-xs">{badge.label}</p>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <a href={waLink(p.phone, `היי ${p.display_name}!`)} target="_blank" rel="noopener noreferrer"
            className="btn-gold px-5 py-2 text-sm">וואטסאפ</a>
          {p.daysSinceOrder !== null && (
            <span className="text-smoke text-sm self-center">
              הזמנה אחרונה לפני {p.daysSinceOrder} ימים
            </span>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {kpis.map((k) => (
          <div key={k.l} className="glass p-4 text-center">
            <p className="font-display text-lg font-black text-gold tabular-nums">{k.v}</p>
            <p className="text-smoke text-xs mt-1">{k.l}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Orders */}
        <div className="glass p-5">
          <h2 className="font-semibold mb-3">🛍 הזמנות</h2>
          {orders.length === 0 ? (
            <p className="text-smoke text-sm">אין הזמנות</p>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => (
                <a key={o.id} href={`/admin/orders/${o.id}`}
                  className="flex justify-between items-center text-sm border-b border-white/5 last:border-0 pb-2 last:pb-0 hover:text-gold transition-colors duration-base ease-luxe">
                  <span>#{o.order_number}</span>
                  <span className="text-smoke text-xs">
                    {new Date(o.created_at).toLocaleDateString("he-IL")}
                  </span>
                  <span className="text-gold">{formatPrice(Number(o.total))}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Points */}
        <div className="glass p-5">
          <h2 className="font-semibold mb-3">🪙 תנועות נקודות</h2>
          {ledger.length === 0 ? (
            <p className="text-smoke text-sm">אין תנועות</p>
          ) : (
            <div className="space-y-2">
              {ledger.map((l) => (
                <div key={l.id} className="flex items-center gap-2 text-sm border-b border-white/5 last:border-0 pb-2 last:pb-0">
                  <span className="flex-1 truncate">{l.reason}</span>
                  <span className={`tabular-nums shrink-0 ${l.delta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {l.delta > 0 ? "+" : ""}{l.delta}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Timeline (#39) */}
      <div className="glass p-5">
        <h2 className="font-semibold mb-3">🕐 ציר פעילות</h2>
        {events.length === 0 ? (
          <p className="text-smoke text-sm">אין פעילות מתועדת</p>
        ) : (
          <div className="space-y-2.5">
            {events.map((e) => (
              <div key={e.id} className="flex items-center gap-3 text-sm">
                <span className="text-smoke text-xs tabular-nums shrink-0 w-20">
                  {timeAgo(e.created_at)}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                <span className="flex-1 truncate">{describeEvent(e.name, e.metadata)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
