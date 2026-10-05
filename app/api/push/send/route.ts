import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Sub = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  failed_count: number;
};

const PUBLIC =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BGMBCRQkxPJp0AS7hx0ZrhEXWYhRPeUXw_Lw0g3Ze-Jm4tfneohtryJDs7fVpvxC23U8zRF1BxW7VTaToBYq6O4";

/**
 * Broadcasts a notification to every registered device.
 *
 * Devices that reject us permanently (410/404 — the browser dropped the
 * subscription) are deleted, so the list stays clean on its own. Other
 * failures only increment a counter; a phone that is merely offline
 * should not be removed.
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

    const { title, body, link, test } = await req.json();
    if (!title?.trim()) {
      return NextResponse.json({ ok: false, reason: "חסרה כותרת" }, { status: 400 });
    }

    webpush.setVapidDetails("mailto:noreply@luxe.store", PUBLIC, PRIVATE);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth,failed_count")
      .lt("failed_count", 5)
      .limit(test ? 1 : 5000);

    if (error) {
      return NextResponse.json({ ok: false, reason: error.message }, { status: 500 });
    }

    const subs = (data as Sub[]) ?? [];
    if (subs.length === 0) {
      return NextResponse.json({ ok: false, reason: "אין מכשירים רשומים עדיין" });
    }

    const payload = JSON.stringify({
      title: title.trim(),
      body: (body ?? "").trim(),
      link: link?.trim() || "/",
      tag: `luxe-${Date.now()}`,
    });

    let sent = 0;
    const gone: string[] = [];
    const flaky: Sub[] = [];

    // send in batches so one slow endpoint can't stall the whole run
    const BATCH = 100;
    for (let i = 0; i < subs.length; i += BATCH) {
      const slice = subs.slice(i, i + BATCH);
      await Promise.all(
        slice.map(async (s) => {
          try {
            await webpush.sendNotification(
              { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
              payload
            );
            sent++;
          } catch (e) {
            const code = (e as { statusCode?: number }).statusCode;
            // the browser permanently dropped this subscription
            if (code === 410 || code === 404) gone.push(s.id);
            else flaky.push(s);
          }
        })
      );
    }

    if (gone.length) {
      await supabase.from("push_subscriptions").delete().in("id", gone);
    }
    for (const s of flaky) {
      await supabase.from("push_subscriptions")
        .update({ failed_count: s.failed_count + 1 }).eq("id", s.id);
    }
    if (sent > 0) {
      await supabase.from("push_subscriptions")
        .update({ last_sent_at: new Date().toISOString() })
        .in("id", subs.filter((s) => !gone.includes(s.id)).map((s) => s.id));
    }

    if (!test) {
      await supabase.from("push_campaigns").insert({
        title: title.trim(),
        body: (body ?? "").trim(),
        link: link?.trim() || null,
        sent_count: sent,
        failed_count: gone.length + flaky.length,
      });
    }

    return NextResponse.json({
      ok: sent > 0,
      sent,
      removed: gone.length,
      failed: flaky.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ ok: false, reason: msg }, { status: 500 });
  }
}
