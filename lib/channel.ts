"use client";
import { createClient } from "@/lib/supabase/client";

/**
 * Records where the visitor came from (?src=telegram, ?src=instagram, …).
 * Stored as a plain label only — no personal identifiers.
 */
export function captureChannel() {
  if (typeof window === "undefined") return;
  try {
    const src = new URLSearchParams(window.location.search).get("src");
    if (!src) return;

    const clean = src.slice(0, 40).replace(/[^\w\-\u0590-\u05FF]/g, "");
    if (!clean) return;

    localStorage.setItem("luxe-channel", clean);

    // count the visit once per session per channel
    const key = `luxe-ch-${clean}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      createClient().from("channel_hits").insert({ channel: clean }).then(() => {}, () => {});
    }
  } catch { /* never break the page */ }
}

export function getChannel(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("luxe-channel");
}
