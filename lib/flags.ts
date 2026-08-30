"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type FlagKey =
  | "rewards" | "referral" | "challenges" | "daily_reward" | "mystery"
  | "polls" | "feed" | "notifications" | "compare" | "support"
  | "music" | "exit_offer";

const CACHE_KEY = "luxe-flags";

/**
 * Feature flags (#49) — switch features off from admin without touching code.
 * Cached in the browser so a slow query never delays the page.
 */
export function useFlag(key: FlagKey): boolean {
  const [on, setOn] = useState(true);

  useEffect(() => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "{}");
      if (key in cached) setOn(cached[key]);
    } catch { /* ignore */ }

    createClient().from("feature_flags").select("key,enabled")
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, boolean> = {};
        (data as { key: string; enabled: boolean }[]).forEach((f) => { map[f.key] = f.enabled; });
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(map)); } catch { /* ignore */ }
        if (key in map) setOn(map[key]);
      });
  }, [key]);

  return on;
}

/** Write an entry to the admin audit trail (#46). */
export async function logAdmin(
  action: string,
  entity: string,
  entityId?: string,
  summary?: string,
  before?: unknown,
  after?: unknown
) {
  try {
    const actor = typeof window !== "undefined"
      ? localStorage.getItem("luxe-admin-email") ?? "admin"
      : "system";

    await createClient().from("admin_log").insert({
      actor, action, entity,
      entity_id: entityId ?? null,
      summary: summary ?? "",
      before_data: before ?? null,
      after_data: after ?? null,
    });
  } catch { /* logging must never block the action it records */ }
}
