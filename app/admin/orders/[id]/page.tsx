"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import type { Order, CartItem } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Printable packing slip. Use the browser's print dialog to save as PDF. */
export default function PackingSlip() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [shop, setShop] = useState<{ name?: string; whatsapp?: string }>({});

  useEffect(() => {
    const s = createClient();
    s.from("orders").select("*").eq("id", id).maybeSingle()
      .then(({ data }) => setOrder(data as Order));
    s.from("settings").select("value").eq("key", "site").maybeSingle()
      .then(({ data }) => setShop((data?.value ?? {}) as { name?: string; whatsapp?: string }));
  }, [id]);

  if (!order) return <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />;

  const items = (order.items ?? []) as CartItem[];

  return (
    <div className="space-y-4">
      <div className="flex gap-3 print:hidden">
        <button onClick={() => window.print()} className="btn-gold px-6 py-3">🖨 הדפסה / שמירה כ-PDF</button>
        <a href="/admin/orders" className="btn-ghost px-6 py-3">← חזרה</a>
      </div>

      {/* Printable area — forced to light colours so it prints cleanly */}
      <div className="bg-white text-black p-8 rounded-xl print:rounded-none print:p-0" id="slip">
        <div className="flex justify-between items-start border-b border-black/20 pb-4">
          <div>
            <h1 className="text-2xl font-bold">{shop.name || "LUXE"}</h1>
            <p className="text-sm opacity-70">תעודת משלוח</p>
          </div>
          <div className="text-left">
            <p className="text-xl font-bold">#{order.order_number}</p>
            <p className="text-sm opacity-70">
              {new Date(order.created_at).toLocaleDateString("he-IL")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-6 text-sm">
          <div>
            <p className="font-bold mb-1">נמען</p>
            <p>{order.customer_name}</p>
            <p dir="ltr">{order.customer_phone}</p>
            <p>{[order.customer_address, order.city].filter(Boolean).join(", ")}</p>
            {order.region && <p className="opacity-70">{order.region}</p>}
          </div>
          <div>
            <p className="font-bold mb-1">שולח</p>
            <p>{shop.name || "LUXE"}</p>
            {shop.whatsapp && <p className="opacity-70 text-xs" dir="ltr">{shop.whatsapp}</p>}
          </div>
        </div>

        <table className="w-full mt-6 text-sm border-collapse">
          <thead>
            <tr className="border-b border-black/20">
              <th className="text-right py-2">פריט</th>
              <th className="text-center py-2 w-16">כמות</th>
              <th className="text-left py-2 w-24">מחיר</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i, idx) => (
              <tr key={idx} className="border-b border-black/10">
                <td className="py-2">{i.name}</td>
                <td className="text-center py-2">{i.qty}</td>
                <td className="text-left py-2">{formatPrice(i.price * i.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 text-sm space-y-1 max-w-xs mr-auto">
          <div className="flex justify-between"><span>סכום ביניים</span><span>{formatPrice(Number(order.subtotal))}</span></div>
          <div className="flex justify-between"><span>משלוח</span><span>{formatPrice(Number(order.delivery_fee))}</span></div>
          <div className="flex justify-between font-bold text-base border-t border-black/20 pt-1">
            <span>סה״כ</span><span>{formatPrice(Number(order.total))}</span>
          </div>
        </div>

        {order.notes && (
          <div className="mt-6 text-sm border-t border-black/20 pt-3">
            <p className="font-bold">הערות</p>
            <p>{order.notes}</p>
          </div>
        )}

        <p className="text-center text-xs opacity-60 mt-8">תודה שקנית אצלנו 🖤</p>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #slip, #slip * { visibility: visible; }
          #slip { position: absolute; inset: 0; margin: 0; }
        }
      `}</style>
    </div>
  );
}
