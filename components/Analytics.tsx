"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Counts a visit once per browser session + reports realtime presence. */
export default function Analytics() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return;
    const supabase = createClient();

    // --- unique visit per session ---
    try {
      if (!sessionStorage.getItem("luxe-visit")) {
        sessionStorage.setItem("luxe-visit", "1");
        let sid = localStorage.getItem("luxe-sid");
        if (!sid) {
          sid = crypto.randomUUID();
          localStorage.setItem("luxe-sid", sid);
        }
        supabase.from("site_visits").insert({ session_id: sid, path: window.location.pathname }).then(() => {});
      }
    } catch { /* private mode etc. */ }

    // --- realtime presence: "who is online now" ---
    const key = crypto.randomUUID();
    const channel = supabase.channel("online-visitors", { config: { presence: { key } } });
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") channel.track({ at: Date.now() });
    });
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  return null;
}
