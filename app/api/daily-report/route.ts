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

    const [ordersQ, membersQ, visitsQ, cartsQ] = await Promise.all([
      supabase.from("orders").select("total,status").gte("created_at", since),
      supabase.from("members").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabase.from("site_visits").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabase.from("abandoned_carts").select("id", { count: "exact", head: true }).eq("recovered", false),
    ]);

    const orders = ((ordersQ.data ?? []) as { total: number; status: string }[])
      .filter((o) => o.status !== "cancelled");
    const revenue = orders.reduce((n, o) => n + Number(o.total), 0);

    const money = new Intl.NumberFormat("he-IL", {
      style: "currency", currency: "ILS", maximumFractionDigits: 0,
    }).format(revenue);

    const text =
      `☀️ <b>סיכום 24 שעות</b>\n\n` +
      `🛍️ הזמנות: ${orders.length}\n` +
      `💰 מכירות: ${money}\n` +
      `👤 חברים חדשים: ${membersQ.count ?? 0}\n` +
      `👀 כניסות: ${visitsQ.count ?? 0}\n` +
      `🛒 עגלות פתוחות: ${cartsQ.count ?? 0}`;

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
