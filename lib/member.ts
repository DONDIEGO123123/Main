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

/** Award points and write a timeline entry. Recalculates the member's level. */
export async function awardPoints(memberId: string, ruleKey: string, label?: string, multiplier = 1) {
  const supabase = createClient();
  const { data: rule } = await supabase.from("point_rules")
    .select("points,label,is_active").eq("key", ruleKey).single();
  if (!rule || !rule.is_active) return;

  const delta = Math.round(rule.points * multiplier);
  if (delta === 0) return;

  const { data: m } = await supabase.from("members").select("points").eq("id", memberId).single();
  const newPoints = (m?.points ?? 0) + delta;

  const { data: levels } = await supabase.from("levels")
    .select("key,min_points").order("min_points", { ascending: false });
  const newLevel = (levels ?? []).find((l) => newPoints >= l.min_points)?.key ?? "member";

  await supabase.from("members").update({ points: newPoints, level: newLevel }).eq("id", memberId);
  await supabase.from("member_events").insert({
    member_id: memberId, kind: "points", label: label || rule.label, points_delta: delta,
  });
}

export async function logEvent(memberId: string, kind: string, label: string) {
  await createClient().from("member_events").insert({ member_id: memberId, kind, label });
}
