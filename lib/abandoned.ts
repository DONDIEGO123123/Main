"use client";
import { createClient } from "@/lib/supabase/client";
import type { CartItem } from "@/lib/types";

function sid() {
  if (typeof window === "undefined") return null;
  let s = localStorage.getItem("luxe-cart-sid");
  if (!s) { s = crypto.randomUUID(); localStorage.setItem("luxe-cart-sid", s); }
  return s;
}

/**
 * Persist the cart so the shop can see who dropped off and where.
 *
 * This is called from the cart itself, not only from checkout, so a
 * customer who adds an item and leaves is still recorded. `stage` tells
 * the shop how far they got.
 *
 * Errors are returned rather than swallowed — a silent failure here once
 * left the table empty with no indication anything was wrong.
 */
export type CartStage = "cart" | "checkout";

export async function saveAbandonedCart(
  items: CartItem[],
  total: number,
  phone?: string,
  memberId?: string,
  stage: CartStage = "cart"
): Promise<{ ok: boolean; error?: string }> {
  const session_id = sid();
  if (!session_id) return { ok: false, error: "no session" };

  try {
    const s = createClient();

    if (items.length === 0) {
      await s.from("abandoned_carts").delete().eq("session_id", session_id);
      return { ok: true };
    }

    const { error } = await s.from("abandoned_carts").upsert({
      session_id,
      items,
      total,
      phone: phone ?? null,
      member_id: memberId ?? null,
      stage,
      updated_at: new Date().toISOString(),
    }, { onConflict: "session_id" });

    if (error) {
      console.warn("[abandoned cart] save failed:", error.message);
      return { ok: false, error: error.message };
    }

    // alert only once there's a way to reach the customer
    if (phone && phone.replace(/\D/g, "").length >= 9) {
      alertOwner(session_id);
    }

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.warn("[abandoned cart] save threw:", msg);
    return { ok: false, error: msg };
  }
}

/** Fire-and-forget owner alert. Never blocks or breaks the customer's flow. */
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
    await createClient().from("abandoned_carts")
      .update({ recovered: true }).eq("session_id", session_id);
  } catch { /* ignore */ }
}
