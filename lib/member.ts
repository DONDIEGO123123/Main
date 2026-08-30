"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export type Member = {
  id: string;
  phone: string;
  display_name: string;
  points: number;
  level: string;
  referral_code: string;
  referred_by: string | null;
  created_at: string;
};

const KEY = "luxe-member";
const EVT = "luxe-member-change";

/** Lightweight hash — obfuscates the PIN at rest. Not a security boundary. */
export async function hashPin(pin: string, phone: string) {
  const data = new TextEncoder().encode(`luxe:${phone}:${pin}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function normalizePhone(p: string) {
  return p.replace(/\D/g, "").replace(/^972/, "0");
}

export function makeReferralCode(name: string) {
  const base = name.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 6).toUpperCase() || "LUXE";
  return `${base}${Math.floor(1000 + Math.random() * 9000)}`;
}

function read(): Member | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}
function write(m: Member | null) {
  if (m) localStorage.setItem(KEY, JSON.stringify(m));
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVT));
}

export function useMember() {
  const [member, setMember] = useState<Member | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMember(read());
    setReady(true);
    const sync = () => setMember(read());
    window.addEventListener(EVT, sync);
    return () => window.removeEventListener(EVT, sync);
  }, []);

  /** Refresh points/level from the database. */
  const refresh = useCallback(async () => {
    const cur = read();
    if (!cur) return;
    const { data } = await createClient().from("members").select("*").eq("id", cur.id).single();
    if (data) write(data as Member);
  }, []);

  const logout = useCallback(() => write(null), []);

  return { member, ready, refresh, logout, setMember: write };
}

/**
 * Award points through the server function.
 * The client can no longer set its own balance — the database decides,
 * writes the ledger entry, recalculates the level and emits the event.
 * Pass `idem` (e.g. `order-123`) to make a repeat call harmless.
 */
export async function awardPoints(
  memberId: string,
  ruleKey: string,
  label?: string,
  multiplier = 1,
  idem?: string
): Promise<number | null> {
  const { data, error } = await createClient().rpc("award_points", {
    p_member_id: memberId,
    p_rule_key: ruleKey,
    p_label: label ?? null,
    p_multiplier: multiplier,
    p_idem: idem ?? null,
  });
  if (error) return null;
  return (data as number) ?? null;
}

/**
 * Spend points. Returns the new balance, or null when the member
 * doesn't have enough — the check happens in the database, not here.
 */
export async function spendPoints(
  memberId: string,
  amount: number,
  reason: string,
  source?: string,
  idem?: string
): Promise<number | null> {
  const { data, error } = await createClient().rpc("spend_points", {
    p_member_id: memberId,
    p_amount: amount,
    p_reason: reason,
    p_source: source ?? null,
    p_idem: idem ?? null,
  });
  if (error) return null;
  return (data as number) ?? null;
}

/** Full points history for the wallet view. */
export async function pointsHistory(memberId: string, limit = 50) {
  const { data } = await createClient()
    .from("points_ledger")
    .select("id,delta,balance_after,reason,created_at")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function logEvent(memberId: string, kind: string, label: string) {
  await createClient().from("member_events").insert({ member_id: memberId, kind, label });
}
