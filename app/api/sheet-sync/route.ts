import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Forwards an order to the Google Sheet.
 * The web-app URL lives in the `settings` table (key = 'sheet'),
 * so it can be changed from admin without a redeploy.
 */
export async function POST(req: Request) {
  try {
    const order = await req.json();

    const supabase = await createClient();
    const { data } = await supabase.from("settings").select("value").eq("key", "sheet").maybeSingle();
    const cfg = (data?.value ?? {}) as { url?: string; enabled?: boolean };

    if (!cfg.enabled || !cfg.url) {
      return NextResponse.json({ ok: false, reason: "not configured" });
    }

    // flatten the item list so it reads well in a spreadsheet cell
    const items = Array.isArray(order.items)
      ? order.items.map((i: { name: string; qty: number }) => `${i.name} x${i.qty}`).join(", ")
      : "";

    await fetch(cfg.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...order, items }),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
