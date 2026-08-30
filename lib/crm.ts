"use client";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

export type CustomerProfile = {
  id: string;
  display_name: string;
  phone: string;
  level: string;
  points: number;
  reputation: number;
  rep_level: string;
  streak_days: number;
  created_at: string;
  orders: number;
  spend: number;
  aov: number;
  lastOrderAt: string | null;
  daysSinceOrder: number | null;
  reviews: number;
  referrals: number;
  favorites: number;
  abandoned: number;
  health: number;
  segment: Segment;
};

export type Segment = "new" | "active" | "loyal" | "at_risk" | "dormant" | "vip";

export const SEGMENT_LABELS: Record<Segment, { label: string; cls: string }> = {
  new:     { label: "חדש",     cls: "bg-blue-500/20 text-blue-300 border-blue-400/40" },
  active:  { label: "פעיל",    cls: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40" },
  loyal:   { label: "נאמן",    cls: "bg-gold/20 text-gold border-gold/40" },
  vip:     { label: "VIP",     cls: "bg-purple-500/20 text-purple-300 border-purple-400/40" },
  at_risk: { label: "בסיכון",  cls: "bg-orange-500/20 text-orange-300 border-orange-400/40" },
  dormant: { label: "רדום",    cls: "bg-red-500/20 text-red-300 border-red-400/40" },
};

/**
 * Customer health score (#37).
 * Blends recency, frequency, spend and engagement into 0–100.
 * Every input is real activity — nothing is invented.
 */
export function healthScore(input: {
  orders: number; spend: number; daysSinceOrder: number | null;
  reviews: number; referrals: number; points: number; streak: number;
}): number {
  // recency carries the most weight — a customer who vanished is the real risk
  const recency =
    input.daysSinceOrder === null ? 10
    : input.daysSinceOrder <= 14 ? 40
    : input.daysSinceOrder <= 30 ? 32
    : input.daysSinceOrder <= 60 ? 20
    : input.daysSinceOrder <= 120 ? 10
    : 0;

  const frequency = Math.min(25, input.orders * 5);
  const monetary  = Math.min(20, Math.floor(input.spend / 250) * 5);
  const engagement = Math.min(15,
    input.reviews * 3 + input.referrals * 4 + Math.min(5, Math.floor(input.streak / 3)));

  return Math.max(0, Math.min(100, recency + frequency + monetary + engagement));
}

export function segmentOf(p: {
  orders: number; daysSinceOrder: number | null; level: string; createdAt: string;
}): Segment {
  const ageDays = Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 864e5);

  if (p.level === "vip" || p.level === "platinum") return "vip";
  if (p.orders === 0 && ageDays <= 14) return "new";
  if (p.daysSinceOrder !== null && p.daysSinceOrder > 90) return "dormant";
  if (p.daysSinceOrder !== null && p.daysSinceOrder > 45) return "at_risk";
  if (p.orders >= 3) return "loyal";
  return "active";
}

export function healthBadge(score: number) {
  if (score >= 70) return { icon: "🟢", label: "בריא" };
  if (score >= 40) return { icon: "🟡", label: "בסיכון" };
  return { icon: "🔴", label: "רדום" };
}

/** Builds the full 360 view for one customer (#38). */
export async function customer360(memberId: string): Promise<CustomerProfile | null> {
  const s = createClient();
  const { data: m } = await s.from("members").select("*").eq("id", memberId).maybeSingle();
  if (!m) return null;

  const [ordersQ, reviewsQ, refQ, cartQ] = await Promise.all([
    s.from("orders").select("total,created_at,status").eq("customer_phone", m.phone).neq("status", "cancelled"),
    s.from("reviews").select("id").eq("phone", m.phone),
    s.from("members").select("id").eq("referred_by", m.referral_code),
    s.from("abandoned_carts").select("id").eq("phone", m.phone).eq("recovered", false),
  ]);

  const orders = ((ordersQ.data ?? []) as Order[]);
  const spend = orders.reduce((n, o) => n + Number(o.total), 0);
  const lastOrderAt = orders.length
    ? orders.map((o) => o.created_at).sort().reverse()[0]
    : null;
  const daysSinceOrder = lastOrderAt
    ? Math.floor((Date.now() - new Date(lastOrderAt).getTime()) / 864e5)
    : null;

  const reviews = ((reviewsQ.data ?? []) as unknown[]).length;
  const referrals = ((refQ.data ?? []) as unknown[]).length;

  const health = healthScore({
    orders: orders.length, spend, daysSinceOrder, reviews, referrals,
    points: m.points ?? 0, streak: m.streak_days ?? 0,
  });

  return {
    id: m.id, display_name: m.display_name, phone: m.phone,
    level: m.level, points: m.points ?? 0,
    reputation: m.reputation ?? 0, rep_level: m.rep_level ?? "new",
    streak_days: m.streak_days ?? 0, created_at: m.created_at,
    orders: orders.length, spend,
    aov: orders.length ? Math.round(spend / orders.length) : 0,
    lastOrderAt, daysSinceOrder, reviews, referrals,
    favorites: 0,
    abandoned: ((cartQ.data ?? []) as unknown[]).length,
    health,
    segment: segmentOf({
      orders: orders.length, daysSinceOrder, level: m.level, createdAt: m.created_at,
    }),
  };
}
