"use client";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

export type FunnelStep = { label: string; count: number; pct: number; drop: number };

/**
 * Conversion funnel (#41), built entirely from the event stream.
 * Each step is a distinct session, so one visitor is counted once.
 */
export async function loadFunnel(days = 30): Promise<FunnelStep[]> {
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const s = createClient();

  const { data } = await s.from("events")
    .select("name,session_id")
    .gte("created_at", since)
    .in("name", ["product_viewed", "cart_created", "checkout_started", "order_created"])
    .limit(20000);

  const rows = (data ?? []) as { name: string; session_id: string | null }[];
  const uniq = (n: string) =>
    new Set(rows.filter((r) => r.name === n && r.session_id).map((r) => r.session_id)).size;

  const { count: visits } = await s.from("site_visits")
    .select("id", { count: "exact", head: true }).gte("created_at", since);

  const steps = [
    { label: "כניסות לאתר",   count: visits ?? 0 },
    { label: "צפייה במוצר",   count: uniq("product_viewed") },
    { label: "הוספה לעגלה",   count: uniq("cart_created") },
    { label: "מעבר לתשלום",   count: uniq("checkout_started") },
    { label: "הזמנות",        count: uniq("order_created") },
  ];

  const top = Math.max(1, steps[0].count);
  return steps.map((st, i) => ({
    ...st,
    pct: Math.round((st.count / top) * 100),
    drop: i === 0 || steps[i - 1].count === 0
      ? 0
      : Math.round((1 - st.count / steps[i - 1].count) * 100),
  }));
}

export type ProductPerf = {
  id: string; name: string; views: number; carts: number;
  orders: number; revenue: number; cost: number; profit: number; conv: number;
};

/** Per-product performance (#43). */
export async function productPerformance(): Promise<ProductPerf[]> {
  const s = createClient();
  const [prodQ, viewQ, orderQ] = await Promise.all([
    s.from("products").select("id,name,cost_price").limit(500),
    s.from("product_views").select("product_id").limit(20000),
    s.from("orders").select("items,status").neq("status", "cancelled").limit(3000),
  ]);

  const views = new Map<string, number>();
  ((viewQ.data ?? []) as { product_id: string }[])
    .forEach((v) => views.set(v.product_id, (views.get(v.product_id) ?? 0) + 1));

  const sold = new Map<string, { qty: number; revenue: number }>();
  ((orderQ.data ?? []) as Order[]).forEach((o) =>
    (o.items ?? []).forEach((i) => {
      const cur = sold.get(i.product_id) ?? { qty: 0, revenue: 0 };
      cur.qty += i.qty;
      cur.revenue += i.qty * i.price;
      sold.set(i.product_id, cur);
    }));

  type P = { id: string; name: string; cost_price: number | null };
  return ((prodQ.data ?? []) as P[]).map((p) => {
    const v = views.get(p.id) ?? 0;
    const st = sold.get(p.id) ?? { qty: 0, revenue: 0 };
    const cost = (p.cost_price ?? 0) * st.qty;
    return {
      id: p.id, name: p.name, views: v, carts: 0,
      orders: st.qty, revenue: st.revenue, cost,
      profit: st.revenue - cost,
      conv: v > 0 ? Math.round((st.qty / v) * 1000) / 10 : 0,
    };
  }).sort((a, b) => b.revenue - a.revenue);
}

export type Flag = { level: "red" | "orange"; icon: string; text: string; link: string };

/** Smart flags (#36): what actually needs attention right now. */
export async function loadFlags(): Promise<Flag[]> {
  const s = createClient();
  const out: Flag[] = [];
  const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString();

  const [lowQ, cartQ, revQ, ticketQ, orderQ] = await Promise.all([
    s.from("products").select("id,name,stock,low_stock_at").eq("is_active", true).limit(500),
    s.from("abandoned_carts").select("id").eq("recovered", false).limit(500),
    s.from("reviews").select("id").eq("is_approved", false).limit(200),
    s.from("support_tickets").select("id").neq("status", "resolved").limit(200),
    s.from("orders").select("id").eq("status", "new").limit(200),
  ]);

  type P = { id: string; name: string; stock: number | null; low_stock_at: number | null };
  const low = ((lowQ.data ?? []) as P[])
    .filter((p) => p.stock !== null && p.stock <= (p.low_stock_at ?? 3));
  if (low.length > 0) {
    out.push({ level: "red", icon: "📦",
      text: `${low.length} מוצרים מתחת לסף המלאי`, link: "/admin/profit" });
  }

  const newOrders = ((orderQ.data ?? []) as unknown[]).length;
  if (newOrders > 0) {
    out.push({ level: "red", icon: "🛍️",
      text: `${newOrders} הזמנות ממתינות לטיפול`, link: "/admin/orders" });
  }

  const tickets = ((ticketQ.data ?? []) as unknown[]).length;
  if (tickets > 0) {
    out.push({ level: "red", icon: "🆘",
      text: `${tickets} פניות תמיכה פתוחות`, link: "/admin/tickets" });
  }

  const carts = ((cartQ.data ?? []) as unknown[]).length;
  if (carts >= 3) {
    out.push({ level: "orange", icon: "🛒",
      text: `${carts} עגלות נטושות ממתינות לפנייה`, link: "/admin/abandoned" });
  }

  const reviews = ((revQ.data ?? []) as unknown[]).length;
  if (reviews > 0) {
    out.push({ level: "orange", icon: "⭐",
      text: `${reviews} ביקורות ממתינות לאישור`, link: "/admin/reviews" });
  }

  // dormant customers — worth a nudge before they're gone
  const { data: members } = await s.from("members").select("phone").limit(1000);
  const { data: recent } = await s.from("orders")
    .select("customer_phone").gte("created_at", monthAgo).limit(2000);
  const activePhones = new Set(((recent ?? []) as { customer_phone: string }[]).map((r) => r.customer_phone));
  const dormant = ((members ?? []) as { phone: string }[]).filter((m) => !activePhones.has(m.phone)).length;
  if (dormant >= 5) {
    out.push({ level: "orange", icon: "😴",
      text: `${dormant} לקוחות לא הזמינו החודש`, link: "/admin/segments" });
  }

  return out;
}
