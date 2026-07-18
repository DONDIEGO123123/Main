"use client";
import { createClient } from "@/lib/supabase/client";

export async function trackClick(kind: "telegram" | "whatsapp") {
  try {
    const supabase = createClient();
    await supabase.from("click_events").insert({ kind, path: window.location.pathname });
  } catch {
    /* analytics must never break the UI */
  }
}
