"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import type { DeliveryArea } from "@/lib/types";

/** Stylized interactive map of Israel — regions light up on tap/hover. */
const regions: { key: string; label: string; d: string }[] = [
  { key: "north", label: "צפון", d: "M78 8 L118 14 L126 52 L108 74 L70 66 L60 34 Z" },
  { key: "haifa", label: "חיפה", d: "M60 34 L70 66 L58 84 L44 70 L48 46 Z" },
  { key: "center", label: "מרכז", d: "M44 70 L58 84 L108 74 L112 108 L64 122 L40 100 Z" },
  { key: "tel-aviv", label: "תל אביב", d: "M40 100 L64 122 L58 138 L34 126 Z" },
  { key: "jerusalem", label: "ירושלים", d: "M64 122 L112 108 L118 140 L82 152 L58 138 Z" },
  { key: "south", label: "דרום", d: "M58 138 L82 152 L118 140 L104 210 L74 262 L58 210 Z" },
];

export default function DeliveryMap({ areas }: { areas: DeliveryArea[] }) {
  const [active, setActive] = useState<string>("tel-aviv");
  const info = areas.find((a) => a.region === active);

  return (
    <div className="grid md:grid-cols-2 gap-8 items-center">
      <svg viewBox="0 0 180 280" className="mx-auto w-56 md:w-72 drop-shadow-[0_0_30px_rgba(212,175,55,0.15)]">
        {regions.map((r) => (
          <motion.path
            key={r.key}
            d={r.d}
            onClick={() => setActive(r.key)}
            onMouseEnter={() => setActive(r.key)}
            className="cursor-pointer transition-colors duration-300"
            fill={active === r.key ? "rgba(212,175,55,0.85)" : "rgba(255,255,255,0.06)"}
            stroke={active === r.key ? "#F5E7B8" : "rgba(212,175,55,0.35)"}
            strokeWidth="1.5"
            whileHover={{ scale: 1.02 }}
            style={{ transformOrigin: "center" }}
          />
        ))}
      </svg>

      <motion.div
        key={active}
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-gold p-8"
      >
        <p className="text-gold text-sm tracking-[0.3em] font-semibold">אזור משלוח</p>
        <h3 className="font-display text-3xl font-bold mt-2">
          {info?.name ?? regions.find((r) => r.key === active)?.label}
        </h3>
        <dl className="mt-6 space-y-3 text-smoke">
          <div className="flex justify-between border-b border-white/10 pb-3">
            <dt>זמן אספקה</dt>
            <dd className="text-white font-semibold">{info?.eta || "24–48 שעות"}</dd>
          </div>
          <div className="flex justify-between">
            <dt>דמי משלוח</dt>
            <dd className="text-gold font-semibold">₪{Number(info?.fee ?? 0)}</dd>
          </div>
        </dl>
        <p className="mt-6 text-sm text-smoke">בחרו אזור על המפה כדי לראות פרטי משלוח.</p>
      </motion.div>
    </div>
  );
}
