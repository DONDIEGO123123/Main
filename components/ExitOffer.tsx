"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/lib/useCart";
import { useFlag } from "@/lib/flags";

type Offer = { code: string; label: string };

/**
 * Shown once per visitor when they're about to leave with items in the cart.
 * Uses a real coupon configured in admin — never a fake discount.
 */
export default function ExitOffer() {
  const enabled = useFlag("exit_offer");
  const { count } = useCart();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("luxe-exit-seen")) return;
    createClient().from("settings").select("value").eq("key", "site").maybeSingle()
      .then(({ data }) => {
        const v = (data?.value ?? {}) as { exit_code?: string; exit_label?: string };
        if (v.exit_code) setOffer({ code: v.exit_code, label: v.exit_label || "הנחה מיוחדת" });
      });
  }, []);

  useEffect(() => {
    if (!offer || count === 0) return;

    const trigger = () => {
      if (localStorage.getItem("luxe-exit-seen")) return;
      localStorage.setItem("luxe-exit-seen", "1");
      setShow(true);
    };

    // desktop: pointer leaves the top of the window
    const onLeave = (e: MouseEvent) => { if (e.clientY <= 0) trigger(); };
    // mobile: tab goes to the background
    const onHide = () => { if (document.visibilityState === "hidden") trigger(); };

    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("visibilitychange", onHide);


  if (!enabled) return null;

  return () => {
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [offer, count]);

  if (!show || !offer) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm grid place-items-center p-6"
      onClick={() => setShow(false)}>
      <div className="glass-gold p-8 max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
        <p className="text-4xl mb-3">🎁</p>
        <h2 className="font-display text-2xl font-bold gold-text">רגע לפני שאתה הולך</h2>
        <p className="text-smoke mt-2">{offer.label}</p>
        <p className="font-mono text-2xl gold-text mt-4 tracking-wider" dir="ltr">{offer.code}</p>
        <p className="text-smoke text-xs mt-2">הזינו את הקוד בעמוד התשלום</p>
        <button onClick={() => setShow(false)} className="btn-gold w-full mt-6 py-3">
          המשך לקנייה
        </button>
      </div>
    </div>
  );
}
