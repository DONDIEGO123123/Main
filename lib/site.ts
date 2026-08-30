"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type SiteSettings = {
  name?: string; tagline?: string;
  telegram?: string; whatsapp?: string; music_url?: string;
  vip_enabled?: boolean; vip_telegram?: string;
  wizard_enabled?: boolean;
  referral_enabled?: boolean; referral_reward?: string;
  deal_enabled?: boolean; deal_product_id?: string; deal_price?: number; deal_ends_at?: string;
  why_title?: string;
};

let cache: SiteSettings | null = null;

/** Client hook: site settings from the DB (cached per page load). */
export function useSiteSettings(): SiteSettings {
  const [s, setS] = useState<SiteSettings>(cache ?? {});
  useEffect(() => {
    if (cache) return;
    createClient().from("settings").select("value").eq("key", "site").single()
      .then(({ data }) => { cache = (data?.value as SiteSettings) ?? {}; setS(cache); });
  }, []);
  return s;
}
