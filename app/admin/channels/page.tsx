"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/lib/types";

type Row = { channel: string; visits: number; orders: number; revenue: number };

export default function AdminChannels() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    (async () => {
      const s = createClient();
      const [hitsQ, ordersQ] = await Promise.all([
        s.from("channel_hits").select("channel").limit(5000),
        s.from("orders").select("channel,total,status").neq("status", "cancelled").limit(2000),
      ]);

      const map = new Map<string, Row>();
      ((hitsQ.data ?? []) as { channel: string }[]).forEach((h) => {
        const r = map.get(h.channel) ?? { channel: h.channel, visits: 0, orders: 0, revenue: 0 };
        r.visits += 1;
        map.set(h.channel, r);
      });
      ((ordersQ.data ?? []) as Order[]).forEach((o) => {
        if (!o.channel) return;
        const r = map.get(o.channel) ?? { channel: o.channel, visits: 0, orders: 0, revenue: 0 };
        r.orders += 1;
        r.revenue += Number(o.total);
        map.set(o.channel, r);
      });

      setRows([...map.values()].sort((a, b) => b.revenue - a.revenue));
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />;

  const examples = ["telegram", "instagram", "whatsapp", "facebook"];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">מאיפה מגיעים</h1>

      <div className="glass p-5 text-sm text-smoke space-y-2">
        <p className="font-semibold text-white">איך זה עובד:</p>
        <p>הוסף לקישור שאתה משתף את הסיומת <span className="text-gold font-mono" dir="ltr">?src=שם</span></p>
        <div className="space-y-1 mt-2">
          {examples.map((e) => (
            <p key={e} className="font-mono text-xs text-gold break-all" dir="ltr">
              {origin}/?src={e}
            </p>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="glass p-12 text-center text-smoke">
          עדיין אין נתונים — התחל לשתף קישורים עם סיומת src
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const rate = r.visits > 0 ? Math.round((r.orders / r.visits) * 1000) / 10 : 0;
            return (
              <div key={r.channel} className="glass p-4">
                <div className="flex items-center gap-3">
                  <p className="font-semibold flex-1 truncate">{r.channel}</p>
                  <span className="text-gold font-bold">{formatPrice(r.revenue)}</span>
                </div>
                <div className="flex gap-4 text-smoke text-xs mt-2">
                  <span>{r.visits} כניסות</span>
                  <span>{r.orders} הזמנות</span>
                  <span className={rate > 0 ? "text-gold" : ""}>{rate}% המרה</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
