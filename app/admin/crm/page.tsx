"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/lib/types";

type M = {
  id: string; phone: string; display_name: string; points: number;
  level: string; birthday: string | null; created_at: string;
};
type Row = M & { orders: number; spent: number; lastOrder: string | null };

export default function AdminCrm() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"top" | "dormant" | "birthday">("top");

  useEffect(() => {
    (async () => {
      const s = createClient();
      const [mQ, oQ] = await Promise.all([
        s.from("members").select("*").limit(500),
        s.from("orders").select("*").neq("status", "cancelled").limit(1000),
      ]);

      const orders = (oQ.data as Order[]) ?? [];
      const byPhone = new Map<string, { n: number; sum: number; last: string }>();
      orders.forEach((o) => {
        const k = o.customer_phone;
        const cur = byPhone.get(k) ?? { n: 0, sum: 0, last: o.created_at };
        cur.n += 1;
        cur.sum += Number(o.total);
        if (o.created_at > cur.last) cur.last = o.created_at;
        byPhone.set(k, cur);
      });

      setRows(((mQ.data as M[]) ?? []).map((m) => {
        const st = byPhone.get(m.phone);
        return { ...m, orders: st?.n ?? 0, spent: st?.sum ?? 0, lastOrder: st?.last ?? null };
      }));
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="skeleton h-64 rounded-2xl" />;

  const now = Date.now();
  const monthAgo = now - 30 * 864e5;
  const thisMonth = new Date().getMonth();

  const shown =
    tab === "top"
      ? [...rows].filter((r) => r.spent > 0).sort((a, b) => b.spent - a.spent)
      : tab === "dormant"
      ? rows.filter((r) => r.lastOrder && new Date(r.lastOrder).getTime() < monthAgo)
      : rows.filter((r) => r.birthday && new Date(r.birthday).getMonth() === thisMonth);

  const msgFor = (r: Row) =>
    tab === "dormant"
      ? `היי ${r.display_name}! מזמן לא ראינו אותך 😊 יש אצלנו דברים חדשים — שווה הצצה!`
      : tab === "birthday"
      ? `היי ${r.display_name}! יום הולדת שמח 🎉 מגיעה לך הטבה מיוחדת מאיתנו`
      : `היי ${r.display_name}! תודה שאתה חלק מהקהילה שלנו 🖤`;

  const tabs = [
    { key: "top" as const, label: "🏆 לקוחות מובילים" },
    { key: "dormant" as const, label: "😴 לא הזמינו חודש" },
    { key: "birthday" as const, label: "🎂 יום הולדת החודש" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">ניהול לקוחות</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border transition ${
              tab === tb.key ? "bg-gold text-ink border-gold font-semibold" : "border-white/15 text-smoke"
            }`}>
            {tb.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="glass p-12 text-center text-smoke">אין לקוחות בקטגוריה הזו</div>
      ) : (
        <div className="space-y-3">
          {shown.map((r) => (
            <div key={r.id} className="glass p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{r.display_name}</p>
                <p className="text-smoke text-xs mt-0.5" dir="ltr">{r.phone}</p>
                <p className="text-smoke text-xs mt-1">
                  {r.orders} הזמנות · {formatPrice(r.spent)}
                  {r.lastOrder && ` · אחרונה ${new Date(r.lastOrder).toLocaleDateString("he-IL")}`}
                </p>
              </div>
              <a href={`https://wa.me/${r.phone.replace(/\D/g, "").replace(/^0/, "972")}?text=${
                encodeURIComponent(msgFor(r))
              }`} target="_blank" rel="noopener noreferrer" className="btn-gold px-4 py-2 text-sm shrink-0">
                פנייה
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
