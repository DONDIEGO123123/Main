import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Sends a Telegram notification to the shop owner.
 * Bot token + chat id are stored in the `settings` table (key = 'notify'),
 * so they can be changed from the admin without a redeploy.
 */
export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ ok: false }, { status: 400 });

    const supabase = await createClient();
    const { data } = await supabase.from("settings").select("value").eq("key", "notify").maybeSingle();
    const cfg = (data?.value ?? {}) as { bot_token?: string; chat_id?: string; enabled?: boolean };

    if (!cfg.enabled || !cfg.bot_token || !cfg.chat_id) {
      return NextResponse.json({ ok: false, reason: "not configured" });
    }

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
