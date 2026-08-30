import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Returns delivered orders from 2+ days ago that haven't been asked for a review yet,
 * so the admin can send the requests in one sitting.
 */
export async function GET() {
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - 2 * 864e5).toISOString();

  const { data } = await supabase.from("orders")
    .select("id,order_number,customer_name,customer_phone,created_at")
    .eq("status", "delivered")
    .eq("review_requested", false)
    .lte("created_at", cutoff)
    .limit(50);

  return NextResponse.json({ orders: data ?? [] });
}
