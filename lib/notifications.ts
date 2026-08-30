"use client";
import { createClient } from "@/lib/supabase/client";

export type Notification = {
  id: number;
  kind: string;
  title: string;
  body: string;
  link: string | null;
  icon: string;
  is_read: boolean;
  created_at: string;
};

export type NotificationPrefs = {
  orders: boolean; points: boolean; vip: boolean; rewards: boolean;
  stock: boolean; community: boolean; missions: boolean; new_products: boolean;
};

export const PREF_LABELS: { key: keyof NotificationPrefs; label: string; icon: string }[] = [
  { key: "orders",       label: "עדכוני הזמנות",   icon: "📦" },
  { key: "points",       label: "נקודות שנצברו",   icon: "🪙" },
  { key: "vip",          label: "שינויי דרגה",     icon: "👑" },
  { key: "rewards",      label: "הטבות וקופונים",  icon: "🎁" },
  { key: "stock",        label: "חזרה למלאי",      icon: "🔔" },
  { key: "missions",     label: "משימות והישגים",  icon: "🎯" },
  { key: "new_products", label: "מוצרים חדשים",    icon: "🆕" },
  { key: "community",    label: "עדכוני קהילה",    icon: "👥" },
];

/** Send a notification through the server function, which honours prefs and dedupe. */
export async function notify(
  memberId: string,
  kind: string,
  title: string,
  body = "",
  link?: string,
  icon = "🔔",
  dedupe?: string
) {
  try {
    await createClient().rpc("notify_member", {
      p_member_id: memberId,
      p_kind: kind,
      p_title: title,
      p_body: body,
      p_link: link ?? null,
      p_icon: icon,
      p_dedupe: dedupe ?? null,
    });
  } catch {
    /* a failed notification must never break the flow that triggered it */
  }
}

export async function listNotifications(memberId: string, limit = 40) {
  const { data } = await createClient()
    .from("notifications")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Notification[]) ?? [];
}

export async function unreadCount(memberId: string) {
  const { count } = await createClient()
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("member_id", memberId)
    .eq("is_read", false);
  return count ?? 0;
}

export async function markRead(id: number) {
  await createClient().from("notifications").update({ is_read: true }).eq("id", id);
}

export async function markAllRead(memberId: string) {
  await createClient().from("notifications")
    .update({ is_read: true }).eq("member_id", memberId).eq("is_read", false);
}

export async function loadPrefs(memberId: string): Promise<NotificationPrefs> {
  const s = createClient();
  const { data } = await s.from("notification_prefs").select("*").eq("member_id", memberId).maybeSingle();
  if (data) return data as NotificationPrefs;

  // first visit — create the row with everything on
  const defaults = {
    member_id: memberId, orders: true, points: true, vip: true, rewards: true,
    stock: true, community: true, missions: true, new_products: true,
  };
  await s.from("notification_prefs").insert(defaults);
  return defaults as NotificationPrefs;
}

export async function savePrefs(memberId: string, prefs: NotificationPrefs) {
  await createClient().from("notification_prefs")
    .upsert({ member_id: memberId, ...prefs, updated_at: new Date().toISOString() },
            { onConflict: "member_id" });
}

/** Relative time in Hebrew, for notification lists. */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "כרגע";
  if (min < 60) return `לפני ${min} דק׳`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `לפני ${hr} שע׳`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `לפני ${d} ימים`;
  return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" });
}
