import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Daily summary to Telegram.
 * Call from a scheduler (e.g. cron-job.org) once each morning:
 *   GET /api/daily-report
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: cfgRow } = await supabase.from("settings").select("value").eq("key", "notify").maybeSingle();
    const cfg = (cfgRow?.value ?? {}) as { bot_token?: string; chat_id?: string; enabled?: boolean };
    if (!cfg.enabled || !cfg.bot_token || !cfg.chat_id) {
      return NextResponse.json({ ok: false, reason: "not configured" });
    }

    const since = new Date(Date.now() - 864e5).toISOString();

    const [ordersQ, membersQ, visitsQ, cartsQ, ledgerQ, reviewQ,
           ticketQ, lowQ, prodQ, orderItemsQ] = await Promise.all([
      supabase.from("orders").select("total,status").gte("created_at", since),
      supabase.from("members").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabase.from("site_visits").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabase.from("abandoned_carts").select("id", { count: "exact", head: true }).eq("recovered", false),
      supabase.from("points_ledger").select("delta").gte("created_at", since).gt("delta", 0),
      supabase.from("reviews").select("id", { count: "exact", head: true }).eq("is_approved", false),
      supabase.from("support_tickets").select("id", { count: "exact", head: true }).neq("status", "resolved"),
      supabase.from("products").select("id,name,stock,low_stock_at").eq("is_active", true),
      supabase.from("products").select("id,name"),
      supabase.from("orders").select("items").gte("created_at", since),
    ]);

    const orders = ((ordersQ.data ?? []) as { total: number; status: string }[])
      .filter((o) => o.status !== "cancelled");
    const revenue = orders.reduce((n, o) => n + Number(o.total), 0);

    const money = new Intl.NumberFormat("he-IL", {
      style: "currency", currency: "ILS", maximumFractionDigits: 0,
    }).format(revenue);

    const visits = visitsQ.count ?? 0;
    const conv = visits > 0 ? Math.round((orders.length / visits) * 1000) / 10 : 0;
    const aov = orders.length > 0 ? Math.round(revenue / orders.length) : 0;
    const points = ((ledgerQ.data ?? []) as { delta: number }[]).reduce((n, r) => n + r.delta, 0);
    const ils = (n: number) => new Intl.NumberFormat("he-IL",
      { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(n);

    // best seller of the day
    const names = new Map(((prodQ.data ?? []) as { id: string; name: string }[]).map((p) => [p.id, p.name]));
    const sold = new Map<string, number>();
    ((orderItemsQ.data ?? []) as { items: { product_id: string; qty: number }[] }[])
      .forEach((o) => (o.items ?? []).forEach((i) =>
        sold.set(i.product_id, (sold.get(i.product_id) ?? 0) + i.qty)));
    const top = [...sold.entries()].sort((a, b) => b[1] - a[1])[0];

    const low = ((lowQ.data ?? []) as { name: string; stock: number | null; low_stock_at: number | null }[])
      .filter((p) => p.stock !== null && p.stock <= (p.low_stock_at ?? 3));

    // what actually deserves attention today
    const todo: string[] = [];
    if (orders.length > 0) todo.push(`\u05d8\u05e4\u05dc \u05d1-${orders.length} \u05d4\u05d6\u05de\u05e0\u05d5\u05ea \u05d7\u05d3\u05e9\u05d5\u05ea`);
    if ((ticketQ.count ?? 0) > 0) todo.push(`\u05e2\u05e0\u05d4 \u05dc-${ticketQ.count} \u05e4\u05e0\u05d9\u05d5\u05ea \u05ea\u05de\u05d9\u05db\u05d4`);
    if ((cartsQ.count ?? 0) >= 3) todo.push(`\u05e4\u05e0\u05d4 \u05dc-${cartsQ.count} \u05e2\u05d2\u05dc\u05d5\u05ea \u05e0\u05d8\u05d5\u05e9\u05d5\u05ea`);
    if (low.length > 0) todo.push(`\u05d7\u05d3\u05e9 \u05de\u05dc\u05d0\u05d9: ${low.slice(0, 3).map((p) => p.name).join(", ")}`);
    if ((reviewQ.count ?? 0) > 0) todo.push(`\u05d0\u05e9\u05e8 ${reviewQ.count} \u05d1\u05d9\u05e7\u05d5\u05e8\u05d5\u05ea`);

    const text =
      `\u2600\ufe0f <b>\u05e1\u05d9\u05db\u05d5\u05dd 24 \u05e9\u05e2\u05d5\u05ea</b>\n\n` +
      `\ud83d\udecd\ufe0f \u05d4\u05d6\u05de\u05e0\u05d5\u05ea: ${orders.length}\n` +
      `\ud83d\udcb0 \u05de\u05db\u05d9\u05e8\u05d5\u05ea: ${money}\n` +
      `\ud83d\udcc8 \u05d4\u05d6\u05de\u05e0\u05d4 \u05de\u05de\u05d5\u05e6\u05e2\u05ea: ${ils(aov)}\n` +
      `\ud83d\udc40 \u05db\u05e0\u05d9\u05e1\u05d5\u05ea: ${visits}\n` +
      `\ud83c\udfaf \u05e9\u05d9\u05e2\u05d5\u05e8 \u05d4\u05de\u05e8\u05d4: ${conv}%\n` +
      `\ud83d\udc64 \u05d7\u05d1\u05e8\u05d9\u05dd \u05d7\u05d3\u05e9\u05d9\u05dd: ${membersQ.count ?? 0}\n` +
      `\ud83e\ude99 \u05e0\u05e7\u05d5\u05d3\u05d5\u05ea \u05e9\u05d7\u05d5\u05dc\u05e7\u05d5: ${points}\n` +
      `\ud83d\uded2 \u05e2\u05d2\u05dc\u05d5\u05ea \u05e4\u05ea\u05d5\u05d7\u05d5\u05ea: ${cartsQ.count ?? 0}` +
      (top ? `\n\n\ud83c\udfc6 \u05d4\u05de\u05d5\u05e6\u05e8 \u05e9\u05dc \u05d4\u05d9\u05d5\u05dd: ${names.get(top[0]) ?? "\u2014"} (${top[1]})` : "") +
      (todo.length > 0
        ? `\n\n<b>\u26a1 \u05de\u05d4 \u05d3\u05d5\u05e8\u05e9 \u05ea\u05e9\u05d5\u05de\u05ea \u05dc\u05d1 \u05d4\u05d9\u05d5\u05dd</b>\n` +
          todo.slice(0, 5).map((t) => `\u2022 ${t}`).join("\n")
        : `\n\n\u2705 \u05d0\u05d9\u05df \u05de\u05e9\u05d9\u05de\u05d5\u05ea \u05e4\u05ea\u05d5\u05d7\u05d5\u05ea`);

    const res = await fetch(`https://api.telegram.org/bot${cfg.bot_token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: cfg.chat_id, text, parse_mode: "HTML" }),
    });

    return NextResponse.json({ ok: res.ok });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
