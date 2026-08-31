"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { waLink } from "@/lib/status-msg";

type O = {
  id: string; order_number: number; customer_name: string;
  customer_phone: string; created_at: string;
};

export default function AdminReviewRequests() {
  const [orders, setOrders] = useState<O[]>([]);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    const cutoff = new Date(Date.now() - 2 * 864e5).toISOString();
    createClient().from("orders")
      .select("id,order_number,customer_name,customer_phone,created_at")
      .eq("status", "delivered").eq("review_requested", false)
      .lte("created_at", cutoff).limit(50)
      .then(({ data }) => { setOrders((data as O[]) ?? []); setLoading(false); });
  }, []);

  const markSent = async (id: string) => {
    await createClient().from("orders").update({ review_requested: true }).eq("id", id);
    setOrders(orders.filter((o) => o.id !== id));
  };

  if (loading) return <div className="skeleton h-64 rounded-2xl" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl font-bold">בקשת ביקורת</h1>
      <p className="text-smoke text-sm">
        הזמנות שנמסרו לפני יומיים ומעלה, שעדיין לא נשלחה עליהן בקשה.
      </p>

      {orders.length === 0 ? (
        <div className="glass p-12 text-center text-smoke">אין בקשות ממתינות</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const text =
              `היי ${o.customer_name}! 🖤\n` +
              `מקווים שנהנית מההזמנה #${o.order_number}.\n` +
              `נשמח מאוד אם תשאיר לנו ביקורת קצרה:\n${origin}/reviews`;
            return (
              <div key={o.id} className="glass p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    #{o.order_number} · {o.customer_name}
                  </p>
                  <p className="text-smoke text-xs mt-0.5">
                    נמסרה {new Date(o.created_at).toLocaleDateString("he-IL")}
                  </p>
                </div>
                <a href={waLink(o.customer_phone, text)} target="_blank" rel="noopener noreferrer"
                  onClick={() => markSent(o.id)} className="btn-gold px-4 py-2 text-sm shrink-0">
                  שליחה
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
