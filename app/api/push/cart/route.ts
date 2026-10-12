import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Item = { name: string; qty: number; price: number };

type Target = {
  cart_id: string;
  session_id: string;
  phone: string | null;
  member_id: string | null;
  items: Item[];
  total: number;
  updated_at: string;
  pushed_at: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
};

const PUBLIC =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BGMBCRQkxPJp0AS7hx0ZrhEXWYhRPeUXw_Lw0g3Ze-Jm4tfneohtryJDs7fVpvxC23U8zRF1BxW7VTaToBYq6O4";

const ils = (n: number) =>
  new Intl.NumberFormat("he-IL", {
    style: "currency", currency: "ILS", maximumFractionDigits: 0,
  }).format(n);

/**
 * Sends a notification to everyone holding an open cart.
 *
 * Works on carts abandoned before push existed: a device is matched to a
 * cart either through the member who owns it, or through the cart id stored
 * in that same browser.
 *
 * A cooldown stops the same person being nudged repeatedly, and each device
 * receives one notification even when it matches several carts.
 */
export async function POST(req: Request) {
  try {
    const PRIVATE = process.env.VAPID_PRIVATE_KEY;
    if (!PRIVATE) {
      return NextResponse.json(
        { ok: false, reason: "חסר VAPID_PRIVATE_KEY בהגדרות Vercel" },
        { status: 400 }
      );
    }

    const {
      title, body, cooldownDays = 3, test = false, cartId = null,
    } = await req.json();

    webpush.setVapidDetails("mailto:noreply@luxe.store", PUBLIC, PRIVATE);

    const supabase = await createClient();
    let q = supabase.from("cart_push_targets").select("*").limit(3000);
    if (cartId) q = q.eq("cart_id", cartId);

    const { data, error } = await q;
    if (error) {
      return NextResponse.json({ ok: false, reason: error.message }, { status: 500 });
    }

    let targets = (data as Target[]) ?? [];

    // don't nudge the same cart again too soon
    if (!cartId && cooldownDays > 0) {
      const cutoff = Date.now() - cooldownDays * 864e5;
      targets = targets.filter(
        (t) => !t.pushed_at || new Date(t.pushed_at).getTime() < cutoff
      );
    }

    if (targets.length === 0) {
      return NextResponse.json({
        ok: false,
        reason: cartId
          ? "לא נמצא מכשיר שמקושר לעגלה הזו"
          : "אין עגלות שניתן להתריע עליהן כרגע",
      });
    }

    // one notification per device, about its largest cart
    const best = new Map<string, Target>();
    for (const t of targets) {
      const prev = best.get(t.endpoint);
      if (!prev || Number(t.total) > Number(prev.total)) best.set(t.endpoint, t);
    }
    const unique = [...best.values()].slice(0, test ? 1 : 3000);

    let sent = 0;
    const gone: string[] = [];
    const pushedCarts: string[] = [];

    const BATCH = 100;
    for (let i = 0; i < unique.length; i += BATCH) {
      const slice = unique.slice(i, i + BATCH);
      await Promise.all(
        slice.map(async (t) => {
          const items = t.items ?? [];
          const first = items[0]?.name ?? "המוצרים שלך";
          const more = items.length > 1 ? ` ועוד ${items.length - 1}` : "";

          const payload = JSON.stringify({
            title: title?.trim() || "השארת מוצרים בעגלה 🛍️",
            body:
              body?.trim() ||
              `${first}${more} · ${ils(Number(t.total))} — נשלים את ההזמנה?`,
            link: "/checkout",
            // one tag per cart replaces an older nudge instead of stacking
            tag: `cart-${t.cart_id}`,
          });

          try {
            await webpush.sendNotification(
              { endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } },
              payload
            );
            sent++;
            pushedCarts.push(t.cart_id);
          } catch (e) {
            const code = (e as { statusCode?: number }).statusCode;
            if (code === 410 || code === 404) gone.push(t.endpoint);
          }
        })
      );
    }

    if (gone.length) {
      await supabase.from("push_subscriptions").delete().in("endpoint", gone);
    }
    if (pushedCarts.length && !test) {
      await supabase.from("abandoned_carts")
        .update({ pushed_at: new Date().toISOString() })
        .in("id", pushedCarts);
    }

    return NextResponse.json({
      ok: sent > 0,
      sent,
      removed: gone.length,
      skipped: targets.length - unique.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ ok: false, reason: msg }, { status: 500 });
  }
}
