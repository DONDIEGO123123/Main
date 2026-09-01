"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

type Gift = { threshold: number; label: string };

/** Progress toward a real, admin-configured perk. Hidden when none is set. */
export default function CartProgress({ subtotal }: { subtotal: number }) {
  const [gift, setGift] = useState<Gift | null>(null);

  useEffect(() => {
    createClient().from("settings").select("value").eq("key", "site").maybeSingle()
      .then(({ data }) => {
        const v = (data?.value ?? {}) as { gift_threshold?: number; gift_label?: string };
        if (v.gift_threshold && v.gift_threshold > 0 && v.gift_label) {
          setGift({ threshold: v.gift_threshold, label: v.gift_label });
        }
      });
  }, []);

  if (!gift) return null;

  const pct = Math.min(100, Math.round((subtotal / gift.threshold) * 100));
  const left = gift.threshold - subtotal;
  const done = left <= 0;

  return (
    <div className="border-t border-white/10 p-5">
      <p className="text-sm mb-2">
        {done ? `🎉 ${gift.label} — נפתח!` : `🎁 עוד ${formatPrice(left)} ל${gift.label}`}
      </p>
      <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
        <div className={`h-full transition-all duration-700 ${done ? "bg-emerald-400" : "bg-gold"}`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
