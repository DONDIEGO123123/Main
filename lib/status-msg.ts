import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

/**
 * Builds the customer message for a status change and returns a wa.me link.
 * Templates live in the `status_messages` table so they're editable from admin.
 */
export async function buildStatusMessage(order: Order, status: string): Promise<string | null> {
  const { data } = await createClient()
    .from("status_messages").select("template,is_active").eq("status", status).maybeSingle();

  const row = data as { template: string; is_active: boolean } | null;
  if (!row || !row.is_active || !row.template) return null;

  const tracking = (order as Order & { tracking_number?: string; courier?: string });
  const trackText = tracking.tracking_number
    ? `מספר מעקב: ${tracking.tracking_number}${tracking.courier ? ` (${tracking.courier})` : ""}`
    : "";

  return row.template
    .replace(/\{name\}/g, order.customer_name)
    .replace(/\{order\}/g, String(order.order_number))
    .replace(/\{tracking\}/g, trackText)
    .trim();
}

export function waLink(phone: string, text: string) {
  const clean = phone.replace(/\D/g, "").replace(/^0/, "972");
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}
