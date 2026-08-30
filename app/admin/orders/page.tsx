"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import type { Order, CartItem } from "@/lib/types";

const STATUS: { key: Order["status"]; label: string; cls: string }[] = [
  { key: "new", label: "חדשה", cls: "bg-gold/20 text-gold border-gold/40" },
  { key: "confirmed", label: "אושרה", cls: "bg-blue-500/20 text-blue-300 border-blue-400/40" },
  { key: "shipped", label: "נשלחה", cls: "bg-purple-500/20 text-purple-300 border-purple-400/40" },
  { key: "delivered", label: "נמסרה", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40" },
  { key: "cancelled", label: "בוטלה", cls: "bg-red-500/20 text-red-300 border-red-400/40" },
];
const labelOf = (s: string) => STATUS.find((x) => x.key === s)?.label ?? s;
const clsOf = (s: string) => STATUS.find((x) => x.key === s)?.cls ?? "bg-white/10 text-smoke border-white/20";

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await createClient()
      .from("orders").select("*").order("created_at", { ascending: false }).limit(200);
    setOrders((data as Order[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: Order["status"]) => {
    setOrders((o) => o.map((x) => (x.id === id ? { ...x, status } : x)));
    await createClient().from("orders").update({ status }).eq("id", id);
  };

  const del = async (id: string) => {
    if (!confirm("למחוק את ההזמנה לצמיתות?")) return;
    setOrders((o) => o.filter((x) => x.id !== id));
    await createClient().from("orders").delete().eq("id", id);
  };

  const shown = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const revenue = orders.filter((o) => o.status !== "cancelled").reduce((n, o) => n + Number(o.total), 0);
  const newCount = orders.filter((o) => o.status === "new").length;

  if (loading) return <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">הזמנות</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass p-5 text-center">
          <p className="font-display text-2xl font-black text-gold tabular-nums">{orders.length}</p>
          <p className="text-smoke text-sm mt-1">סה״כ הזמנות</p>
        </div>
        <div className="glass-gold p-5 text-center">
          <p className="font-display text-2xl font-black gold-text tabular-nums">{newCount}</p>
          <p className="text-smoke text-sm mt-1">ממתינות לטיפול</p>
        </div>
        <div className="glass p-5 text-center">
          <p className="font-display text-2xl font-black text-gold tabular-nums">{formatPrice(revenue)}</p>
          <p className="text-smoke text-sm mt-1">סה״כ מכירות</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[{ key: "all", label: "הכל" }, ...STATUS].map((s) => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border transition ${
              filter === s.key ? "bg-gold text-ink border-gold font-semibold" : "border-white/15 text-smoke hover:border-gold/40"
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="glass p-12 text-center text-smoke">אין הזמנות להצגה</div>
      ) : (
        <div className="space-y-3">
          {shown.map((o) => {
            const items = (o.items ?? []) as CartItem[];
            const open = openId === o.id;
            return (
              <div key={o.id} className="glass overflow-hidden">
                <button onClick={() => setOpenId(open ? null : o.id)}
                  className="w-full p-4 flex items-center gap-3 text-right">
                  <span className={`px-3 py-1 rounded-full text-xs border shrink-0 ${clsOf(o.status)}`}>
                    {labelOf(o.status)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      #{o.order_number} · {o.customer_name}
                    </p>
                    <p className="text-smoke text-xs mt-0.5">
                      {new Date(o.created_at).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" })}
                      {" · "}{items.length} פריטים
                    </p>
                  </div>
                  <span className="font-bold text-gold shrink-0">{formatPrice(Number(o.total))}</span>
                </button>

                {open && (
                  <div className="border-t border-white/10 p-4 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <p><span className="text-smoke">טלפון: </span>
                        <a href={`tel:${o.customer_phone}`} className="text-gold" dir="ltr">{o.customer_phone}</a></p>
                      <p><span className="text-smoke">אזור: </span>{o.region ?? "—"}</p>
                      <p className="sm:col-span-2"><span className="text-smoke">כתובת: </span>
                        {[o.customer_address, o.city].filter(Boolean).join(", ") || "—"}</p>
                      {o.notes && <p className="sm:col-span-2"><span className="text-smoke">הערות: </span>{o.notes}</p>}
                      {o.referral_code && <p className="sm:col-span-2">
                        <span className="text-smoke">הגיע מהפניה: </span>
                        <span className="text-gold">{o.referral_code}</span></p>}
                    </div>

                    <div className="space-y-1.5">
                      {items.map((i, idx) => (
                        <div key={idx} className="flex justify-between text-sm border-b border-white/5 pb-1.5">
                          <span className="text-smoke truncate">{i.name} × {i.qty}</span>
                          <span className="shrink-0">{formatPrice(i.price * i.qty)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm pt-1">
                        <span className="text-smoke">משלוח</span><span>{formatPrice(Number(o.delivery_fee))}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1">
                        <span>סה״כ</span><span className="gold-text">{formatPrice(Number(o.total))}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-smoke text-sm mb-2">עדכון סטטוס</p>
                      <div className="flex flex-wrap gap-2">
                        {STATUS.map((s) => (
                          <button key={s.key} onClick={() => setStatus(o.id, s.key)}
                            className={`px-3 py-1.5 rounded-full text-xs border transition ${
                              o.status === s.key ? s.cls : "border-white/15 text-smoke hover:border-gold/40"
                            }`}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <a href={`https://wa.me/${o.customer_phone.replace(/\D/g, "").replace(/^0/, "972")}`}
                        target="_blank" rel="noopener noreferrer" className="btn-ghost px-4 py-2 text-sm">
                        וואטסאפ ללקוח
                      </a>
                      <button onClick={() => del(o.id)}
                        className="mr-auto text-red-400 text-sm hover:underline">מחיקה</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
