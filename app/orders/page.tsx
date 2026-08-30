"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/lib/types";
import OrderTimeline from "@/components/OrderTimeline";

export const dynamic = "force-dynamic";

const statusHe: Record<string, string> = {
  new: "התקבלה", confirmed: "אושרה", shipped: "נשלחה", delivered: "נמסרה", cancelled: "בוטלה",
};

function OrdersInner() {
  const params = useSearchParams();
  const justOrdered = params.get("new");
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [busy, setBusy] = useState(false);

  const search = async () => {
    if (!phone.trim()) return;
    setBusy(true);
    const { data } = await createClient().from("orders").select("*")
      .eq("customer_phone", phone.trim()).order("created_at", { ascending: false });
    setOrders((data as Order[]) ?? []);
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      {justOrdered && (
        <div className="glass-gold p-6 mb-8 text-center">
          <p className="text-4xl">✓</p>
          <h1 className="font-display text-2xl font-bold mt-2">ההזמנה התקבלה!</h1>
          <p className="text-smoke mt-1">מספר הזמנה #{justOrdered}. ניצור קשר לאישור בהקדם.</p>
        </div>
      )}
      <h2 className="font-display text-3xl font-bold gold-text mb-4">מעקב הזמנות</h2>
      <p className="text-smoke mb-6">הזינו את מספר הטלפון שאיתו בוצעה ההזמנה.</p>
      <div className="flex gap-3">
        <input className="input" dir="ltr" placeholder="מספר טלפון" value={phone}
          onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} />
        <button onClick={search} disabled={busy} className="btn-gold px-6 shrink-0">{busy ? "…" : "חיפוש"}</button>
      </div>

      {orders && orders.length === 0 && <p className="text-smoke mt-8 text-center">לא נמצאו הזמנות למספר הזה.</p>}
      <div className="mt-8 space-y-4">
        {orders?.map((o) => (
          <div key={o.id} className="glass p-5">
            <div className="flex justify-between items-center">
              <span className="font-bold">#{o.order_number}</span>
              <span className="rounded-full bg-gold/15 text-gold text-xs px-3 py-1">{statusHe[o.status] ?? o.status}</span>
            </div>
            <div className="mt-4">
              <OrderTimeline status={o.status} />
            </div>
            <div className="mt-3 space-y-1 text-sm text-smoke">
              {o.items.map((i, idx) => <p key={idx}>{i.name} ×{i.qty}</p>)}
            </div>
            <div className="mt-3 flex justify-between border-t border-white/10 pt-3">
              <span className="text-smoke text-sm">{new Date(o.created_at).toLocaleDateString("he-IL")}</span>
              <span className="font-bold text-gold">{formatPrice(o.total)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return <Suspense fallback={<div className="h-64" />}><OrdersInner /></Suspense>;
}
