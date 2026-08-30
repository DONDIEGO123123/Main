import { createClient } from "@/lib/supabase/client";

export type Coupon = {
  id: string; code: string; kind: "percent" | "amount"; value: number;
  min_order: number; starts_at: string | null; ends_at: string | null;
  max_uses: number | null; used_count: number; vip_only: boolean; is_active: boolean;
};

export type CouponResult =
  | { ok: true; coupon: Coupon; discount: number }
  | { ok: false; reason: string };

/** Validate a coupon against the cart subtotal and (optionally) the member's level. */
export async function validateCoupon(
  code: string, subtotal: number, memberLevel?: string
): Promise<CouponResult> {
  const clean = code.trim().toUpperCase();
  if (!clean) return { ok: false, reason: "נא להזין קוד קופון" };

  const { data } = await createClient().from("coupons").select("*").eq("code", clean).maybeSingle();
  const c = data as Coupon | null;

  if (!c || !c.is_active) return { ok: false, reason: "❌ קוד קופון לא תקין" };

  const now = Date.now();
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return { ok: false, reason: "⏳ הקופון עדיין לא פעיל" };
  if (c.ends_at && new Date(c.ends_at).getTime() < now) return { ok: false, reason: "⏳ תוקף הקופון פג" };
  if (c.max_uses !== null && c.used_count >= c.max_uses) return { ok: false, reason: "❌ הקופון מוצה" };
  if (c.min_order > 0 && subtotal < c.min_order)
    return { ok: false, reason: `הקופון תקף מהזמנה של ${c.min_order}₪` };
  if (c.vip_only && (!memberLevel || memberLevel === "member"))
    return { ok: false, reason: "💎 הקופון שמור לחברי VIP" };

  const discount = c.kind === "percent"
    ? Math.round(subtotal * (c.value / 100))
    : Math.min(c.value, subtotal);

  return { ok: true, coupon: c, discount };
}

/** Increment usage after a successful order. */
export async function consumeCoupon(id: string, currentCount: number) {
  await createClient().from("coupons").update({ used_count: currentCount + 1 }).eq("id", id);
}
