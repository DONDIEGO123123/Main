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
  } catch { /* never break the cart */ }
}

/** Mark the cart as converted once the order goes through. */
export async function markRecovered() {
  const session_id = sid();
  if (!session_id) return;
  try {
    await createClient().from("abandoned_carts").update({ recovered: true }).eq("session_id", session_id);
  } catch { /* ignore */ }
}
