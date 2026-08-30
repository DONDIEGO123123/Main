"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

/** Referral tracking — reads attribution captured on orders (?ref=CODE). */
export default function AdminReferrals() {
  const [rows, setRows] = useState<{ code: string; orders: number; total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient().from("orders").select("referral_code,total,status")
      .not("referral_code", "is", null)
      .then(({ data }) => {
        const map = new Map<string, { code: string; orders: number; total: number }>();
        ((data as Order[]) ?? []).forEach((o) => {
          if (!o.referral_code || o.status === "cancelled") return;
          const cur = map.get(o.referral_code) ?? { code: o.referral_code, orders: 0, total: 0 };
          cur.orders += 1;
          cur.total += Number(o.total);
          map.set(o.referral_code, cur);
        });
        setRows([...map.values()].sort((a, b) => b.orders - a.orders));
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">חבר מביא חבר</h1>
      <div className="glass p-5 text-sm text-smoke leading-relaxed">
        כל לקוח מקבל קישור אישי בסיומת <span className="text-gold" dir="ltr">?ref=CODE</span>.
        הזמנה שמגיעה דרך הקישור נשמרת עם הקוד, והנתונים מופיעים כאן.
        הפעלת התוכנית והגדרת ההטבה נמצאות בעמוד הגדרות אתר.
      </div>

      {rows.length === 0 ? (
        <div className="glass p-12 text-center text-smoke">
          עדיין לא התקבלו הזמנות דרך קישורי הפניה
        </div>
      ) : (
        <div className="glass divide-y divide-white/5">
          {rows.map((r) => (
            <div key={r.code} className="p-4 flex items-center gap-3">
              <span className="text-gold font-mono text-sm" dir="ltr">{r.code}</span>
              <span className="mr-auto text-smoke text-sm">{r.orders} הזמנות</span>
              <span className="font-bold text-gold">
                {new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(r.total)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
