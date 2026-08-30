"use client";
import { createClient } from "@/lib/supabase/client";

export type LedgerRow = {
  id: number; delta: number; balance_after: number;
  reason: string; created_at: string;
};

export type RewardRow = {
  id: number; kind: string; ref_id: string | null; label: string;
  amount: number; expires_at: string | null; consumed_at: string | null;
  created_at: string;
};

export type DailyResult = {
  ok: boolean; reason?: string; day?: number; label?: string;
  points?: number; icon?: string; balance?: number;
};

export type MysteryResult = {
  ok: boolean; reason?: string; label?: string; kind?: string;
  points?: number; code?: string | null; balance?: number;
};

/** Points history — every change with the balance that followed it. */
export async function pointsLedger(memberId: string, limit = 60) {
  const { data } = await createClient()
    .from("points_ledger")
    .select("id,delta,balance_after,reason,created_at")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as LedgerRow[]) ?? [];
}

/** Coupons and rewards the member holds. */
export async function myRewards(memberId: string) {
  const { data } = await createClient()
    .from("rewards_ledger")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as RewardRow[]) ?? [];
}

/** Rewards expiring within the given window, soonest first (#16). */
export function expiringSoon(rows: RewardRow[], hours = 72) {
  const cutoff = Date.now() + hours * 3600_000;
  return rows
    .filter((r) => !r.consumed_at && r.expires_at && new Date(r.expires_at).getTime() <= cutoff
                   && new Date(r.expires_at).getTime() > Date.now())
    .sort((a, b) => new Date(a.expires_at!).getTime() - new Date(b.expires_at!).getTime());
}

/** Countdown text for an expiry timestamp. */
export function timeLeft(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "פג תוקף";
  const h = Math.floor(ms / 3600_000);
  if (h < 1) return `${Math.floor(ms / 60_000)} דקות`;
  if (h < 24) return `${h} שעות`;
  return `${Math.floor(h / 24)} ימים`;
}

export async function claimDaily(memberId: string): Promise<DailyResult> {
  const { data, error } = await createClient().rpc("claim_daily", { p_member_id: memberId });
  if (error) return { ok: false, reason: "error" };
  return (data as DailyResult) ?? { ok: false };
}

export async function claimedToday(memberId: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await createClient()
    .from("daily_claims")
    .select("id", { count: "exact", head: true })
    .eq("member_id", memberId)
    .eq("claim_date", today);
  return (count ?? 0) > 0;
}

export async function openMystery(memberId: string, trigger: string): Promise<MysteryResult> {
  const { data, error } = await createClient()
    .rpc("open_mystery", { p_member_id: memberId, p_trigger: trigger });
  if (error) return { ok: false, reason: "error" };
  return (data as MysteryResult) ?? { ok: false };
}

/** Level ranking used to decide whether a member may see a locked product. */
const ORDER = ["all", "member", "silver", "gold", "platinum", "vip"];

export function canAccess(minLevel: string | null | undefined, memberLevel?: string | null): boolean {
  if (!minLevel || minLevel === "all") return true;
  if (!memberLevel) return false;
  return ORDER.indexOf(memberLevel) >= ORDER.indexOf(minLevel);
}

/** True while a product is still inside its VIP early-access window (#19). */
export function inEarlyAccess(until: string | null | undefined): boolean {
  return !!until && new Date(until).getTime() > Date.now();
}
