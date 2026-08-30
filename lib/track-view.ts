import { createClient } from "@/lib/supabase/client";

function sessionId() {
  if (typeof window === "undefined") return null;
  let s = sessionStorage.getItem("luxe-sid");
  if (!s) { s = crypto.randomUUID(); sessionStorage.setItem("luxe-sid", s); }
  return s;
}

/** Record an anonymous product view — powers Best Sellers and "also viewed". */
export async function trackProductView(product_id: string) {
  try {
    await createClient().from("product_views").insert({ product_id, session_id: sessionId() });
  } catch { /* analytics must never break the page */ }
}
