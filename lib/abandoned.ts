"use client";
import { createClient } from "@/lib/supabase/client";
import type { CartItem } from "@/lib/types";

function sid() {
  if (typeof window === "undefined") return null;
  let s = localStorage.getItem("luxe-cart-sid");
  if (!s) { s = crypto.randomUUID(); localStorage.setItem("luxe-cart-sid", s); }
  return s;
}

/** Persist the current cart so the shop owner can follow up on abandoned carts. */
export async function saveAbandonedCart(items: CartItem[], total: number, phone?: string, memberId?: string) {
  const session_id = sid();
  if (!session_id) return;
  try {
    const s = createClient();
    if (items.length === 0) {
      await s.from("abandoned_carts").delete().eq("session_id", session_id);
      return;
    }
    await s.from("abandoned_carts").upsert({
      session_id, items, total,
      phone: phone ?? null,
      member_id: memberId ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "session_id" });

    // a phone means the customer is deep in checkout — worth knowing about.
    // The server decides whether to send; it only ever fires once per cart.
    if (phone && phone.replace(/\D/g, "").length >= 9) {
      alertOwner(session_id);
    }
  } catch { /* never break the cart */ }
}

/** Fire-and-forget owner alert. Never blocks or breaks checkout. */
function alertOwner(session_id: string) {
  try {
    fetch("/api/cart-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id }),
    }).catch(() => {});
  } catch { /* ignore */ }
}

/** Mark the cart as converted once the order goes through. */
export async function markRecovered() {
  const session_id = sid();
  if (!session_id) return;
  try {
    await createClient().from("abandoned_carts").update({ recovered: true }).eq("session_id", session_id);
  } catch { /* ignore */ }
}
