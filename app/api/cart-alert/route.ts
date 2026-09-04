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
    const { session_id, test } = await req.json();
    const supabase = await createClient();

    // a test ping proves the telegram side works, independently of carts
    if (test) {
      const { data: row } = await supabase
        .from("settings").select("value").eq("key", "notify").maybeSingle();
      const c = (row?.value ?? {}) as { bot_token?: string; chat_id?: string; enabled?: boolean };

      if (!c.enabled) return NextResponse.json({ ok: false, reason: "ההתראות כבויות בהגדרות" });
      if (!c.bot_token) return NextResponse.json({ ok: false, reason: "חסר Bot Token" });
      if (!c.chat_id) return NextResponse.json({ ok: false, reason: "חסר Chat ID" });

      const r = await fetch(`https://api.telegram.org/bot${c.bot_token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: c.chat_id,
          text: "🛒 <b>בדיקה</b>\n\nהתראות עגלה נטושה מחוברות ועובדות.",
          parse_mode: "HTML",
        }),
      });
      const body = await r.json().catch(() => ({}));
      return NextResponse.json({
        ok: r.ok,
        reason: r.ok ? "נשלח" : (body?.description ?? "טלגרם דחה את הבקשה"),
      });
    }

    if (!session_id) return NextResponse.json({ ok: false }, { status: 400 });

    const { data: cart } = await supabase
      .from("abandoned_carts")
      .select("id,phone,member_id,stage,items,total,recovered,alerted_at")
      .eq("session_id", session_id)
      .maybeSingle();

    if (!cart) return NextResponse.json({ ok: false, reason: "cart not found" });
    if (cart.recovered) return NextResponse.json({ ok: false, reason: "already ordered" });
    if (cart.alerted_at) return NextResponse.json({ ok: false, reason: "already alerted" });

    // a logged-in member has a phone on file even if they never reached checkout
    let phone = cart.phone;
    if (!phone && cart.member_id) {
      const { data: m } = await supabase
        .from("members").select("phone").eq("id", cart.member_id).maybeSingle();
      phone = m?.phone ?? null;
    }
    if (!phone) return NextResponse.json({ ok: false, reason: "no phone yet" });

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
    const money = (n: number) => new Intl.NumberFormat("he-IL", {
      style: "currency", currency: "ILS", maximumFractionDigits: 0,
    }).format(n);

    // --- the message the employee will send, built ready to go ---
    const { data: siteRow } = await supabase
      .from("settings").select("value").eq("key", "site").maybeSingle();
    const site = (siteRow?.value ?? {}) as { cart_message?: string; name?: string };

    const productLines = items.map((i) => `• ${i.name} × ${i.qty}`).join("\n");

    const template = site.cart_message
      || "היי! ראינו שהשארת מוצרים בעגלה 🛍️\nרוצה שנשלים את ההזמנה?";

    const customerMsg =
      `${template}\n\n${productLines}\n\nסה״כ: ${money(Number(cart.total))}`;

    const digits = phone.replace(/\D/g, "").replace(/^0/, "972");
    const wa = `https://wa.me/${digits}?text=${encodeURIComponent(customerMsg)}`;

    // --- what the shop sees in Telegram ---
    const stageLabel = cart.stage === "checkout" ? "עזב בעמוד התשלום" : "עזב בעגלה";

    const text =
      `🛒 <b>עגלה נטושה</b>\n\n` +
      `📞 ${phone}\n` +
      `📍 ${stageLabel}\n\n` +
      `${productLines}\n\n` +
      `💰 ${money(Number(cart.total))}\n\n` +
      `<a href="${wa}">👉 פנייה ללקוח — ההודעה כבר מוכנה</a>`;

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

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      // release the claim so a later attempt can retry
      await supabase.from("abandoned_carts")
        .update({ alerted_at: null }).eq("id", cart.id);
    }
    return NextResponse.json({
      ok: res.ok,
      reason: res.ok ? "sent" : (body?.description ?? "telegram rejected"),
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
