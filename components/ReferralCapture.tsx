"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/** Captures ?ref=CODE from the URL, stores it, and counts the click once. */
export default function ReferralCapture() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("ref");
    if (!code) return;
    if (localStorage.getItem("luxe-ref") !== code) {
      localStorage.setItem("luxe-ref", code);
      createClient().rpc("bump_referral_click", { p_code: code }).then(() => {});
    }
  }, []);
  return null;
}
