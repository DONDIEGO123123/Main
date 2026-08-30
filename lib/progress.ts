"use client";
import { createClient } from "@/lib/supabase/client";
import { awardPoints } from "@/lib/member";
import { track } from "@/lib/events";

/**
 * Progress engine: computes a member's real metrics from orders, reviews
 * and referrals, then unlocks any achievement or mission they've earned.
 * All point awards run through the server function with an idempotency key,
 * so re-running this is always safe.
 */

export type Metrics = {
  orders: number;
  spend: number;
  reviews: number;
  referrals: number;
  points: number;
  streak: number;
  level: number;      // current points, compared against level thresholds
  profile: number;    // 1 when the profile has a name and avatar
};

export type Achievement = {
  key: string; title: string; description: string; icon: string;
  metric: keyof Metrics; threshold: number; reward_points: number; sort_order: number;
};

export type Mission = Achievement;

export async function loadMetrics(member: {
  id: string; phone: string; points: number; referral_code: string;
  streak_days?: number; avatar_url?: string | null; display_name?: string;
}): Promise<Metrics> {
  const s = createClient();
  const [ordersQ, reviewsQ, refQ] = await Promise.all([
    s.from("orders").select("total,status").eq("customer_phone", member.phone).neq("status", "cancelled"),
    s.from("reviews").select("id").eq("phone", member.phone),
    s.from("members").select("id").eq("referred_by", member.referral_code),
  ]);

  const orders = ((ordersQ.data ?? []) as { total: number }[]);
  return {
    orders: orders.length,
    spend: orders.reduce((n, o) => n + Number(o.total), 0),
    reviews: ((reviewsQ.data ?? []) as unknown[]).length,
    referrals: ((refQ.data ?? []) as unknown[]).length,
    points: member.points,
    streak: member.streak_days ?? 0,
    level: member.points,
    profile: member.avatar_url && member.display_name ? 1 : 0,
  };
}

/** Unlock anything newly earned. Returns what was just unlocked. */
export async function syncProgress(memberId: string, metrics: Metrics) {
  const s = createClient();
  const unlocked: { type: "achievement" | "mission"; title: string; icon: string; points: number }[] = [];

  const [achQ, doneAchQ, misQ, doneMisQ] = await Promise.all([
    s.from("achievements").select("*").eq("is_active", true).order("sort_order"),
    s.from("member_achievements").select("achievement_key").eq("member_id", memberId),
    s.from("missions").select("*").eq("is_active", true).order("sort_order"),
    s.from("member_missions").select("mission_key").eq("member_id", memberId),
  ]);

  const doneAch = new Set(((doneAchQ.data ?? []) as { achievement_key: string }[]).map((r) => r.achievement_key));
  const doneMis = new Set(((doneMisQ.data ?? []) as { mission_key: string }[]).map((r) => r.mission_key));

  for (const a of (achQ.data ?? []) as Achievement[]) {
    if (doneAch.has(a.key)) continue;
    if ((metrics[a.metric] ?? 0) < a.threshold) continue;

    const { error } = await s.from("member_achievements")
      .insert({ member_id: memberId, achievement_key: a.key });
    if (error) continue;                    // already recorded by a parallel call

    if (a.reward_points > 0) {
      await awardPoints(memberId, "challenge", `הישג: ${a.title}`, a.reward_points, `ach-${memberId}-${a.key}`);
    }
    track({ name: "achievement_unlocked", memberId, entityType: "achievement", entityId: a.key,
            metadata: { title: a.title } });
    unlocked.push({ type: "achievement", title: a.title, icon: a.icon, points: a.reward_points });
  }

  for (const m of (misQ.data ?? []) as Mission[]) {
    if (doneMis.has(m.key)) continue;
    if ((metrics[m.metric] ?? 0) < m.threshold) continue;

    const { error } = await s.from("member_missions")
      .insert({ member_id: memberId, mission_key: m.key });
    if (error) continue;

    if (m.reward_points > 0) {
      await awardPoints(memberId, "challenge", `משימה: ${m.title}`, m.reward_points, `mis-${memberId}-${m.key}`);
    }
    track({ name: "mission_completed", memberId, entityType: "mission", entityId: m.key,
            metadata: { title: m.title } });
    unlocked.push({ type: "mission", title: m.title, icon: m.icon, points: m.reward_points });
  }

  return unlocked;
}

/** Grant any badge whose automatic rule the member now satisfies. */
export async function syncBadges(memberId: string, metrics: Metrics, level: string, repLevel: string) {
  const s = createClient();
  const [badgeQ, ownedQ] = await Promise.all([
    s.from("badges").select("*").eq("is_active", true),
    s.from("member_badges").select("badge_key").eq("member_id", memberId),
  ]);
  const owned = new Set(((ownedQ.data ?? []) as { badge_key: string }[]).map((r) => r.badge_key));

  for (const b of (badgeQ.data ?? []) as { key: string; auto_rule: string | null }[]) {
    if (owned.has(b.key) || !b.auto_rule || b.auto_rule === "manual") continue;
    const [kind, value] = b.auto_rule.split(":");

    const earned =
      kind === "level" ? level === value
      : kind === "reputation" ? repLevel === value
      : kind === "streak" ? metrics.streak >= Number(value)
      : kind === "orders" ? metrics.orders >= Number(value)
      : kind === "reviews" ? metrics.reviews >= Number(value)
      : false;

    if (earned) await s.from("member_badges").insert({ member_id: memberId, badge_key: b.key });
  }
}

/** Daily streak tick — the database decides, so it can't be gamed. */
export async function touchStreak(memberId: string): Promise<number | null> {
  const { data } = await createClient().rpc("touch_streak", { p_member_id: memberId });
  return (data as number) ?? null;
}

export async function addReputation(memberId: string, ruleKey: string, idem?: string) {
  const { data } = await createClient().rpc("add_reputation", {
    p_member_id: memberId, p_rule_key: ruleKey, p_idem: idem ?? null,
  });
  return (data as number) ?? null;
}
