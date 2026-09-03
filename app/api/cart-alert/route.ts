import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Item = { name: string; qty: number; price: number };

/**
 * Alerts the shop owner when a cart carries a phone number but hasn't
 * become an order. Fires once per cart — the `alerted_at` stamp is
 * checked and written server-side, so a repeated call is harmless.
 */
export async function POST(req: Request) {
  try {
    const { session_id } = await req.json();
    if (!session_id) return NextResponse.json({ ok: false }, { status: 400 });

    const supabase = await createClient();

    const { data: cart } = await supabase
      .from("abandoned_carts")
      .select("id,phone,items,total,recovered,alerted_at")
      .eq("session_id", session_id)
      .maybeSingle();

    // only alert on a real, un-alerted, un-recovered cart with a phone
    if (!cart || !cart.phone || cart.recovered || cart.alerted_at) {
      return NextResponse.json({ ok: false, reason: "skip" });
    }

    const { data: cfgRow } = await supabase
      .from("settings").select("value").eq("key", "notify").maybeSingle();
    const cfg = (cfgRow?.value ?? {}) as {
      bot_token?: string; chat_id?: string; enabled?: boolean; cart_alerts?: boolean;
    };

    if (!cfg.enabled || !cfg.bot_token || !cfg.chat_id || cfg.cart_alerts === false) {
      return NextResponse.json({ ok: false, reason: "not configured" });
    }

    // claim the alert first — two parallel calls can't both send
    const { data: claimed } = await supabase
      .from("abandoned_carts")
      .update({ alerted_at: new Date().toISOString() })
      .eq("id", cart.id)
      .is("alerted_at", null)
      .select("id")
      .maybeSingle();

    if (!claimed) return NextResponse.json({ ok: false, reason: "already alerted" });

    const items = (cart.items ?? []) as Item[];
    const lines = items.map((i) => `• ${i.name} × ${i.qty}`).join("\n");
    const money = new Intl.NumberFormat("he-IL", {
      style: "currency", currency: "ILS", maximumFractionDigits: 0,
    }).format(Number(cart.total));

    const wa = `https://wa.me/${cart.phone.replace(/\D/g, "").replace(/^0/, "972")}`;

    const text =
      `🛒 <b>עגלה נטושה</b>\n\n` +
      `📞 ${cart.phone}\n\n` +
      `${lines}\n\n` +
      `💰 ${money}\n\n` +
      `<a href="${wa}">פנייה בוואטסאפ ←</a>`;

    const res = await fetch(`https://api.telegram.org/bot${cfg.bot_token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: cfg.chat_id,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    return NextResponse.json({ ok: res.ok });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
