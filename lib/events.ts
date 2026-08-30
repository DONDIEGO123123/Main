"use client";
import { createClient } from "@/lib/supabase/client";

/**
 * Central event system (#70).
 * Every feature emits through here so analytics, notifications, rewards
 * and segments can all read one stream instead of duplicating logic.
 */
export type EventName =
  | "user_registered"
  | "user_login"
  | "product_viewed"
  | "product_favorited"
  | "product_shared"
  | "search_performed"
  | "search_no_results"
  | "cart_created"
  | "cart_updated"
  | "cart_abandoned"
  | "checkout_started"
  | "order_created"
  | "order_status_changed"
  | "coupon_applied"
  | "coupon_rejected"
  | "points_earned"
  | "points_spent"
  | "reward_redeemed"
  | "level_up"
  | "achievement_unlocked"
  | "mission_completed"
  | "referral_created"
  | "referral_converted"
  | "review_created"
  | "notification_sent";

type EventInput = {
  name: EventName;
  memberId?: string | null;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

function sessionId(): string | null {
  if (typeof window === "undefined") return null;
  let s = sessionStorage.getItem("luxe-sid");
  if (!s) {
    s = crypto.randomUUID();
    sessionStorage.setItem("luxe-sid", s);
  }
  return s;
}

/** Fire-and-forget. Tracking must never block or break a user flow. */
export async function track(input: EventInput): Promise<void> {
  try {
    await createClient().from("events").insert({
      name: input.name,
      member_id: input.memberId ?? null,
      session_id: sessionId(),
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? {},
    });
  } catch {
    /* analytics failures are never surfaced to the customer */
  }
}

/** Read a member's own activity stream (used by the profile timeline). */
export async function memberTimeline(memberId: string, limit = 50) {
  const { data } = await createClient()
    .from("events")
    .select("id,name,entity_type,entity_id,metadata,created_at")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

/** Human-readable label for an event, for timelines and feeds. */
export function describeEvent(name: string, meta: Record<string, unknown> = {}): string {
  const map: Record<string, string> = {
    user_registered: "הצטרפת לקהילה",
    user_login: "כניסה לחשבון",
    product_viewed: "צפייה במוצר",
    product_favorited: "הוספה למועדפים",
    product_shared: "שיתוף מוצר",
    search_performed: "חיפוש באתר",
    cart_created: "פתיחת עגלה",
    checkout_started: "מעבר לתשלום",
    order_created: "ביצוע הזמנה",
    order_status_changed: "עדכון סטטוס הזמנה",
    coupon_applied: "הפעלת קופון",
    points_earned: `קבלת ${meta.delta ?? ""} נקודות`,
    points_spent: `מימוש ${meta.amount ?? ""} נקודות`,
    reward_redeemed: "מימוש הטבה",
    level_up: `עלייה לרמת ${meta.level ?? ""}`,
    achievement_unlocked: "הישג חדש נפתח",
    mission_completed: "משימה הושלמה",
    referral_created: "יצירת קישור הפניה",
    referral_converted: "חבר הצטרף דרכך",
    review_created: "כתיבת ביקורת",
  };
  return map[name] ?? name;
}
